const admin = require('firebase-admin')
const db = admin.firestore()
const functions = require('firebase-functions')

const notificationsRef = db.collection('notifications')

const collectionsUtils = require('../core/collections')
const { getList, getDoc } = collectionsUtils

exports.listNotifications = functions.https.onCall(async (data, context) => {
  const { userID, page, size } = data
  console.log(`Fetching Notifcations for ${JSON.stringify(data)} `)

  const notifications = await getList(
    notificationsRef.doc(userID),
    'notifications',
    page,
    size,
    true,
  )
  if (notifications?.length > 0) {
    console.log(`fetched notifications: `)
    console.log(notifications)
    return { notifications, success: true }
  } else {
    return { notifications: [], success: true }
  }
})

exports.updateNotification = functions.https.onCall(async (data, context) => {
  const { notificationID, userID } = data
  console.log(`Updating notifcation ${JSON.stringify(data)} `)
  if (notificationID) {
    const doc = await getDoc(
      notificationsRef.doc(userID),
      'notifications',
      notificationID,
    )
    console.log(doc)
    if (doc?.ref) {
      doc.ref.set({ seen: true }, { merge: true })
    }
  }
})
