const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { v4: uuidv4 } = require('uuid')

const db = admin.firestore()

const socialFeedsRef = db.collection('social_feeds')
const chatChannelsRef = db.collection('channels')

const userClient = require('../core/user')
const { fetchUser } = userClient

const collectionsUtils = require('../core/collections')
const { add, remove, getList, getDoc, deleteCollection } = collectionsUtils

const { createChannel, insertMessage } = require('./utils')

const { hydrateChatFeedsForAllParticipants } = require('./utils')

exports.createChannel = functions.https.onCall(async (data, context) => {
  return await createChannel(data)
})

exports.markAsRead = functions.https.onCall(async (data, context) => {
  console.log('Mark as read: ')
  console.log(JSON.stringify(data))

  const { channelID, userID, messageID, readUserIDs } = data

  if (messageID) {
    // update the array of readUserIDs for the last message in the channel (used for seen status facepile)
    const doc = await getDoc(
      chatChannelsRef.doc(channelID),
      'messages',
      messageID,
    )
    console.log(doc)
    if (doc?.ref) {
      doc.ref.set({ readUserIDs }, { merge: true })
    }
  }

  // mark last message as read in the channel (used for seen status facepile)
  const channel = await chatChannelsRef.doc(channelID).get()
  if (channel.exists) {
    // we only update readUserIDs if the channel exists already
    chatChannelsRef.doc(channelID).set(
      {
        readUserIDs,
      },
      { merge: true },
    )
  }

  // mark last message as read in the user's feed (used for bolding out unread messages on home screen)
  await add(socialFeedsRef.doc(userID), 'chat_feed', {
    id: channelID,
    markedAsRead: true,
  })

  return { success: true }
})

exports.updateTypingUsers = functions.https.onCall(async (data, context) => {
  console.log('Update typing users: ')
  console.log(JSON.stringify(data))

  const { channelID, typingUsers } = data

  const channel = await chatChannelsRef.doc(channelID).get()
  if (channel.exists) {
    // we only update typingUsers if the channel exists already
    chatChannelsRef.doc(channelID).set(
      {
        typingUsers,
      },
      { merge: true },
    )
  }

  return { success: true }
})

exports.listMessages = functions.https.onCall(async (data, context) => {
  const { channelID, page, size } = data
  console.log(`fetching messages `)
  console.log(JSON.stringify(data))

  const messages = await getList(
    chatChannelsRef.doc(channelID),
    'messages',
    page,
    size,
    true,
  )
  if (messages?.length > 0) {
    console.log(`fetched messages: `)
    console.log(messages)
    return { messages, success: true }
  } else {
    return { messages: [], success: true }
  }
})

exports.insertMessage = functions.https.onCall(async (data, context) => {
  return await insertMessage(data)
})

exports.deleteMessage = functions.https.onCall(async (data, context) => {
  const { channelID, messageID } = data

  await remove(chatChannelsRef.doc(channelID), 'messages', messageID, true)
  console.log(`Delete message ${messageID}`)

  // We've removed the message, and now we need to update the channel metadata, and hydrate all social chat feeds of the participants

  // First, we find the message that was previously posted in the thread (e.g. the new "last message"), so we can update the chat previews. We consider both the live and historical collections to make sure we get the latest message
  const liveMessageSnapshot = await chatChannelsRef
    .doc(channelID)
    .collection('messages_live')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get()
  const historicalMessageSnapshot = await chatChannelsRef
    .doc(channelID)
    .collection('messages_historical')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get()
  var lastMessage = null
  if (liveMessageSnapshot?.docs?.length > 0) {
    lastMessage = liveMessageSnapshot.docs[0].data()
  }
  if (historicalMessageSnapshot?.docs?.length > 0) {
    const tempMessage = historicalMessageSnapshot.docs[0].data()
    if (lastMessage) {
      lastMessage =
        tempMessage.createdAt > lastMessage?.createdAt
          ? tempMessage
          : lastMessage
    } else {
      lastMessage = tempMessage
    }
  }
  var updatedMetadata = {
    lastMessage: '',
    lastMessageDate: '',
    lastMessageSenderId: '',
    lastThreadMessageId: '',
    readUserIDs: [],
    participantProfilePictureURLs: [],
  }
  if (lastMessage) {
    updatedMetadata = {
      lastMessage:
        lastMessage.content.length > 0 ? lastMessage.content : lastMessage.url,
      lastMessageDate: lastMessage.createdAt,
      lastMessageSenderId: lastMessage.senderID,
      lastThreadMessageId: lastMessage._id,
      readUserIDs: [lastMessage.senderID],
      participantProfilePictureURLs: lastMessage.participantProfilePictureURLs,
    }
  }
  // We update channel's metadata afected by the new message
  await chatChannelsRef.doc(channelID).set(updatedMetadata, { merge: true })

  // Then we hydrate all the participants' chat feeds
  await hydrateChatFeedsForAllParticipants(channelID, messageData)

  return { success: true }
})

exports.listChannels = functions.https.onCall(async (data, context) => {
  const { userID, page, size } = data
  console.log(`fetching chat channels `)
  console.log(JSON.stringify(data))

  const channels = await getList(
    socialFeedsRef.doc(userID),
    'chat_feed',
    page,
    size,
    true,
  )
  if (channels?.length > 0) {
    console.log(`fetched channels: `)
    console.log(JSON.stringify(channels))
    return { channels, success: true }
  } else {
    return { channels: [], success: true }
  }
})

