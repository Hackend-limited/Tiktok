const admin = require('firebase-admin')

const db = admin.firestore()

const socialGraphRef = db.collection('social_graph')

const userClient = require('../core/user')
const { fetchUser, updateUser } = userClient

const collectionsUtils = require('../core/collections')
const { add, get, remove, getList, getCount } = collectionsUtils

const {
  filterHomeFeedsOnRemoveFriend,
  filterStoryFeedsOnRemoveFriend,
} = require('../feed/common')

const updateFriendshipCountsForUser = async userID => {
  const inboundCount = await getCount(
    socialGraphRef.doc(userID),
    'inbound_users',
  )
  const outboundCount = await getCount(
    socialGraphRef.doc(userID),
    'outbound_users',
  )
  const mutualCount = await getCount(socialGraphRef.doc(userID), 'mutual_users')
  const counts = {
    outboundFriendshipCount: outboundCount,
    inboundFriendshipCount: inboundCount,
    mutualFriendshipCount: mutualCount,
  }
  await updateUser(userID, counts)
}

exports.updateFriendshipCountsForUser = updateFriendshipCountsForUser

exports.unfriendEdge = async (sourceUserID, destUserID) => {
  await removeEdge(sourceUserID, destUserID, 'outbound_users')
  await removeEdge(sourceUserID, destUserID, 'inbound_users')

  await removeEdge(destUserID, sourceUserID, 'inbound_users')
  await removeEdge(destUserID, sourceUserID, 'outbound_users')

  // Remove from mutual list
  await removeEdge(destUserID, sourceUserID, 'mutual_users')
  await removeEdge(sourceUserID, destUserID, 'mutual_users')

  // Remove from friendships
  await remove(socialGraphRef.doc(sourceUserID), 'friendships', destUserID)
  await remove(socialGraphRef.doc(destUserID), 'friendships', sourceUserID)

  filterHomeFeedsOnRemoveFriend(sourceUserID, destUserID)
  filterStoryFeedsOnRemoveFriend(sourceUserID, destUserID)
  return { success: true }
}

exports.unfollowEdge = async (sourceUserID, destUserID) => {
  await removeEdge(sourceUserID, destUserID, 'outbound_users')
  await removeEdge(destUserID, sourceUserID, 'inbound_users')

  // Remove from mutual list if needed
  await removeEdge(sourceUserID, destUserID, 'mutual_users')
  await removeEdge(destUserID, sourceUserID, 'mutual_users')

  // Remove from friendships
  await remove(socialGraphRef.doc(sourceUserID), 'friendships', destUserID)

  const friendship = await get(
    socialGraphRef.doc(destUserID),
    'friendships',
    sourceUserID,
  )
  if (friendship && friendship.type === 'reciprocal') {
    // source unfollowed dest, so friendship is transformed from reciprocal to outbound
    await add(socialGraphRef.doc(destUserID), 'friendships', {
      ...friendship,
      type: 'outbound',
    })
  } else {
    // source unfollowed dest, so friendship is transformed from (non-existent or inbound/outbound) to deleted
    await remove(socialGraphRef.doc(destUserID), 'friendships', sourceUserID)
  }
  await remove(socialGraphRef.doc(destUserID), 'friendships', sourceUserID)

  // If we still have a one-directional follow friendship, update the friendships collection

  await filterHomeFeedsOnRemoveFriend(sourceUserID, destUserID)
  await filterStoryFeedsOnRemoveFriend(sourceUserID, destUserID)

  return { success: true }
}

exports.addEdge = async (sourceUserID, destUserID, type) => {
  const destUser = await fetchUser(destUserID)

  add(socialGraphRef.doc(sourceUserID), type, destUser)
  console.log(`added edge (${sourceUserID}, ${destUserID}) as ${type}`)
  await updateFriendshipCountsForUser(sourceUserID)
  await updateFriendshipCountsForUser(destUserID)
}

const removeEdge = async (sourceUserID, destUserID, type) => {
  await remove(socialGraphRef.doc(sourceUserID), type, destUserID)
  console.log(`removed edge (${sourceUserID}, ${destUserID}) as ${type}`)
  await updateFriendshipCountsForUser(sourceUserID)
  await updateFriendshipCountsForUser(destUserID)
}
