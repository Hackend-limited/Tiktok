import React, { useState, useEffect, useRef, useContext } from 'react'
import { View } from 'react-native'
import { useTheme, useTranslations } from 'dopenative'
import SearchBar from '../../Core/ui/SearchBar/SearchBar'
import { Discover } from '../../components'
import { useCurrentUser } from '../../Core/onboarding'
import { useHashtagPosts } from '../../Core/socialgraph/feed'
import dynamicStyles from './styles'

function FeedSearchScreen(props) {
  const { navigation, route } = props

  const { localized } = useTranslations()
  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)
  const currentUser = useCurrentUser()

  const emptyStateConfig = {
    title: localized('No Posts'),
    description: localized(''),
  }
  const [hashtag, setHashtag] = useState(route.params.hashtag)
  const {
    posts,
    refreshing,
    isLoadingBottom,
    addReaction,
    loadMorePosts,
    pullToRefresh,
  } = useHashtagPosts(hashtag, currentUser?.id)

  const [feed, setFeed] = useState(null)

  const searchBarRef = useRef(null)

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

  useEffect(() => {
    const groupedPost = groupByHashTags(posts)
    setFeed(groupedPost)
  }, [posts])

  const onSearchTextChange = text => {}

  const onSearchBarCancel = () => {
    navigation.goBack()
  }

  const onSearch = text => {
    setFeed(null)
    setHashtag(text)
  }

  const onSearchClear = () => {}

  const onCategoryPress = async categoryFeed => {
    navigation.navigate('CustomFeedScreen', { posts: categoryFeed })
  }

  const onCategoryItemPress = async (categoryFeed, categoryFeedItemIndex) => {
    navigation.navigate('CustomFeedScreen', {
      posts: categoryFeed,
      feedStartIndex: categoryFeedItemIndex,
    })
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.searchBarContainer}>
        <SearchBar
          placeholder={localized('Search hashtags')}
          onChangeText={onSearchTextChange}
          onSearchBarCancel={onSearchBarCancel}
          searchRef={searchBarRef}
          onSearchClear={onSearchClear}
          defaultValue={hashtag}
          onSearch={onSearch}
        />
      </View> */}

      <Discover
        loading={feed == null}
        feed={feed ?? []}
        isFetching={isLoadingBottom}
        onCategoryPress={onCategoryPress}
        onCategoryItemPress={onCategoryItemPress}
        user={currentUser}
        emptyStateConfig={emptyStateConfig}
      />
    </View>
  )
}

export default FeedSearchScreen
