/**
 * In order to update screens in real-time, we need to use Firebase listeners on the client side.
 * Since we don't want to add snapshot listeners to large collections (for performance reasons),
 * we split each such collection into 2 different collections:
 *  1. The "live" collection, which is small, and therefore can be listened to in real-time via snapshot listeners (the size is limited to liveCollectionCountLimit)
 *  2. The "historical" collection, which contains the rest of the data, and which must never be listened to via snapshot listeners, because it's too large.
 * In general, the "live" collection contains the most recent data, and the "historical" collection contains the older data.
 * In general, the "live" collection is used for the first "page" of a screen, and the "historical" collection is used for the rest of the pages (for paginated lists).
 *
 * This file contains a set of util methods that handle all the business logic for the 2 subcollections (moving elements between collections, deduplicating, adding, deleting, etc).
 **/

const Constants = {
  liveCollectionCountLimit: 50,
}

exports.getList = async (
  docRef,
  collectionName,
  page,
  limit,
  sortedByDate = false,
) => {
  if (page === -1) {
    // Always return the full list of live data if page is -1
    const liveCollection = docRef.collection(`${collectionName}_live`)
    const snapshot = await liveCollection.get()
    return snapshot?.docs?.map(doc => doc.data())
  } else {
    const historicalCollection = docRef.collection(
      `${collectionName}_historical`,
    )
    const snapshot =
      sortedByDate === false
        ? await historicalCollection
            .offset(page * limit)
            .limit(limit)
            .get()
        : await historicalCollection
            .orderBy('createdAt', 'desc')
            .offset(page * limit)
            .limit(limit)
            .get()
    return snapshot?.docs?.map(doc => doc.data())
  }
}

exports.add = async (docRef, collectionName, data, sortedByDate = false) => {
  const liveCollection = docRef.collection(`${collectionName}_live`)
  const historicalCollection = docRef.collection(`${collectionName}_historical`)

  const liveData = await liveCollection.get()
  const liveDataDocs = liveData?.docs

  // if the data already exists in live collection
  const res = await liveCollection.doc(data.id).get()
  if (res?.exists) {
    // we just update the data
    await liveCollection.doc(data.id).set(data, { merge: true })
    return
  }

  // if the data already exists in historical collection
  const hRes = await historicalCollection.doc(data.id).get()
  if (hRes?.exists) {
    // we just update the data
    await historicalCollection.doc(data.id).set(data, { merge: true })
    return
  }

  if (sortedByDate === false) {
    // if we don't need to sort by date, we just add the data
    if (liveDataDocs?.length < Constants.liveCollectionCountLimit) {
      // Add the data to the live collection if live collection is not full already
      const liveRef = liveCollection.doc(data.id)
      await liveRef.set(data)
    } else {
      // If the live collection is full, add the data to the historical collection
      const historicalRef = historicalCollection.doc(data.id)
      await historicalRef.set(data)
    }
  } else {
    // if need to sort by date, we add the new data to the live collection, and move the oldest data from the live collection to the historical collection (if live collection is full)
    await liveCollection.doc(data.id).set(data, { merge: true })

    if (liveDataDocs?.length >= Constants.liveCollectionCountLimit) {
      const entry = await liveCollection
        .orderBy('createdAt', 'asc')
        .limit(1)
        .get()
      if (entry?.docs?.length > 0) {
        const entryData = entry.docs[0].data()
        const doc = entry.docs[0]
        await historicalCollection.doc(doc.id).set(entryData)
        await liveCollection.doc(doc.id).delete()
      }
    }
  }
}

exports.get = async (docRef, collectionName, id) => {
  const liveCollection = docRef.collection(`${collectionName}_live`)
  // We first check the live collection
  const doc = await liveCollection.doc(id).get()
  if (doc?.exists) {
    console.log(JSON.stringify(doc.data()))
    return doc.data()
  }

  // If we don't find the data in the live collection, we check for it in the historical collection
  const historicalCollection = docRef.collection(`${collectionName}_historical`)
  const hDoc = await historicalCollection.doc(id).get()
  if (hDoc?.exists) {
    console.log(JSON.stringify(doc.data()))
    return hDoc.data()
  }
  return null
}

exports.getCount = async (docRef, collectionName) => {
  const liveCollection = docRef.collection(`${collectionName}_live`)
  // We first count the live collection
  const snapshot = await liveCollection.get()
  const liveCount = snapshot?.docs?.length || 0

  // Then we count the historical collection
  const historicalCollection = docRef.collection(`${collectionName}_historical`)
  const hSnapshot = await historicalCollection.get()
  const historicalCount = hSnapshot?.docs?.length || 0
  return liveCount + historicalCount || 0
}

exports.getDoc = async (docRef, collectionName, id) => {
  const liveCollection = docRef.collection(`${collectionName}_live`)
  // We first check the live collection
  const doc = await liveCollection.doc(id).get()
  if (doc?.exists) {
    return doc
  }

  // If we don't find the data in the live collection, we check for it in the historical collection
  const historicalCollection = docRef.collection(`${collectionName}_historical`)
  const hDoc = await historicalCollection.doc(id).get()
  if (hDoc?.exists) {
    return hDoc
  }
  return null
}

exports.remove = async (docRef, collectionName, id, sortedByDate = false) => {
  const liveCollection = docRef.collection(`${collectionName}_live`)
  const historicalCollection = docRef.collection(`${collectionName}_historical`)

  // We first check if the removed entry is in the historical collection
  const doc = await historicalCollection.doc(id).get()
  if (doc.exists) {
    // if it does, we simply remove the entry from the historical collection, and that's it.
    await historicalCollection.doc(id).delete()
  } else {
    // the entry might be in the live collection, so let's check
    const doc = await liveCollection.doc(id).get()
    if (doc.exists) {
      // the entry is in the live collection, so we remove it and then move one of the entries from the historical collection to the live collection
      await liveCollection.doc(id).delete()

      const entry =
        sortedByDate === false
          ? await historicalCollection.limit(1).get()
          : await historicalCollection
              .orderBy('createdAt', 'desc')
              .limit(1)
              .get()
      if (entry?.docs?.length > 0) {
        const entryData = entry.docs[0].data()
        const doc = entry.docs[0]
        await liveCollection.doc(doc.id).set(entryData)
        await historicalCollection.doc(doc.id).delete()
      } else {
        // if there's no entry in the historical collection, we just remove the entry from the live collection, so nothing else needs to be done here
      }
    } else {
      // if the entry is not in the live collection nor historical collection, we don't have to do anything
    }
  }

  await liveCollection.doc(id).delete()
  await historicalCollection.doc(id).delete()
}

exports.deleteCollection = async (db, collectionRef) => {
  const query = collectionRef.limit(Constants.liveCollectionCountLimit)
  await deleteQueryBatch(db, query)
}

const  deleteQueryBatch = async (db, query) => {
  const snapshot = await query.get()

  const batchSize = snapshot.size
  if (batchSize === 0) {
    // When there are no documents left, we are done
    return
  }

  // Delete documents in a batch
  const batch = db.batch()
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query)
  })
}

// socialgraph/{id1}/inbounds_users/{id2}
