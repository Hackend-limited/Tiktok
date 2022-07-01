const functions = require('firebase-functions')
const {
  updateFeedsUponPostDeletion,
  updateFeedsUponStoryDeletion,
  hydrateFeeds,
  hydrateStoryFeeds,
} = require('./common')

exports.onCanonicalPostWrite = functions.firestore
  .document('posts/{postID}')
  .onWrite(async (change, context) => {
    const previousPostData = change.before.data()
    const currentPostData = change.after.data()

    console.log(
      `onCanonicalPostWrite prev: ${JSON.stringify(
        previousPostData,
      )} after: ${JSON.stringify(currentPostData)}`,
    )

    if (!change.after.exists || !currentPostData) {
      // Post has been deleted
      await updateFeedsUponPostDeletion(
        previousPostData.id,
        previousPostData.authorID,
      )
      console.log('All feeds have been updated upon deletion.')
      return
    }

    await hydrateFeeds(currentPostData.id)
  })

exports.onCanonicalStoryWrite = functions.firestore
  .document('stories/{storyID}')
  .onWrite(async (change, context) => {
    const previousStoryData = change.before.data()
    const currentStoryData = change.after.data()

    console.log(
      `onCanonicalStoryWrite prev: ${JSON.stringify(
        previousStoryData,
      )} after: ${JSON.stringify(currentStoryData)}`,
    )

    if (!change.after.exists || !currentStoryData) {
      // Story has been deleted
      await updateFeedsUponStoryDeletion(
        previousStoryData.id,
        previousStoryData.authorID,
      )
      console.log('All feeds have been updated upon deletion.')
      return
    }

    await hydrateStoryFeeds(currentStoryData.id)
  })
