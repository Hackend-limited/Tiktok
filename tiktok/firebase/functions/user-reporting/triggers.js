const functions = require('firebase-functions')

const { unfriendEdge, unfollowEdge } = require('../socialgraph/utils')

const {
  updateHomeFeedsUponReportedUser,
  updateStoryFeedsUponReportedUser,
} = require('./common')

const { updateChatFeedsUponReportedUser } = require('./common')

exports.onReportWrite = functions.firestore
  .document('user_reports/{user_reportID}')
  .onCreate(async (snapshot, context) => {
    const currentReportData = snapshot.data()

    console.log(
      `onCanonicalReportWrite  data: ${JSON.stringify(currentReportData)}`,
    )

    await updateHomeFeedsUponReportedUser(
      currentReportData.source,
      currentReportData.dest,
    )
    await updateStoryFeedsUponReportedUser(
      currentReportData.source,
      currentReportData.dest,
    )

    await updateChatFeedsUponReportedUser(
      currentReportData.source,
      currentReportData.dest,
    )

    await unfriendEdge(currentReportData.source, currentReportData.dest)
    await unfollowEdge(currentReportData.source, currentReportData.dest)
  })
