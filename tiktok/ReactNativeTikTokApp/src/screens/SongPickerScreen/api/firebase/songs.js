import { firebase } from '../../../../Core/api/firebase/config'

const songsRef = firebase.firestore().collection('composer_songs')

const fetchSongs = () => {
  return new Promise(resolve => {
    songsRef
      .get()
      .then(snapshot => {
        if (snapshot.docs.length > 0) {
          const data = snapshot.docs.map(doc => doc.data())
          resolve(data)
        }
        resolve([])
      })
      .catch(() => {})
  })
}

export default {
  fetchSongs,
}
