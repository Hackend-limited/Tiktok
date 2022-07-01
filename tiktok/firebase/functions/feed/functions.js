const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { v4: uuidv4 } = require('uuid')

const db = admin.firestore()

const canonicalPostsRef = db.collection('posts')
const canonicalStoriesRef = db.collection('stories')
const socialFeedsRef = db.collection('social_feeds')

const userClient = require('../core/user')
const { fetchUser, updateUser } = userClient

const {
  getAllUsersBlockedByMe,
  getAllUsersBlockingMe,
} = require('../user-reporting/user-reporting')

const collectionsUtils = require('../core/collections')
const { getList, add, get } = collectionsUtils

const { fetchPost } = require('./common')
const { sendPushNotification } = require('../notifications/utils')

exports.addStory = functions.https.onCall(async (data, context) => {
  console.log(`Adding new story: ${JSON.stringify(data)}`)

  // We set all the db fields for the new post
  const { authorID, storyData } = data
  const author = await fetchUser(authorID)
  const storyID = uuidv4()
  const story = {
    id: storyID,
    ...storyData,
    authorID,
    author: author,
    createdAt: Math.floor(new Date().getTime() / 1000),
    viewsCount: 0,
    reactionsCount: 0,
  }

  // We insert the new story into canonical collection (source of truth)
  await canonicalStoriesRef.doc(storyID).set(story, { merge: true })

  // We update all the stories feed for the followers / friends of the author (we include the author too, as we want the post to appear in their own timeline)
  // This gets done in feed/trigger.js
})

exports.addPost = functions.https.onCall(async (data, context) => {
  console.log(`Adding new post: ${JSON.stringify(data)}`)

  // We set all the db fields for the new post
  const { authorID, postData } = data
  const { postText } = postData
  const author = await fetchUser(authorID)
  const postID = uuidv4()
  const hashtags = extractHashtags(postText)
  const post = {
    id: postID,
    ...postData,
    authorID,
    author: author,
    hashtags,
    createdAt: Math.floor(new Date().getTime() / 1000),
    commentCount: 0,
    reactionsCount: 0,
    reactions: {
      like: [], // the list of userIDs who liked the post
      love: [],
      laugh: [],
      angry: [],
      suprised: [],
      cry: [],
      sad: [],
    },
  }

  // TODO: Compute mentions

  // We insert the new post into canonical collection (source of truth)
  await canonicalPostsRef.doc(postID).set(post, { merge: true })

  // We update all the timelines for the followers / friends of the author (we include the author too, as we want the post to appear in their own timeline)
  // This gets done in trigger.js

  // We update the author user data, with the new post count
  const prevCount = author.postCount || 0
  await updateUser(authorID, { postCount: prevCount + 1 })
})

exports.deletePost = functions.https.onCall(async (data, context) => {
  console.log(`Deleting  post: ${JSON.stringify(data)}`)

  const { authorID, postID } = data

  // TODO: Remove from hashtags

  // Remove the post from the canonical collection (source of truth)
  await canonicalPostsRef.doc(postID).delete()

  // We update all the timelines for the followers / friends of the author (we include the author too, as we want the post to appear in their own timeline)
  // This gets done in trigger.js

  // We update the author user data, with the new post count
  const author = await fetchUser(authorID)
  await updateUser(authorID, { postCount: (author.postCount || 1) - 1 })
})

exports.addReaction = functions.https.onCall(async (data, context) => {
  console.log(`Reacting to post: ${JSON.stringify(data)}`)

  const reactionKeys = [
    'like',
    'love',
    'laugh',
    'angry',
    'suprised',
    'cry',
    'sad',
  ]

  const { authorID, postID, reaction } = data
  const post = await fetchPost(postID)
  const postReactionsDict = post.reactions
  var newPostReactionsDict = {}
  var reactionsCount = post.reactionsCount

  const reactionKeyForAuthorAndPost = reactionKeys.find(
    key => postReactionsDict[key] && postReactionsDict[key].includes(authorID),
  )

  if (reactionKeyForAuthorAndPost) {
    // This user already had a reaction on this post in the past, so we remove it or replace it
    if (reactionKeyForAuthorAndPost === reaction) {
      // The reaction is the same, so we remove it
      newPostReactionsDict = { ...postReactionsDict }
      newPostReactionsDict[reactionKeyForAuthorAndPost] = postReactionsDict[
        reactionKeyForAuthorAndPost
      ].filter(id => id !== authorID)
      reactionsCount = reactionsCount - 1
    } else {
      // The reaction is different, so we replace it
      newPostReactionsDict = { ...postReactionsDict }
      newPostReactionsDict[reactionKeyForAuthorAndPost] = postReactionsDict[
        reactionKeyForAuthorAndPost
      ].filter(id => id !== authorID) // remove the old reaction
      newPostReactionsDict[reaction] = [
        ...newPostReactionsDict[reaction],
        authorID,
      ] // add the new reaction
    }
  } else {
    // This user had no reaction on this post in the past, so we add it
    newPostReactionsDict = { ...postReactionsDict }
    newPostReactionsDict[reaction] = [
      ...newPostReactionsDict[reaction],
      authorID,
    ] // add the new reaction
    reactionsCount = reactionsCount + 1

    // we also send a push notification to the author of the post (if it's not the author of the reaction)
    if (post.authorID !== authorID) {
      const reactionAuthor = await fetchUser(authorID)
      await sendPushNotification(
        post.authorID,
        'Instamobile',
        `${reactionAuthor.firstName} reacted to your post.`,
        'feed_reaction',
        { postID: postID, reactionAuthorID: authorID },
      )
    }
  }
  const newPostData = { reactions: newPostReactionsDict, reactionsCount }
  await canonicalPostsRef.doc(postID).set(newPostData, { merge: true })
  return { ...post, ...newPostData }
})

