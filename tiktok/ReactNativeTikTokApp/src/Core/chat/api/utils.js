export const hydrateMessagesWithMyReactions = (messages, userID) => {
  return messages?.map(message => {
    const myReaction = getMyReaction(message.reactions, userID)
    return myReaction ? { ...message, myReaction } : message
  })
}

const getMyReaction = (reactionsDict, userID) => {
  const reactionKeys = [
    'like',
    'love',
    'laugh',
    'angry',
    'surprised',
    'cry',
    'sad',
  ]
  var result = null
  reactionKeys.forEach(reactionKey => {
    if (
      reactionsDict &&
      reactionsDict[reactionKey] &&
      reactionsDict[reactionKey].includes(userID)
    ) {
      result = reactionKey
    }
  })

  return result
}
