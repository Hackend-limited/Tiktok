import { useEffect, useRef, useState } from 'react'
import {
  fetchFriends as fetchFriendsAPI,
  subscribeToFriends as subscribeToFriendsAPI,
} from '../firebaseSocialGraphClient'

const batchSize = 25

export const useSocialGraphFriends = userID => {
  const [friends, setFriends] = useState(null)
  const pagination = useRef({ page: 0, size: batchSize, exhausted: false })

  useEffect(() => {
    if (!userID) {
      return
    }
    const unsubscribe = subscribeToFriends(userID)
    return () => {
      unsubscribe && unsubscribe()
    }
  }, [userID])

  const subscribeToFriends = userID => {
    return subscribeToFriendsAPI(userID, newFriends => {
      setFriends(deduplicatedFriends(newFriends))
    })
  }

  const loadMoreFriends = async userID => {
    if (pagination.current.exhausted) {
      return
    }
    const newFriends = await fetchFriendsAPI(
      userID,
      pagination.current.page,
      pagination.current.size,
    )
    if (newFriends?.length === 0) {
      pagination.current.exhausted = true
    }
    pagination.current.page += 1
    setFriends(deduplicatedFriends(newFriends))
  }

  const deduplicatedFriends = newFriends => {
    if (!friends?.length || !newFriends?.length) {
      return friends || newFriends || []
    }

    const all = friends ? [...friends, ...newFriends] : newFriends
    const deduplicatedFriends = all.reduce((acc, curr) => {
      if (!acc.some(friend => friend.id === curr.id)) {
        acc.push(curr)
      }
      return acc
    }, [])
    return deduplicatedFriends
  }

  return {
    batchSize,
    friends,
    subscribeToFriends,
    loadMoreFriends,
  }
}
