import { useRef, useState } from 'react'
import {
  sendMessage as sendMessageAPI,
  deleteMessage as deleteMessageAPI,
  subscribeToMessages as subscribeMessagesAPI,
  listMessages as listMessagesAPI,
} from './firebaseChatClient'
import { useReactions } from './useReactions'
import { hydrateMessagesWithMyReactions } from '../utils'
import { useCurrentUser } from '../../../onboarding'

export const useChatMessages = () => {
  const [messages, setMessages] = useState(null)

  const pagination = useRef({ page: 0, size: 25, exhausted: false })

  const { handleMessageReaction } = useReactions(setMessages)
  const currentUser = useCurrentUser()

  const addReaction = async (message, author, reaction, channelID) => {
    await handleMessageReaction(message, reaction, author, channelID)
  }

  const loadMoreMessages = async channelID => {
    if (pagination.current.exhausted) {
      return
    }
    const newMessages = await listMessagesAPI(
      channelID,
      pagination.current.page,
      pagination.current.size,
    )
    if (newMessages?.length === 0) {
      pagination.current.exhausted = true
    }
    pagination.current.page += 1
    setMessages(
      hydrateMessagesWithMyReactions(
        deduplicatedMessages(messages, newMessages, true),
        currentUser?.id,
      ),
    )
  }

  const subscribeToMessages = channelID => {
    return subscribeMessagesAPI(channelID, newMessages => {
      setMessages(prevMessages =>
        hydrateMessagesWithMyReactions(
          deduplicatedMessages(prevMessages, newMessages, false),
          currentUser?.id,
        ),
      )
    })
  }

  const sendMessage = async (
    sender,
    channel,
    message,
    downloadURL,
    inReplyToItem,
    participantProfilePictureURLs,
  ) => {
    return sendMessageAPI(
      sender,
      channel,
      message,
      downloadURL,
      inReplyToItem,
      participantProfilePictureURLs,
    )
  }

  const deleteMessage = async (channel, threadItemID) => {
    return deleteMessageAPI(channel, threadItemID)
  }

  const deduplicatedMessages = (messages, newMessages, appendToBottom) => {
    if (!messages?.length || !newMessages?.length) {
      return messages || newMessages || []
    }

    // We merge, dedup and sort the two message lists
    const all = messages
      ? appendToBottom
        ? [...messages, ...newMessages]
        : [...newMessages, ...messages]
      : newMessages
    const deduplicatedMessages = all.reduce((acc, curr) => {
      if (!acc.some(friend => friend.id === curr.id)) {
        acc.push(curr)
      }
      return acc
    }, [])
    return deduplicatedMessages.sort((a, b) => {
      return b.createdAt - a.createdAt
    })
  }

  return {
    messages,
    subscribeToMessages,
    loadMoreMessages,
    sendMessage,
    deleteMessage,
    addReaction,
  }
}
