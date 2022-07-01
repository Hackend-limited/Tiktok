const functions = require('firebase-functions')
const admin = require('firebase-admin')

const db = admin.firestore()

const socialFeedsRef = db.collection('social_feeds')
const chatChannelsRef = db.collection('channels')

const collectionsUtils = require('../core/collections')
const { remove } = collectionsUtils

/*
 ** For a given reported user, we remove the reported user post from the author home feed timeline
 ** where the post should not appear
 */
exports.updateHomeFeedsUponReportedUser = async (authorID, reportedID) => {
  const res = await socialFeedsRef
    .doc(authorID)
    .collection('home_feed')
    .where('authorID', '==', reportedID)
    .get()

  if (res.empty) {
    return
  }

  const promises = res.docs.map(
    async doc =>
      await remove(socialFeedsRef.doc(authorID), 'home_feed', doc.id, true),
  )

  await Promise.all(promises)
}

/*
 ** For a given reported user, we remove the reported user story from the author story timeline
 */
exports.updateStoryFeedsUponReportedUser = async (authorID, reportedID) => {
  const res = await socialFeedsRef
    .doc(authorID)
    .collection('stories_feed')
    .where('authorID', '==', reportedID)
    .get()

  if (res.empty) {
    return
  }

  const promises = res.docs.map(
    async doc =>
      await remove(socialFeedsRef.doc(authorID), 'stories_feed', doc.id, true),
  )

  await Promise.all(promises)
}

/*
 * For a given reported user, we delete the reported user from the author's chat feed, we also
 * delete the author from the reported user's chat feed and then delete the chat channel
 */
exports.updateChatFeedsUponReportedUser = async (authorID, reportedID) => {
  const channelID =
    authorID < reportedID ? authorID + reportedID : reportedID + authorID

  await remove(socialFeedsRef.doc(authorID), 'chat_feed', channelID, true)
  await remove(socialFeedsRef.doc(reportedID), 'chat_feed', channelID, true)

  await chatChannelsRef.doc(channelID).delete()
}