exports.addMessageReaction = functions.https.onCall(async (data, context) => {
  console.log(`Reacting to Message: ${JSON.stringify(data)}`)

  const reactionKeys = [
    'like',
    'love',
    'laugh',
    'angry',
    'surprised',
    'cry',
    'sad',
  ]

  const { authorID, messageID, reaction, channelID } = data

  if (messageID) {
    const messageDoc = await getDoc(
      chatChannelsRef.doc(channelID),
      'messages',
      messageID,
    )
    if (messageDoc.exists) {
      const message = messageDoc.data()

      const messageReactionsDict = message?.reactions ? message?.reactions : reactionKeys.reduce((a, v) => ({
        ...a,
        [v]: []
      }), {})
      var newMessageReactionsDict = {}
      var reactionsCount = message?.reactionsCount ? message?.reactionsCount : 0

      const userReactionKey = reactionKeys?.find(
        key => messageReactionsDict[key] && messageReactionsDict[key]?.includes(authorID),
      )
      if (userReactionKey) {
        // This user already had a reaction on this post in the past, so we remove it or replace it
        if (userReactionKey === reaction) {
          // The reaction is the same, so we remove it
          newMessageReactionsDict = { ...messageReactionsDict }
          newMessageReactionsDict[userReactionKey] = messageReactionsDict[
            userReactionKey
            ].filter(id => id !== authorID)
          reactionsCount = reactionsCount - 1
        } else {
          // The reaction is different, so we replace it
          newMessageReactionsDict = { ...messageReactionsDict }
          newMessageReactionsDict[userReactionKey] = messageReactionsDict[
            userReactionKey
            ].filter(id => id !== authorID) // remove the old reaction
          newMessageReactionsDict[reaction] = [
            ...newMessageReactionsDict[reaction],
            authorID,
          ] // add the new reaction
        }
      } else {
        // This user had no reaction on this post in the past, so we add it
        newMessageReactionsDict = { ...messageReactionsDict }
        newMessageReactionsDict[reaction] = [
          ...newMessageReactionsDict[reaction],
          authorID,
        ] // add the new reaction
        reactionsCount = reactionsCount + 1
      }
      const newMessageData = { reactions: newMessageReactionsDict, reactionsCount }

      if (messageDoc?.ref) {
        messageDoc.ref.set(newMessageData, { merge: true })
      }
      return { ...message, ...newMessageData }
    }
  } else {
    return { success: false }
  }
})

exports.updateGroup = functions.https.onCall(async (data, context) => {
  console.log('Renaming group: ')
  console.log(JSON.stringify(data))

  const { channelID, userID, channelData } = data
  const { content, ...rest } = channelData
  const user = await fetchUser(userID)

  await chatChannelsRef.doc(channelID).set(rest, { merge: true })

  await hydrateChatFeedsForAllParticipants(
    channelID,
    {
      createdAt: Math.floor(new Date().getTime() / 1000),
      senderID: userID,
      content: content,
      // content: `${user?.firstName ?? 'Someone'} has renamed the group.`,
    },
    false,
  )

  return { success: true }
})

exports.deleteGroup = functions.https.onCall(async (data, context) => {
  console.log('Deleting group: ')
  console.log(JSON.stringify(data))

  const { channelID } = data
  const channelDoc = await chatChannelsRef.doc(channelID).get()
  if (channelDoc.exists) {
    const channel = channelDoc.data()
    const { participants } = channel
    const promises = participants?.map(async participant => {
      // we update the chat feed for all the other participants
      const participantID = participant?.id
      await remove(socialFeedsRef.doc(participantID), 'chat_feed', channelID, true)
      return true
    })
    await Promise.all(promises)
    await chatChannelsRef.doc(channelID).delete()
    await deleteCollection(db, chatChannelsRef.doc(channelID).collection('messages_live'))
    await deleteCollection(db, chatChannelsRef.doc(channelID).collection('messages_historical'))
  }

  return { success: true }
})

exports.leaveGroup = functions.https.onCall(async (data, context) => {
  console.log('Leaving group: ')
  console.log(JSON.stringify(data))

  const { channelID, userID, content } = data
  const channelDocRef = chatChannelsRef.doc(channelID)
  const channelDoc = await channelDocRef.get()
  console.log('Leaving group get doc:', channelDoc.exists)
  if (channelDoc.exists) {
    const channel = channelDoc.data()
    const { participants, admins } = channel
    const newParticipants = participants.filter(p => p?.id !== userID)
    const newAdmins = admins.filter(p => p !== userID)
    await chatChannelsRef
      .doc(channelID)
      .set({ participants: newParticipants, admins: newAdmins }, { merge: true })
  }

  await hydrateChatFeedsForAllParticipants(
    channelID,
    {
      createdAt: Math.floor(new Date().getTime() / 1000),
      senderID: userID,
      content: content,
    },
    false,
  )

  await remove(socialFeedsRef.doc(userID), 'chat_feed', channelID, true)

  return { success: true }
})