exports.addComment = functions.https.onCall(async (data, context) => {
  console.log(`Adding comment to post: ${JSON.stringify(data)}`)

  const { authorID, postID, commentText } = data
  const author = await fetchUser(authorID)
  const commentID = uuidv4()
  const commentData = {
    id: commentID,
    commentText,
    authorID,
    author,
    postID,
    createdAt: Math.floor(new Date().getTime() / 1000),
  }

  // Insert the comment into the posts' comments list
  await add(canonicalPostsRef.doc(postID), 'comments', commentData, true)

  // We update the post data, with the new comment count
  const post = await fetchPost(postID)
  const { commentCount } = post
  const postData = { commentCount: commentCount + 1 }
  await canonicalPostsRef.doc(postID).set(postData, { merge: true })

  // We send a push notification to the author of the post
  if (post.authorID !== authorID) {
    await sendPushNotification(
      post.authorID,
      'Instamobile',
      `${author.firstName} commented to your post.`,
      'feed_comment',
      {
        postID: postID,
        commentAuthorID: authorID,
      },
    )
  }

  return commentData
})

exports.listHomeFeedPosts = functions.https.onCall(async (data, context) => {
  const { userID, page, size } = data
  console.log(`Fetching home feed for ${JSON.stringify(data)} `)

  const posts = await getList(
    socialFeedsRef.doc(userID),
    'home_feed',
    page,
    size,
    true,
  )
  if (posts?.length > 0) {
    console.log(`fetched posts: `)
    console.log(posts)
    return { posts, success: true }
  } else {
    return { posts: [], success: true }
  }
})

exports.listProfileFeedPosts = functions.https.onCall(async (data, context) => {
  const { userID, page, size } = data
  console.log(`Fetching profile feed for ${JSON.stringify(data)} `)

  const posts = await getList(
    socialFeedsRef.doc(userID),
    'profile_feed',
    page,
    size,
    true,
  )
  if (posts?.length > 0) {
    console.log(`fetched posts: ${JSON.stringify(posts)}`)
    return { posts, success: true }
  } else {
    return { posts: [], success: true }
  }
})

exports.listComments = functions.https.onCall(async (data, context) => {
  const { postID, page, size } = data
  console.log(`Fetching comments for ${JSON.stringify(data)} `)

  const comments = await getList(
    canonicalPostsRef.doc(postID),
    'comments',
    page,
    size,
    true,
  )
  if (comments?.length > 0) {
    console.log(`fetched comments: `)
    console.log(comments)
    return { comments, success: true }
  } else {
    return { comments: [], success: true }
  }
})

exports.fetchProfile = functions.https.onCall(async (data, context) => {
  const { profileID, viewerID, page, size } = data
  console.log(`Fetching profile for ${JSON.stringify(data)} `)
  const socialGraphRef = db.collection('social_graph')

  // Profile Data
  const profile = await fetchUser(profileID)
  var result = { user: profile, success: true }


  // Button Action Data
  if (profileID === viewerID) {
    // This is my profile (user looking at their own profile)
    result = { ...result, actionButtonType: 'settings' }
  } else {
    // This is someone else's profile - we show either "Send Message" or "Add / Follow" button
    var collectionName = 'outbound_users'
    const friend = await get(
      socialGraphRef.doc(viewerID),
      collectionName,
      profileID,
    )
    if (friend) {
      // This user is already a friend of the profile user. so show DM button
      result = { ...result, actionButtonType: 'message' }
    } else {
      // This user is not a friend of the profile user. so show Add / Follow button
      result = { ...result, actionButtonType: 'add' }
    }
  }

  console.log(`fetched profileData: ${JSON.stringify(result)} `)
  return { profileData: result, success: true }
  // TODO: Handle errors
})

