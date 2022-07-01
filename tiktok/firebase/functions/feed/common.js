const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { v4: uuidv4 } = require('uuid')

const db = admin.firestore()

const canonicalPostsRef = db.collection('posts')
const canonicalStoriesRef = db.collection('stories')
const socialFeedsRef = db.collection('social_feeds')
const hashtagFeedsRef = db.collection('hashtags')

const collectionsUtils = require('../core/collections')
const { add, remove, getList } = collectionsUtils

/*
 ** For a given post, we add its copy into all of the relevant timelines
 ** where the post should appear (e.g all home timelines for the author, all
 ** home timelines for the author's friends, etc)
 */
const hydrateFeeds = async postID => {
  const post = await fetchPost(postID)
  const { authorID } = post
  const allUsers = await fetchFeedUsersRelatedToUser(authorID)

  const promises = allUsers.map(async userID => {
    await add(socialFeedsRef.doc(userID), 'home_feed', post, true)
  })

  await Promise.all(promises)

  // We update the profile feed for the author
  await add(socialFeedsRef.doc(authorID), 'profile_feed', post, true)

  // We update the hastags search index collection
  await hydrateEntityFeeds(post)
}

const hydrateHomeFeedsOnAddFriend = async (sourceUserID, destUserID) => {
  const snapshot = await canonicalPostsRef
    .where('authorID', '==', destUserID)
    .orderBy('createdAt', 'asc')
    .limit(100)
    .get()
  const posts = snapshot.docs.map(doc => doc.data())

  if (posts?.length > 0) {
    posts.forEach(async post => {
      await add(socialFeedsRef.doc(sourceUserID), 'home_feed', post, true)
    })
  }
}

const filterHomeFeedsOnRemoveFriend = async (sourceUserID, destUserID) => {
  const historicalSnapshot = await socialFeedsRef
    .doc(sourceUserID)
    .collection('home_feed_historical')
    .where('authorID', '==', destUserID)
    .get()
  const liveSnapshot = await socialFeedsRef
    .doc(sourceUserID)
    .collection('home_feed_live')
    .where('authorID', '==', destUserID)
    .get()

  historicalSnapshot.forEach(doc => {
    doc.ref.delete()
  })
  liveSnapshot.forEach(doc => {
    doc.ref.delete()
  })
}

const hydrateStoryFeedsOnAddFriend = async (sourceUserID, destUserID) => {
  const snapshot = await canonicalStoriesRef
    .where('authorID', '==', destUserID)
    .orderBy('createdAt', 'asc')
    .limit(100)
    .get()
  const stories = snapshot.docs.map(doc => doc.data())

  if (stories?.length > 0) {
    stories.forEach(async story => {
      await add(socialFeedsRef.doc(sourceUserID), 'stories_feed', story, true)
    })
  }
}

const filterStoryFeedsOnRemoveFriend = async (sourceUserID, destUserID) => {
  const historicalSnapshot = await socialFeedsRef
    .doc(sourceUserID)
    .collection('stories_feed_historical')
    .where('authorID', '==', destUserID)
    .get()
  const liveSnapshot = await socialFeedsRef
    .doc(sourceUserID)
    .collection('stories_feed_live')
    .where('authorID', '==', destUserID)
    .get()

  historicalSnapshot.forEach(doc => {
    doc.ref.delete()
  })
  liveSnapshot.forEach(doc => {
    doc.ref.delete()
  })
}

/*
 ** For a given story, we add its copy into all of the relevant timelines
 ** where the story should appear (e.g all story feeds for the author, all
 ** story feeds for the author's friends, etc)
 */
const hydrateStoryFeeds = async storyID => {
  const story = await fetchStory(storyID)
  const { authorID } = story
  const allUsers = await fetchFeedUsersRelatedToUser(authorID)

  const promises = allUsers.map(async userID => {
    await add(socialFeedsRef.doc(userID), 'stories_feed', story, true)
  })
  await Promise.all(promises)
}

/*
 ** When a post is deleted, we delete it from all the relevant feed subcollections
 */
const updateFeedsUponPostDeletion = async (postID, authorID) => {
  console.log(
    `Deleting post from all feeds postID=${postID} userID=${authorID}`,
  )
  const users = await fetchFeedUsersRelatedToUser(authorID)

  const promises = users.map(async userID => {
    await remove(socialFeedsRef.doc(userID), 'home_feed', postID, true)
  })

  await Promise.all(promises)

  // We update the profile feed for the author
  await remove(socialFeedsRef.doc(authorID), 'profile_feed', postID, true)

  // We remove the post from the hashtags search index collection
  await remove(hashtagFeedsRef.doc(hashtag), 'feed', postID, true)
}

/*
 ** When a story gets deleted, we delete it from all the relevant stories feeds of friends and followers
 */
const updateFeedsUponStoryDeletion = async (storyID, authorID) => {
  console.log(
    `Deleting story from all feeds storyID=${storyID} userID=${authorID}`,
  )
  const users = await fetchFeedUsersRelatedToUser(authorID)

  const promises = users.map(async userID => {
    await remove(socialFeedsRef.doc(userID), 'stories_feed', postID, true)
  })

  await Promise.all(promises)
}

/*
 ** Returns the canonical post for a given post ID
 */
const fetchPost = async postID => {
  const doc = await canonicalPostsRef.doc(postID).get()
  if (doc?.exists) {
    return doc.data()
  }
  return null
}

/*
 ** Returns the canonical story for a given ID
 */
const fetchStory = async storyID => {
  const doc = await canonicalStoriesRef.doc(storyID).get()
  if (doc?.exists) {
    return doc.data()
  }
  return null
}

const fetchFeedUsersRelatedToUser = async userID => {
  const socialGraphRef = db.collection('social_graph')
  var collectionName = 'inbound_users'


  const liveList = await getList(
    socialGraphRef.doc(userID),
    collectionName,
    -1,
    0,
    false,
  )

  // TODO: if you have users with more than 100,000 friends/followers, you should improve this algorithm to batch the updates, rather than doing them at once
  const historicalList = await getList(
    socialGraphRef.doc(userID),
    collectionName,
    0,
    100000,
    true,
  )

  // We return the author and all of the author's friends/followers
  const inboundUsers = [...liveList, ...historicalList].map(user => user?.id)
  const allUsers = [userID].concat(inboundUsers)
  return allUsers
}

/**
 * Inserts a new post into all the relevant entity feeds (hashtags, mentions, etc)
 */
const hydrateEntityFeeds = async post => {
  const { hashtags } = post
  console.log(`hydrateEntityFeeds hashtags: ${hashtags} for postID=${post.id}`)
  const promises = hashtags.map(async hashtag => {
    await add(hashtagFeedsRef.doc(hashtag), 'feed', post, true)
  })

  await Promise.all(promises)
}

exports.hydrateFeeds = hydrateFeeds
exports.hydrateStoryFeeds = hydrateStoryFeeds
exports.fetchPost = fetchPost
exports.updateFeedsUponPostDeletion = updateFeedsUponPostDeletion
exports.updateFeedsUponStoryDeletion = updateFeedsUponStoryDeletion
exports.hydrateHomeFeedsOnAddFriend = hydrateHomeFeedsOnAddFriend
exports.hydrateStoryFeedsOnAddFriend = hydrateStoryFeedsOnAddFriend
exports.filterHomeFeedsOnRemoveFriend = filterHomeFeedsOnRemoveFriend
exports.filterStoryFeedsOnRemoveFriend = filterStoryFeedsOnRemoveFriend
