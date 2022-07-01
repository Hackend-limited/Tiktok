const functions = require('firebase-functions')
const admin = require('firebase-admin')

const db = admin.firestore()

const userReportingRef = db.collection('user_reports')

const userClient = require('../core/user')
const { fetchUser } = userClient

const collectionsUtils = require('../core/collections')
const { add, get, remove, getList } = collectionsUtils

const currentTimestamp = () => {
  const date = new Date()
  return date.getTime() / 1000
}

exports.getAllUsersBlockedByMe = async userID => {
  const res = await userReportingRef.where('source', '==', userID).get()
  const harshedBlockedUsers = {}
  res.docs.forEach(doc => {
    const blockedUerID = doc.data()
    harshedBlockedUsers[blockedUerID.dest] = true
  })
  return harshedBlockedUsers
}

exports.getAllUsersBlockingMe = async userID => {
  const snapshot = await userReportingRef.where('dest', '==', userID).get()
  const harshedBlockedUsers = {}
  snapshot.forEach(doc => {
    const blockedUerID = doc.data()
    harshedBlockedUsers[blockedUerID.source] = true
  })
  return harshedBlockedUsers
}

// get the list of reported users => blocked users
exports.fetchBlockedUsers = functions.https.onCall(async (data, context) => {
  try {
    const { userID, page, size } = data
    console.log(`fetching reported users `)
    console.log(JSON.stringify(data))

    const reportedUsers = await getList(
      userReportingRef.doc(userID),
      'reports',
      page,
      size,
    )
    if (reportedUsers?.length > 0) {
      console.log(`fetched reported users: `)
      console.log(JSON.stringify(reportedUsers))
      return { users: reportedUsers, success: true }
    } else {
      return { users: [], success: true }
    }
  } catch (error) {
    console.log('error', error)
  }
})

//report a user
exports.markAbuse = functions.https.onCall(async (data, context) => {
  try {
    const { sourceUserID, destUserID, abuseType } = data

    const destUser = await fetchUser(destUserID)
    const docID = userReportingRef.doc(sourceUserID).id

    const abuseItem = {
      id: docID,
      dest: destUser.id,
      source: sourceUserID,
      user: {
        id: destUser.id,
        lastName: destUser.lastName,
        email: destUser.email,
        profilePictureURL: destUser.profilePictureURL,
        firstName: destUser.firstName,
      },
      type: abuseType,
      createdAt: currentTimestamp(),
    }
    console.log(`marking abuse `)
    console.log(JSON.stringify(data))

    await userReportingRef.doc(docID).set(abuseItem)

    await add(userReportingRef.doc(sourceUserID), 'reports', abuseItem)

    console.log(`marked abuse `)

    return { success: true }
  } catch (error) {
    console.log('error', error)
  }
})

exports.unblockUser = functions.https.onCall(async (data, context) => {
  try {
    const { sourceUserID, destUserID } = data
    console.log(`removing abuse `)

    const snapshot = await userReportingRef
      .where('dest', '==', destUserID)
      .where('source', '==', sourceUserID)
      .get()

    snapshot.forEach(async doc => {
      doc.ref.delete()
      await remove(userReportingRef.doc(sourceUserID), 'reports', doc.id)
    })

    console.log(`removed abuse `, sourceUserID, destUserID)
    return { success: true }
  } catch (error) {
    console.log('error', error)
  }
})
