const admin = require('firebase-admin')
const firestore = admin.firestore()
const notificationsRef = firestore.collection('notifications')
const userClient = require('../core/user')

const { fetchUser, updateUser } = userClient

const sendPushNotification = async (
  toUserID,
  titleStr,
  contentStr,
  type,
  metadata = {},
) => {
  console.log(`sendPushNotification ${toUserID} ${titleStr} ${contentStr}`)

  const toUser = await fetchUser(toUserID)
  const { pushToken } = toUser
  if (!pushToken) {
    return null
  }

  await saveNotificationsToDB(toUser, titleStr, contentStr, type, metadata)

  console.log(
    `Actually sending push notification to ${toUserID} with title ${titleStr} with content ${contentStr}`,
  )

  const userBadgeCount = await handleUserBadgeCount(toUser)
  const payload = {
    notification: {
      title: titleStr,
      body: contentStr,
      sound: 'default',
      badge: `${userBadgeCount}`,
      type,
      metadata: JSON.stringify(metadata),
    },
  }
  return admin.messaging().sendToDevice(pushToken, payload)
}

const handleUserBadgeCount = async user => {
  const newBadgeCount = (user?.badgeCount ?? 0) + 1
  await updateUser(user.id, { badgeCount: newBadgeCount })
  return newBadgeCount
}

const saveNotificationsToDB = async (toUser, title, body, type, metadata) => {
  const notification = {
    toUserID: toUser.id,
    title,
    body,
    metadata,
    toUser,
    type,
    seen: false,
  }

  const ref = await notificationsRef.add({
    ...notification,
    createdAt: Math.floor(new Date().getTime() / 1000),
  })
  notificationsRef.doc(ref.id).update({ id: ref.id })
}

exports.sendPushNotification = sendPushNotification
