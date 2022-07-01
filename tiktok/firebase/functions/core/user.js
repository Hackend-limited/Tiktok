const admin = require('firebase-admin')

const db = admin.firestore()
const usersRef = db.collection('users')

exports.fetchUser = async userID => {
  const userSnapshot = await usersRef.doc(userID).get()
  if (userSnapshot) {
    return userSnapshot.data()
  }
  return null
}

exports.fetchUserByEmail = async email => {
  const snapshot = await usersRef.where('email', '==', email).get()
  if (snapshot?.docs?.length == 0) {
    return null
  }
  const user = snapshot.docs[0]
  if (user) {
    return user.data()
  }
  return null
}

exports.updateUser = async (userID, data) => {
  await usersRef.doc(userID).set(data, { merge: true })
}
