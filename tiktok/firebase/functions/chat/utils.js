const admin = require('firebase-admin')
const { v4: uuidv4 } = require('uuid')

const db = admin.firestore()
const socialFeedsRef = db.collection('social_feeds')
const chatChannelsRef = db.collection('channels')

const userClient = require('../core/user')
const { fetchUser } = userClient

const collectionsUtils = require('../core/collections')
const { sendPushNotification } = require('../notifications/utils')
const { add } = collectionsUtils

exports.createChannel = async data => {
  console.log('Creating channel: ')
  console.log(JSON.stringify(data))

  const { id, creatorID } = data

  const channel = await chatChannelsRef.doc(id).get()
  if (channel?.exists) {
    console.log(`invalid op, channel already exists`)
    return channel.data()
  }

  await chatChannelsRef.doc(id).set(data)

  await hydrateChatFeedsForAllParticipants(
    id,
    {
      createdAt: Math.floor(new Date().getTime() / 1000),
      senderID: creatorID,
      content: 'New channel created.',
    },
    true,
  )

  return data
}

exports.insertMessage = async data => {
  const { message, channelID } = data

  const channel = await chatChannelsRef.doc(channelID).get()
  if (!channel.exists) {
    console.log(`invalid op, there no such channel`)
    return
  }

  const messageID = uuidv4()
  const messageData = {
    ...message,
    id: messageID,
    createdAt: Math.floor(new Date().getTime() / 1000),
  }

  // We first add the message to the channel
  await add(chatChannelsRef.doc(channelID), 'messages', messageData, true)

  // We've inserted a new messsage
  // We need to update channel's metadata afected by the new message (e.g. lastMessage timestamp for the current channel)
  const updatedMetadata = {
    lastMessage: message?.content?.length > 0 ? message?.content : message?.url,
    lastMessageDate: message?.createdAt,
    lastMessageSenderId: message?.senderID,
    lastThreadMessageId: messageID,
    readUserIDs: [message?.senderID],
    participantProfilePictureURLs: message?.participantProfilePictureURLs,
  }
  await chatChannelsRef.doc(channelID).set(updatedMetadata, { merge: true })

  // We now need to update all the denormalized chat feeds for all the participants in the channel
  await hydrateChatFeedsForAllParticipants(channelID, messageData)
  // Send push notifications
  await broadcastNotificationToAllParticipants(channelID, messageData)

  return { success: true }
}

const hydrateChatFeedsForAllParticipants = async (
  channelID,
  message,
  isNewChannel = false,
  isLeaveGroup = false,
) => {
  const channelSnap = await chatChannelsRef.doc(channelID).get()
  const channel = channelSnap?.data()
  const sender = await fetchUser(message.senderID)

  console.log('channel:')
  console.log(JSON.stringify(channel))
  console.log('sender:')
  console.log(JSON.stringify(sender))

  const participants = channel?.participants

  var feedItemTitleForSender = channel?.name

  const otherParticipants = participants?.filter(
    participant => participant && participant.id !== sender.id,
  )

  // if one2one chat then channel name will be other participant name
  if (!channel?.admins) {
    feedItemTitleForSender = `${otherParticipants[0].firstName} ${otherParticipants[0].lastName}`
  }

  const data = {
    id: channelID,
    title: feedItemTitleForSender ?? '',
    content: message?.content?.length > 0 ? message?.content : message?.url,
    markedAsRead: true,
    createdAt: message?.createdAt,
    participants: participants,
    creatorID: channel.creatorID,
    admins: channel?.admins ?? [],
  }

  console.log(JSON.stringify(data))

  // We update the chat feed for the sender
  await add(socialFeedsRef.doc(sender.id), 'chat_feed', data, true)

  var feedItemTitleForRecipients = channel?.name

  // if one2one chat then channel name will be other participant name
  if (!channel?.admins) {
    feedItemTitleForRecipients = `${sender?.firstName} ${sender.lastName}`
  }

  const promises = otherParticipants?.map(async participant => {
    // we update the chat feed for all the other participants
    const participantID = participant?.id
    const data2 = {
      id: channelID,
      title: feedItemTitleForRecipients,
      content: message?.content?.length > 0 ? message?.content : message?.url,
      markedAsRead: false,
      createdAt: message?.createdAt,
      participants: participants,
      creatorID: channel.creatorID,
      admins: channel?.admins ?? [],
    }
    console.log(JSON.stringify(data2))
    await add(socialFeedsRef.doc(participantID), 'chat_feed', data2, true)

    return true
  })
  await Promise.all(promises)
}

const broadcastNotificationToAllParticipants = async (channelID, message) => {
  const channelSnap = await chatChannelsRef.doc(channelID).get()
  const channel = channelSnap?.data()
  const sender = await fetchUser(message.senderID)

  if (!channel) {
    return null
  }

  const participants = channel?.participants

  const otherParticipants = participants?.filter(
    participant => participant && participant.id != sender.id,
  )

  const isGroupChat = channel.name && channel.name.length > 0
  const fromTitle = isGroupChat
    ? channel.name
    : sender.firstName + ' ' + sender.lastName
  const downloadObject = message.url

  var content = sender.firstName

  if (downloadObject) {
    if (downloadObject?.mime?.includes('video')) {
      content = content + ' ' + 'sent a video.'
    }
    if (downloadObject?.mime?.includes('image')) {
      content = content + ' ' + 'sent a photo.'
    }
    if (downloadObject?.mime?.includes('audio')) {
      content = content + ' ' + 'sent an audio.'
    }
    if (downloadObject?.mime?.includes('file')) {
      content = content + ' ' + 'sent a file.'
    }
  } else {
    if (isGroupChat) {
      content = content + ': ' + message.content
    } else {
      content = message.content
    }
  }

  const promises = otherParticipants.map(async participant => {
    await sendPushNotification(
      participant.id,
      fromTitle,
      content,
      'chat_message',
      { channleID: channelID },
    )
    return true
  })

  await Promise.all(promises)
  return null
}

exports.hydrateChatFeedsForAllParticipants = hydrateChatFeedsForAllParticipants
