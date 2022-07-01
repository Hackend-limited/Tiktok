import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useTranslations } from 'dopenative'
import { Profile } from '../../components'
import { storageAPI } from '../../Core/media'
import { updateUser } from '../../Core/users'
import { setUserData } from '../../Core/onboarding/redux/auth'
import { useCurrentUser } from '../../Core/onboarding'
import { useProfile } from '../../Core/socialgraph/feed'
import { useSocialGraphMutations } from '../../Core/socialgraph/friendships'

const defaultAvatar =
  'https://www.iosapptemplates.com/wp-content/uploads/2019/06/empty-avatar.jpg'

const ProfileScreen = props => {
  const { navigation, route } = props
  const { localized } = useTranslations()

  const otherUser = route?.params?.user
  const hasBottomTab = route?.params?.hasBottomTab

  const currentUser = useCurrentUser()

  const { addEdge } = useSocialGraphMutations()

  const dispatch = useDispatch()

  const [uploadProgress, setUploadProgress] = useState(0)
  const [localActionButtonType, setLocalActionButtonType] = useState(
    !otherUser ? 'settings' : null,
  )
  const {
    profile,
    posts,
    refreshing,
    isLoadingBottom,
    subscribeToProfileFeedPosts,
    loadMorePosts,
    pullToRefresh,
    addReaction,
  } = useProfile(otherUser?.id ?? currentUser?.id, currentUser?.id)
  const { user, friends, moreFriendsAvailable, actionButtonType } =
    profile ?? {}

  useEffect(() => {
    const postsUnsubscribe = subscribeToProfileFeedPosts(
      otherUser?.id ?? currentUser?.id,
    )

    return () => {
      postsUnsubscribe && postsUnsubscribe()
    }
  }, [currentUser?.id])

  const onMainButtonPress = useCallback(() => {
    const actionType = localActionButtonType
      ? localActionButtonType
      : actionButtonType
    if (actionType === 'add') {
      addFriend()
      return
    }
    if (actionType === 'message') {
      onMessage()
      return
    }
    if (actionType === 'settings') {
      navigation.navigate('ProfileSettings')
    }
  }, [
    localActionButtonType,
    actionButtonType,
    addFriend,
    onMessage,
    navigation,
  ])

  const onMessage = () => {
    const viewer = currentUser
    const viewerID = viewer.id || viewer.userID
    const friendID = otherUser.id || otherUser.userID
    let channel = {
      id: viewerID < friendID ? viewerID + friendID : friendID + viewerID,
      participants: [otherUser],
    }
    navigation.navigate('PersonalChat', { channel })
  }

  const addFriend = useCallback(async () => {
    if (!currentUser || !user) {
      return
    }
    setLocalActionButtonType('message')
    await addEdge(currentUser, user)
  }, [currentUser, user, addEdge, setLocalActionButtonType])

  const startUpload = useCallback(
    async source => {
      dispatch(
        setUserData({
          user: {
            ...currentUser,
            profilePictureURL: source?.path || source.uri,
          },
          profilePictureURL: source?.path || source.uri,
        }),
      )

      storageAPI.processAndUploadMediaFileWithProgressTracking(
        source,
        async snapshot => {
          const uploadProgress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(uploadProgress)
        },
        async url => {
          const data = {
            profilePictureURL: url,
          }
          dispatch(
            setUserData({
              user: { ...currentUser, profilePictureURL: url },
            }),
          )

          updateUser(currentUser.id, data)
          setUploadProgress(0)
        },
        error => {
          setUploadProgress(0)
          console.log(error)
          alert(
            localized(
              'Oops! An error occured while trying to update your profile picture. Please try again.',
            ),
          )
          console.log(error)
        },
      )
    },
    [dispatch, setUploadProgress, setUserData, storageAPI, localized],
  )

  const removePhoto = useCallback(async () => {
    const res = await updateUser(currentUser.id, {
      profilePictureURL: defaultAvatar,
    })
    if (res.success) {
      dispatch(
        setUserData({
          user: { ...currentUser, profilePictureURL: defaultAvatar },
        }),
      )
    } else {
      alert(
        localized(
          'Oops! An error occured while trying to remove your profile picture. Please try again.',
        ),
      )
    }
  }, [updateUser, currentUser, localized])

  const onEmptyStatePress = () => {
    navigation.navigate('CreatePost')
  }

  const onFollowersButtonPress = () => {
    navigation.push('AllFriends', {
      title: localized('Followers'),
      otherUser: otherUser ?? currentUser,
      type: 'inbound',
      followEnabled: true,
    })
  }

  const onFeedItemPress = profileFeedItemIndex => {
    navigation.push('CustomFeedScreen', {
      posts: posts,
      feedStartIndex: profileFeedItemIndex,
    })
  }

  const onFollowingButtonPress = () => {
    navigation.push('AllFriends', {
      title: localized('Following'),
      otherUser: otherUser ?? currentUser,
      type: 'outbound',
      followEnabled: true,
    })
  }

  const actionType = localActionButtonType
    ? localActionButtonType
    : actionButtonType
  const mainButtonTitle =
    actionType === 'settings'
      ? localized('Profile Settings')
      : actionType === 'message'
      ? localized('Send Message')
      : actionType === 'add'
      ? localized('Follow')
      : null

  const pullToRefreshConfig = {
    refreshing: refreshing,
    onRefresh: () => {
      pullToRefresh(currentUser?.id)
    },
  }

  return (
    <Profile
      profilePosts={posts}
      user={otherUser ? otherUser : currentUser}
      onFollowingButtonPress={onFollowingButtonPress}
      onFollowersButtonPress={onFollowersButtonPress}
      followingCount={
        user?.outboundFriendshipCount ?? otherUser?.outboundFriendshipCount ?? 0
      }
      followersCount={
        user?.inboundFriendshipCount ?? otherUser?.inboundFriendshipCount ?? 0
      }
      reactionsCount={user?.reactionsCount ?? otherUser?.reactionsCount ?? 0}
      mainButtonTitle={mainButtonTitle}
      onMainButtonPress={onMainButtonPress}
      isOtherUser={otherUser}
      hasBottomTab={hasBottomTab}
      onFeedItemPress={onFeedItemPress}
      startUpload={startUpload}
      removePhoto={removePhoto}
      pullToRefreshConfig={pullToRefreshConfig}
    />
  )
}

export default ProfileScreen
