import { useRef } from 'react'
import { addReaction as addReactionAPI } from './firebaseChatClient'

export const useReactions = setMessages => {
  const inFlightReactionRequest = useRef(false)

  const handleMessageReaction = async (
    message,
    reactionType,
    author,
    channelID,
  ) => {
    if (inFlightReactionRequest.current === true) {
      // we already have a reaction request in flight so we don't trigger another one
      return
    }
    inFlightReactionRequest.current = true

    // we first update the UI optimistically, so the app feels fast - compute the new reaction
    if (
      message.myReaction &&
      (message.myReaction === reactionType || reactionType === null)
    ) {
      // we had the same reaction before, so this removes the reaction (e.g. unlike, unlove, etc)
      setMessages(oldMessages => {
        return oldMessages?.map(oldMessage => {
          if (oldMessage.id === message.id) {
            return {
              ...oldMessage,
              myReaction: null,
              reactionsCount: oldMessage.reactionsCount - 1,
            }
          }
          return oldMessage
        })
      })
    } else {
      // we didn't have a reaction before, so this is adding a reaction
      // OR
      // we had a different reaction before, so this is changing the reaction
      const reactionsCount = message.reactionsCount
        ? message.myReaction
          ? message.reactionsCount
          : message.reactionsCount + 1
        : 1
      setMessages(oldMessages => {
        return oldMessages?.map(oldMessage => {
          if (oldMessage.id === message.id) {
            return { ...oldMessage, myReaction: reactionType, reactionsCount }
          }
          return oldMessage
        })
      })
    }

    // Then we send the reaction to the server
    const res = await addReactionAPI(
      message.id,
      author.id,
      reactionType ? reactionType : message.myReaction,
      channelID,
    )

    inFlightReactionRequest.current = false
    return res
  }

  return {
    handleMessageReaction,
  }
}
