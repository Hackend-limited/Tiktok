const functions = require('firebase-functions')
const admin = require('firebase-admin')
// admin.initializeApp();
const firestore = admin.firestore()

/*
 ** When a user updates their profile info (email, profile picture, first name, etc)
 ** We update all the firestore tables that contain copies of that user object
 */
exports.propagateUserProfileUpdates = functions.firestore
  .document('users/{userID}')
  .onUpdate((change, context) => {
    const userData = change.after.data()
    if (!userData) {
      console.log('no user data')
      return
    }

    return updateAllRelatedData(userData)
  })

const updateAllRelatedData = async userData => {
  await updateChatConversations(userData, 'messages_live')
  await updateChatConversations(userData, 'messages_historical')
  // Update all conversations where this user is a participant
  await updateChatFeeds(userData, 'chat_feed_live')
  await updateChatFeeds(userData, 'chat_feed_historical')

  await updateAuthoredEntries(userData, 'main_feed_live')
  await updateAuthoredEntries(userData, 'main_feed_historical')
  await updateAuthoredEntries(userData, 'stories_feed_live')
  await updateAuthoredEntries(userData, 'stories_feed_historical')
  await updateAuthoredEntries(userData, 'posts')
  await updateAuthoredEntries(userData, 'stories')
  await updateAuthoredEntries(userData, 'comments_live')
  await updateAuthoredEntries(userData, 'comments_historical')

  // Social Graph
  await updateSocialGraph(userData)

  // Listings
  await updateAuthoredEntries(userData, 'real_estate_listings')
  await updateAuthoredEntries(userData, 'store_locator_listings')
  await updateAuthoredEntries(userData, 'universal_listings')
  await updateAuthoredEntries(userData, 'vendors')
  await updateAuthoredEntries(userData, 'classifieds_listings')
}

const updateChatConversations = async (userData, table) => {
  // Update all chat conversations where this user has been the sender
  const querySnapshot = await firestore
    .collectionGroup(table)
    .where('senderID', '==', userData.id)
    .get()

  let docs = querySnapshot.docs
  for (let doc of docs) {
    var data = {}
    if (userData.firstName) {
      data['senderFirstName'] = userData.firstName
    }
    if (userData.lastName) {
      data['senderLastName'] = userData.lastName
    }
    if (userData.profilePictureURL) {
      data['senderProfilePictureURL'] = userData.profilePictureURL
    }
    doc.ref.set(data, { merge: true })
  }
}

const updateChatFeeds = async (userData, table) => {
  // Fetch all channels for the current user
  const mySnapshot = await firestore
    .collection('social_feeds')
    .doc(userData.id)
    .collection(table)
    .get()
  const myDocs = mySnapshot.docs
  myDocs.forEach(async myDoc => {
    const channelID = myDoc.id

    await updateSocialFeed(channelID, userData, 'chat_feed_live')
    await updateSocialFeed(channelID, userData, 'chat_feed_historical')

    console.log(
      'Updating channels participants for channel ID ' +
        channelID +
        ' in channels table',
    )
    const channelDoc = await firestore
      .collection('channels')
      .doc(channelID)
      .get()
    const channelData = channelDoc.data()
    const prevChannelParticipants = channelData.participants
    var newChannelParticipants = new Array()
    for (let index in prevChannelParticipants) {
      const participant = prevChannelParticipants[index]
      if (participant.id === userData.id) {
        newChannelParticipants.push(userData)
      } else {
        newChannelParticipants.push(participant)
      }
    }
    await channelDoc.ref.set(
      { participants: newChannelParticipants },
      { merge: true },
    )
  })
}

const updateSocialFeed = async (channelID, userData, table) => {
  const querySnapshot = await firestore
    .collectionGroup(table)
    .where('id', '==', channelID)
    .get()

  let docs = querySnapshot.docs
  console.log(
    'Updating social_feeds -> chat_feed for channel ID ' +
      channelID +
      '. ' +
      docs.length +
      ' channels to update',
  )
  docs.forEach(async doc => {
    var prevData = doc.data()
    var prevParticipants = prevData.participants
    var newParticipants = new Array()
    for (let index in prevParticipants) {
      const participant = prevParticipants[index]
      if (participant.id === userData.id) {
        newParticipants.push(userData)
      } else {
        newParticipants.push(participant)
      }
    }
    var data = { participants: newParticipants }
    if (newParticipants.length === 1 && newParticipants[0].id === userData.id) {
      const title = userData.firstName + ' ' + userData.lastName
      data['name'] = title
    }
    await doc.ref.set(data, { merge: true })
  })
}

const updateAuthoredEntries = async (userData, collectionName) => {
  const querySnapshot = await firestore
    .collectionGroup(collectionName)
    .where('authorID', '==', userData.id)
    .get()

  let docs = querySnapshot.docs
  for (let doc of docs) {
    var data = { author: userData }
    await doc.ref.set(data, { merge: true })
  }
}

const updateSocialGraph = async userData => {
  await updateOneWaySocialGraphCollection(userData, 'inbound_users_live')
  await updateOneWaySocialGraphCollection(userData, 'inbound_users_historical')

  await updateOneWaySocialGraphCollection(userData, 'outbound_users_live')
  await updateOneWaySocialGraphCollection(userData, 'outbound_users_historical')

  await updateOneWaySocialGraphCollection(userData, 'mutual_users_live')
  await updateOneWaySocialGraphCollection(userData, 'mutual_users_historical')

  await updateBidirectionalFriendshipsSocialGraph(userData, 'friendships_live')
  await updateBidirectionalFriendshipsSocialGraph(
    userData,
    'friendships_historical',
  )
}

const updateOneWaySocialGraphCollection = async (userData, collectionName) => {
  const querySnapshot = await firestore
    .collectionGroup(collectionName)
    .where('id', '==', userData.id)
    .get()

  let docs = querySnapshot.docs
  for (let doc of docs) {
    console.log('Updating ' + collectionName + ': #' + doc.id)
    await doc.ref.set(userData)
  }
}

const updateBidirectionalFriendshipsSocialGraph = async (
  userData,
  collectionName,
) => {
  const querySnapshot = await firestore
    .collectionGroup(collectionName)
    .where('id', '==', userData.id)
    .get()

  let docs = querySnapshot.docs
  for (let doc of docs) {
    console.log('Updating ' + collectionName + ': #' + doc.id)
    await doc.ref.set({ user: userData }, { merge: true })
  }
}
