import { firebase } from '@react-native-firebase/firestore'
import functions from '@react-native-firebase/functions'
import uuidv4 from 'uuidv4'
import { getUnixTimeStamp } from '../../../helpers/timeFormat'

const channelsRef = firebase.firestore().collection('channels')
const socialFeedsRef = firebase.firestore().collection('social_feeds')

export const subscribeChannels = (userID, callback) => {
  return socialFeedsRef
    .doc(userID)
    .collection('chat_feed_live')
    .orderBy('createdAt', 'desc')
    .onSnapshot({ includeMetadataChanges: true }, snapshot =>
      callback(snapshot?.docs.map(doc => doc.data())),
    )
}

export const subscribeToSingleChannel = (channelID, callback) => {
  return channelsRef.doc(channelID).onSnapshot(doc => callback(doc?.data()))
}

export const listChannels = async (userID, page = 0, size = 1000) => {
  const instance = functions().httpsCallable('listChannels')
  try {
    const res = await instance({
      userID,
      page,
      size,
    })

    return res?.data?.channels
  } catch (error) {
    console.log(error)
    return null
  }
}

export const createChannel = async (
  creator,
  otherParticipants,
  name,
  isAdmin = false,
) => {
  var channelID = uuidv4()
  const id1 = creator.id
  if (otherParticipants?.length === 1) {
    const id2 = otherParticipants[0].id || otherParticipants[0].userID
    if (id1 === id2) {
      // We should never create a self chat
      return null
    }
    // For any 1-1 chat, the id of the channel is the concatanation of the two user ids (in alphabetical order)
    channelID = id1 < id2 ? id1 + id2 : id2 + id1
  }

  let data = {
    creatorID: id1,
    id: channelID,
    channelID,
    name: name || '',
    participants: [...otherParticipants, creator],
  }

  if (isAdmin) {
    data['admins'] = [creator?.id]
  }
  const instance = functions().httpsCallable('createChannel')
  try {
    const res = await instance(data)

    return res?.data
  } catch (error) {
    console.log('create error', error)
    return null
  }
}

export const markChannelMessageAsRead = async (
  channelID,
  userID,
  messageID,
  readUserIDs,
  participants,
) => {
  const instance = functions().httpsCallable('markAsRead')
  try {
    const res = await instance({
      channelID,
      userID,
      messageID,
      readUserIDs,
    })

    return res?.data
  } catch (error) {
    console.log(error)
    return null
  }
}

export const updateTypingUsers = async (channelID, typingUsers) => {
  const instance = functions().httpsCallable('updateTypingUsers')
  try {
    const res = await instance({
      channelID,
      typingUsers,
    })

    return res?.data
  } catch (error) {
    console.log(error)
    return null
  }
}

export const sendMessage = async (
  sender,
  channel,
  message,
  downloadURL,
  inReplyToItem,
  participantProfilePictureURLs,
) => {
  const { profilePictureURL } = sender
  const userID = sender.id
  const timestamp = currentTimestamp()

  const data = {
    ...message,
    createdAt: timestamp,
    recipientFirstName: '',
    recipientID: '',
    recipientLastName: '',
    recipientProfilePictureURL: '',
    senderFirstName: sender.firstName || sender.fullname,
    senderID: userID,
    senderLastName: '',
    senderProfilePictureURL: profilePictureURL,
    url: downloadURL,
    inReplyToItem: inReplyToItem,
    readUserIDs: [userID],
    participantProfilePictureURLs,
  }

  const instance = functions().httpsCallable('insertMessage')
  try {
    const res = await instance({
      channelID: channel?.id,
      message: data,
    })

    return res?.data
  } catch (error) {
    console.log(error)
    return null
  }
}

export const deleteMessage = async (channel, messageID) => {
  if (!channel?.id || !messageID) {
    return
  }
  const instance = functions().httpsCallable('deleteMessage')
  try {
    const res = instance({
      channelID: channel?.id,
      messageID: messageID,
    })

    return res?.data
  } catch (error) {
    console.log(error)
    return null
  }
}

export const subscribeToMessages = (channelID, callback) => {
  return channelsRef
    .doc(channelID)
    .collection('messages_live')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      { includeMetadataChanges: true },
      snapshot => callback && callback(snapshot?.docs.map(doc => doc.data())),
    )
}

export const listMessages = async (channelID, page = 0, size = 1000) => {
  const instance = functions().httpsCallable('listMessages')
  try {
    const res = await instance({
      channelID,
      page,
      size,
    })

    return res?.data?.messages ?? []
  } catch (error) {
    console.log(error)
    return []
  }
}

export const deleteGroup = async (channelID) => {
  const instance = functions().httpsCallable('deleteGroup')
  try {
    const res = await instance({
      channelID,
    })

    return res?.data
  } catch (error) {
    console.log(error)
    return null
  }
}

export const leaveGroup = async (channelID, userID, content) => {
  const instance = functions().httpsCallable('leaveGroup')
  try {
    const res = await instance({
      channelID,
      userID,
      content,
    })

    return res?.data
  } catch (error) {
    console.log(error)
    return null
  }
}

export const updateGroup = async (channelID, userID, newData) => {
  const instance = functions().httpsCallable('updateGroup')
  try {
    const res = await instance({
      channelID,
      userID,
      channelData: newData,
    })

    return res?.data
  } catch (error) {
    console.log(error)
    return null
  }
}

export const currentTimestamp = () => {
  return getUnixTimeStamp()
}

export const addReaction = async (messageID, authorID, reaction, channelID) => {
  const instance = functions().httpsCallable('addMessageReaction')
  try {
    const res = await instance({
      authorID,
      messageID,
      reaction,
      channelID,
    })
    return res?.data
  } catch (error) {
    console.log(error)
    return null
  }
}
