import React, { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'dopenative'
import { Discover } from '../../components'
import { useCurrentUser } from '../../Core/onboarding'
import { useDiscoverPosts } from '../../Core/socialgraph/feed'

const DiscoverScreen = props => {
  const { navigation } = props
  const { localized } = useTranslations()

  const [postsByHashtag, setPostsByHashtag] = useState([])
  const [isFetching, setIsFetching] = useState(false)

  const {
    posts,
    refreshing,
    loadMorePosts,
    pullToRefresh,
    addReaction,
    isLoadingBottom,
  } = useDiscoverPosts()
  const currentUser = useCurrentUser()

  useEffect(() => {
    if (currentUser?.id) {
      loadMorePosts(currentUser?.id)
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (posts?.length > 0) {
      setPostsByHashtag(filterOutRelatedPosts(posts))
    } else {
      setPostsByHashtag([])
    }
  }, [posts])

  const onCategoryPress = async categoryFeed => {
    navigation.navigate('CustomFeedScreen', { posts: categoryFeed })
  }

  const onCategoryItemPress = async (categoryFeed, categoryFeedItemIndex) => {
    navigation.navigate('CustomFeedScreen', {
      posts: categoryFeed,
      feedStartIndex: categoryFeedItemIndex,
    })
  }

  const filterOutRelatedPosts = posts => {
    // we filter out posts with no media from self & friends
    if (!posts) {
      return posts
    }

    const filteredPosts = posts.filter(post => {
      return (
        post &&
        // post.authorID != currentUser.id &&
        post.author &&
        post.postMedia &&
        post.postMedia?.length > 0 &&
        post.postMedia[0].mime?.includes('video')
      )
    })

    return groupByHashTags(filteredPosts)
  }

  const groupByHashTags = filteredPosts => {
    const postsMap = {}

    filteredPosts?.forEach(filteredPost => {
      if (
        filteredPost.hashtags?.length &&
        filteredPost.postMedia?.length > 0 &&
        filteredPost.postMedia[0].mime?.includes('video')
      ) {
        filteredPost.hashtags.forEach(hashtag => {
          if (postsMap[hashtag]) {
            postsMap[hashtag].videos.unshift(filteredPost)
          } else {
            postsMap[hashtag] = { hashtag, videos: [filteredPost] }
          }
        })
      }
    })

    return Object.values(postsMap)
  }

  const emptyStateConfig = {
    title: localized('No Discover Posts'),
    description: localized(
      'There are currently no posts from people that you are not following. Posts from non-followings will show up here.',
    ),
  }

  return (
    <Discover
      loading={posts == null}
      feed={postsByHashtag}
      isFetching={isFetching}
      onCategoryPress={onCategoryPress}
      onCategoryItemPress={onCategoryItemPress}
      user={currentUser}
      emptyStateConfig={emptyStateConfig}
    />
  )
}

export default DiscoverScreen
