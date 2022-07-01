import { useRef, useState } from 'react'
import {
  subscribeChannels as subscribeChannelsAPI,
  listChannels as listChannelsAPI,
  createChannel as createChannelAPI,
  markChannelMessageAsRead as markChannelMessageAsReadAPI,
  updateGroup as updateGroupAPI,
  leaveGroup as leaveGroupAPI,
  deleteGroup as deleteGroupAPI,
  updateTypingUsers as updateTypingUsersAPI,
} from './firebaseChatClient'

export const useChatChannels = () => {
  const [channels, setChannels] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const pagination = useRef({ page: 0, size: 25, exhausted: false })
  const realtimeChannelsRef = useRef(null)

  const loadMoreChannels = async userID => {
    if (pagination.current.exhausted) {
      return
    }
    const newChannels = await listChannelsAPI(
      userID,
      pagination.current.page,
      pagination.current.size,
    )
    if (newChannels?.length === 0) {
      pagination.current.exhausted = true
    }
    pagination.current.page += 1
    setChannels(oldChannels =>
      deduplicatedChannels(oldChannels, newChannels, true),
    )
  }

  const subscribeToChannels = userID => {
    return subscribeChannelsAPI(userID, newChannels => {
      realtimeChannelsRef.current = newChannels
      setChannels(oldChannels =>
        deduplicatedChannels(oldChannels, newChannels, false),
      )
    })
  }

  const pullToRefresh = async userID => {
    setRefreshing(true)
    pagination.current.page = 0
    pagination.current.exhausted = false

    const newChannels = await listChannelsAPI(
      userID,
      pagination.current.page,
      pagination.current.size,
    )
    if (newChannels?.length === 0) {
      pagination.current.exhausted = true
    }
    pagination.current.page += 1
    setRefreshing(false)
    setChannels(
      deduplicatedChannels(realtimeChannelsRef.current, newChannels, true),
    )
  }

  const createChannel = async (creator, otherParticipants, name, isAdmin) => {
    return await createChannelAPI(creator, otherParticipants, name, isAdmin)
  }

  const updateTypingUsers = async (channelID, typingUsers) => {
    return await updateTypingUsersAPI(channelID, typingUsers)
  }

  const markChannelMessageAsRead = async (
    channelID,
    userID,
    threadMessageID,
    readUserIDs,
    participants,
  ) => {
    return await markChannelMessageAsReadAPI(
      channelID,
      userID,
      threadMessageID,
      readUserIDs,
      participants,
    )
  }

  const updateGroup = async (channelID, userID, data) => {
    return await updateGroupAPI(channelID, userID, data)
  }

  const leaveGroup = async (channelID, userID, content) => {
    return await leaveGroupAPI(channelID, userID, content)
  }

  const deleteGroup = async (channelID) => {
    return await deleteGroupAPI(channelID)
  }

  const deduplicatedChannels = (oldChannels, newChannels, appendToBottom) => {
    if (!oldChannels?.length || !newChannels?.length) {
      return oldChannels || newChannels || []
    }

    const all = oldChannels
      ? appendToBottom
        ? [...oldChannels, ...newChannels]
        : [...newChannels, ...oldChannels]
      : newChannels
    const deduplicatedChannels = all.reduce((acc, curr) => {
      if (!acc.some(friend => friend.id === curr.id)) {
        acc.push(curr)
      }
      return acc
    }, [])
    return deduplicatedChannels
  }

  return {
    channels,
    refreshing,
    subscribeToChannels,
    loadMoreChannels,
    pullToRefresh,
    markChannelMessageAsRead,
    updateTypingUsers,
    createChannel,
    updateGroup,
    leaveGroup,
    deleteGroup,
  }
}