exports.listDiscoverFeedPosts = functions.https.onCall(
  async (data, context) => {
    const { userID, page, size } = data
    console.log(`Fetching discover/explore feed for ${JSON.stringify(data)} `)

    const harshedUsersBlockedByMe = await getAllUsersBlockedByMe(userID) // List of users blocked by me
    const harshedUsersBlockingMe = await getAllUsersBlockingMe(userID) // List of users blocking me

    console.log(
      `harshedUsersBlockingMe : => ${JSON.stringify(harshedUsersBlockingMe)} `,
    )
    console.log(
      `harshedUsersBlockedByMe =>: ${JSON.stringify(harshedUsersBlockedByMe)} `,
    )

    const posts = await fetchNonRelatedPosts(userID, page, size, [])

    const finalPosts = posts.filter(
      post =>
        post.authorID &&
        !harshedUsersBlockedByMe[post.authorID] &&
        !harshedUsersBlockingMe[post.authorID],
    )
    if (finalPosts?.length > 0) {
      console.log(`fetched posts: ${JSON.stringify(finalPosts)} `)
      return { posts: finalPosts, success: true }
    } else {
      return { posts: [], success: true }
    }
  },
)

exports.listStories = functions.https.onCall(async (data, context) => {
  const { userID, page, size } = data
  console.log(`Fetching stories for ${JSON.stringify(data)} `)

  const stories = await getList(
    socialFeedsRef.doc(userID),
    'stories_feed',
    page,
    size,
    true,
  )
  if (stories?.length > 0) {
    console.log(`fetched stories: `)
    console.log(stories)
    return { stories, success: true }
  } else {
    return { stories: [], success: true }
  }
})

exports.listHashtagFeedPosts = functions.https.onCall(async (data, context) => {
  const { userID, hashtag, page, size } = data
  console.log(`Fetching hashtag feed for ${JSON.stringify(data)} `)

  const harshedUsersBlockedByMe = await getAllUsersBlockedByMe(userID) // List of users blocked by me
  const harshedUsersBlockingMe = await getAllUsersBlockingMe(userID) // List of users blocking me

  const hashtagFeedsRef = db.collection('hashtags')
  const posts = await getList(
    hashtagFeedsRef.doc(hashtag),
    'feed',
    page,
    size,
    true,
  )

  const finalPosts = posts.filter(
    post =>
      post.authorID &&
      !harshedUsersBlockedByMe[post.authorID] &&
      !harshedUsersBlockingMe[post.authorID],
  )

  if (finalPosts?.length > 0) {
    console.log(`fetched posts: ${JSON.stringify(finalPosts)} `)
    return { posts: finalPosts, success: true }
  } else {
    return { posts: [], success: true }
  }
})

const fetchNonRelatedPosts = async (userID, page, size, postsSoFar) => {
  if (postsSoFar.length >= size) {
    return postsSoFar
  }

  const socialGraphRef = db.collection('social_graph')

  const snapshot = await canonicalPostsRef
    .offset(page * size)
    .orderBy('createdAt', 'desc')
    .limit(size)
    .get()

  const allPosts = snapshot?.docs?.map(doc => doc.data())
  if (allPosts.length === 0) {
    return postsSoFar
  }

  const promises = allPosts.map(async post => {
    const { authorID } = post
    var collectionName = 'outbound_users'
    const friend = await get(
      socialGraphRef.doc(userID),
      collectionName,
      authorID,
    )
    if (friend) {
      return null
    }
    return { ...post }
  })

  const postsWithNull = await Promise.all(promises)
  const posts = postsWithNull.filter(post => post && userID !== post.authorID)

  if (posts.length < size) {
    // if we didn't fetch enough discover posts from non-related friends AND we still have more posts in the database, we fetch one more page, etc.
    // WARNING: This is a recursive call, be extremely careful with this, make sure your stop condition is correct and you don't recurse infinitely.
    return [
      ...posts,
      ...(await fetchNonRelatedPosts(userID, page + 1, size, [
        ...postsSoFar,
        ...posts,
      ])),
    ]
  } else {
    return [...postsSoFar, ...posts]
  }
}

const extractHashtags = text => {
  const regexp = /(\s|^)\#\w\w+\b/gm
  let result = text?.match(regexp)
  if (result) {
    result = result.map(hashtag => hashtag.trim())
    return result
  } else {
    return []
  }
}
