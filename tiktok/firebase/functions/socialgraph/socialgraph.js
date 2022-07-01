const functions = require('firebase-functions')
const admin = require('firebase-admin')

const db = admin.firestore()

const socialGraphRef = db.collection('social_graph')

const userClient = require('../core/user')
const { fetchUser, updateUser } = userClient

const {
  getAllUsersBlockedByMe,
  getAllUsersBlockingMe,
} = require('../user-reporting/user-reporting')
const { unfriendEdge, unfollowEdge, addEdge } = require('./utils')

const {
  hydrateHomeFeedsOnAddFriend,
  hydrateStoryFeedsOnAddFriend,
} = require('../feed/common')

const collectionsUtils = require('../core/collections')

const { add, get, remove, getList, getCount } = collectionsUtils

exports.add = functions.https.onCall(async (data, context) => {
  const { sourceUserID, destUserID } = data

  const destUser = await fetchUser(destUserID)
  const sourceUser = await fetchUser(sourceUserID)

  await addEdge(sourceUserID, destUserID, 'outbound_users')
  await addEdge(destUserID, sourceUserID, 'inbound_users')

  const res = await get(
    socialGraphRef.doc(sourceUserID),
    'inbound_users',
    destUserID,
  )
  if (res) {
    console.log(
      `${destUserID} added to ${sourceUserID}'s mutual list and viceversa`,
    )
    await addEdge(sourceUserID, destUserID, 'mutual_users')
    await addEdge(destUserID, sourceUserID, 'mutual_users')

    await add(socialGraphRef.doc(sourceUserID), 'friendships', {
      user: destUser,
      type: 'reciprocal',
      id: destUserID,
    })

    await add(socialGraphRef.doc(destUserID), 'friendships', {
      user: sourceUser,
      type: 'reciprocal',
      id: sourceUserID,
    })
  } else {
    await add(socialGraphRef.doc(sourceUserID), 'friendships', {
      user: destUser,
      type: 'outbound',
      id: destUserID,
    })

    await add(socialGraphRef.doc(destUserID), 'friendships', {
      user: sourceUser,
      type: 'inbound',
      id: sourceUserID,
    })
  }

  await hydrateHomeFeedsOnAddFriend(sourceUserID, destUserID)
  await hydrateStoryFeedsOnAddFriend(sourceUserID, destUserID)

  // TODO: send push notification based on social graph type
  return { success: true }
})

exports.unfriend = functions.https.onCall(async (data, context) => {
  const { sourceUserID, destUserID } = data

  return unfriendEdge(sourceUserID, destUserID)
})

exports.unfollow = functions.https.onCall(async (data, context) => {
  const { sourceUserID, destUserID } = data

  return unfollowEdge(sourceUserID, destUserID)
})

// mutual friendships => friends
exports.fetchFriends = functions.https.onCall(async (data, context) => {
  const { userID, page, size } = data
  console.log(`fetching friends `)
  console.log(JSON.stringify(data))
  const mutualUsers = await getList(
    socialGraphRef.doc(userID),
    'mutual_users',
    page,
    size,
  )
  if (mutualUsers?.length > 0) {
    console.log(`fetched friends: `)
    console.log(JSON.stringify(mutualUsers))
    return { friends: mutualUsers, success: true }
  } else {
    return { friends: [], success: true }
  }
})

// all - inbound, outbound and mutual friendships
exports.fetchFriendships = functions.https.onCall(async (data, context) => {
  const { userID, page, size } = data
  console.log(`fetchFriendships: ${JSON.stringify(data)}`)

  const friendships = await getList(
    socialGraphRef.doc(userID),
    'friendships',
    page,
    size,
  )
  if (friendships?.length > 0) {
    console.log(`fetched friendships: `)
    console.log(JSON.stringify(friendships))
    return { friendships: friendships, success: true }
  } else {
    return { friendships: [], success: true }
  }
})

// all - inbound, outbound or mutual friendships (dictated by type param) of userID, but with the following actions of viewerID (e.g. someone else's friends, someone else's followers, etc.)
exports.fetchOtherUserFriendships = functions.https.onCall(
  async (data, context) => {
    const { viewerID, userID, type, page, size } = data

    const harshedViewerBlockedUsers = await getAllUsersBlockedByMe(viewerID) // List of users the viewer is blocking
    const harshedUsersBlockingViewers = await getAllUsersBlockingMe(viewerID) // List of users who have blocked the viewer

    const collectionName =
      type === 'reciprocal'
        ? 'mutual_users'
        : type === 'inbound'
        ? 'inbound_users'
        : 'outbound_users'

    const friendList = await getList(
      socialGraphRef.doc(userID),
      collectionName,
      page,
      size,
    )

    const friends = friendList.filter(
      friend =>
        !harshedViewerBlockedUsers[friend.id] &&
        !harshedUsersBlockingViewers[friend.id],
    )

    const promiseFriendships = friends.map(async friend => {
      const friendship = await get(
        socialGraphRef.doc(viewerID),
        'friendships',
        friend.id,
      )
      return friendship
    })

    const friendships = await Promise.all(promiseFriendships)
    var hash = {}
    friendships.forEach(friendship => {
      if (friendship?.id) {
        hash[friendship.id] = friendship.type
      }
    })

    const res = friends.map(friend => ({
      user: friend,
      id: friend.id,
      type: hash[friend.id] || 'none',
    }))

    if (res?.length > 0) {
      console.log(
        `fetchOtherUserFriendships: viewerID=${viewerID} userID=${userID} type=${type} page=${page}, size=${size}`,
      )
      console.log(JSON.stringify(hash))
      console.log(JSON.stringify(res))
      return { friendships: res, success: true }
    } else {
      return { friendships: [], success: true }
    }
  },
)

// search by keyword users who are not in the friendships set already
exports.searchUsers = functions.https.onCall(async (data, context) => {
  const searchPageLimit = 100 // never return more users than this limit

  const { userID, keyword, page, size } = data
  console.log(`searching users `)
  console.log(JSON.stringify(data))
  const usersRef = db.collection('users')

  const harshedViewerBlockedUsers = await getAllUsersBlockedByMe(userID) // List of users the viewer is blocking
  const harshedUsersBlockingViewers = await getAllUsersBlockingMe(userID) // List of users who have blocked the viewer

  const usersSnapshot = await usersRef.get()
  const users = usersSnapshot?.docs?.map(doc => doc.data())
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName} ${user.email}`
    return (
      user?.id &&
      !harshedViewerBlockedUsers[user?.id] &&
      !harshedUsersBlockingViewers[user?.id] &&
      user?.id !== userID &&
      fullName &&
      fullName.toLowerCase().indexOf(keyword.toLowerCase()) >= 0
    )
  })
  const promises = filteredUsers.map(async user => {
    const friendship = await get(
      socialGraphRef.doc(userID),
      'friendships',
      user.id,
    )
    if (!friendship) {
      return user
    }
    return null
  })
  const nonFriendUsers = await Promise.all(promises)
  const nonNullUsers = nonFriendUsers.filter(user => !!user)
  const finalUsers = nonNullUsers.slice(0, searchPageLimit)

  if (finalUsers?.length > 0) {
    console.log(`searched users : `)
    console.log(JSON.stringify(finalUsers))
    return { users: finalUsers, success: true }
  } else {
    return { users: [], success: true }
  }
})
