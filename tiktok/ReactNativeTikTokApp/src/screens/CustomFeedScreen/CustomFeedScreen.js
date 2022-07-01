import React, { useCallback, useEffect, useState } from 'react'
import { View, Share, StatusBar } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import { useTranslations } from 'dopenative'
import { useDispatch } from 'react-redux'
import { Feed } from '../../components'
import styles from './styles'
import { useUserReportingMutations } from '../../Core/user-reporting'
import { setLocallyDeletedPost } from '../../Core/socialgraph/feed/redux'
import CommentsScreen from '../CommentsScreen/CommentsScreen'
import { useCustomPosts, usePostMutations } from '../../Core/socialgraph/feed'
import { useCurrentUser } from '../../Core/onboarding'

export default CustomFeedScreen = props => {
  const { navigation, route } = props
  const originalPosts = route?.params?.posts
  const feedStartIndex = route?.params?.feedStartIndex

  const dispatch = useDispatch()

  const isFocused = useIsFocused()

  const { localized } = useTranslations()

  const currentUser = useCurrentUser()

  const { posts, addReaction } = useCustomPosts(originalPosts)
  const { deletePost } = usePostMutations()
  const { markAbuse } = useUserReportingMutations()

  const [isVisible, setIsVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('light-content')
    } else {
      StatusBar.setBarStyle('default')
    }
  }, [isFocused])

  useEffect(() => {
    if (selectedItem) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [selectedItem])

  const onCommentPress = item => {
    setSelectedItem(item)
  }

  const handleUserPress = userInfo => {
    if (userInfo.id === currentUser.id) {
      navigation.push('Profile')
    } else {
      navigation.push('Profile', {
        user: userInfo,
      })
    }
  }

  const onFeedUserItemPress = async item => {
    handleUserPress(item)
  }

  const onTextFieldUserPress = userInfo => {
    handleUserPress(userInfo)
  }

  const onTextFieldHashTagPress = hashtag => {
    navigation.push('FeedSearch', { hashtag })
  }

  const onReaction = useCallback(
    async (reaction, post) => {
      await addReaction(post, currentUser, reaction)
    },
    [addReaction, currentUser],
  )

  const onSharePost = async item => {
    let url = ''
    if (item.postMedia?.length > 0) {
      url = item.postMedia[0].url
    }
    try {
      const result = await Share.share(
        {
          title: localized('Share Instamobile post.'),
          url,
        },
        {
          dialogTitle: localized('Share Instamobile post.'),
        },
      )
    } catch (error) {
      alert(error.message)
    }
  }

  const onDeletePost = async item => {
    dispatch(setLocallyDeletedPost(item.id))
    const res = await deletePost(item.id, currentUser?.id)
    if (res.error) {
      alert(res.error)
    }
  }

  const onUserReport = async (item, type) => {
    markAbuse(currentUser.id, item.authorID, type)
  }

  const onDismiss = () => {
    setSelectedItem(null)
  }

  return (
    <View style={styles.container}>
      <Feed
        loading={false}
        feed={posts}
        isCustomFeed={true}
        onCommentPress={onCommentPress}
        user={currentUser}
        onFeedUserItemPress={onFeedUserItemPress}
        onReaction={onReaction}
        isFetching={false}
        onSharePost={onSharePost}
        onDeletePost={onDeletePost}
        onUserReport={onUserReport}
        navigation={navigation}
        startIndex={feedStartIndex}
        onTextFieldUserPress={onTextFieldUserPress}
        onTextFieldHashTagPress={onTextFieldHashTagPress}
        onFollowingFeedPress={null}
        onForYouFeedPress={null}
        isForYouFeed={false}
        isFollowingDisabled={true}
      />
      <CommentsScreen
        item={selectedItem}
        onDismiss={onDismiss}
        isVisible={isVisible}
      />
    </View>
  )
}
