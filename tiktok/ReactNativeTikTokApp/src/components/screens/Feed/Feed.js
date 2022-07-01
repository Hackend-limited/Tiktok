import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import ViewPager from '@react-native-community/viewpager'
import { useTheme } from 'dopenative'
import FeedItem from './FeedItem/FeedItem'
import styles from './styles'

export default function Feed(props) {
  const {
    onCommentPress,
    onFeedUserItemPress,
    feed,
    isCustomFeed,
    startIndex,
    onSharePost,
    onReaction,
    onTextFieldUserPress,
    onTextFieldHashTagPress,
    user,
    onDeletePost,
    onUserReport,
    onFollowingFeedPress,
    onForYouFeedPress,
    isForYouFeed,
    isFollowingDisabled,
  } = props

  const { theme } = useTheme()

  const [paused, setPaused] = useState(false)
  const [selected, setSelected] = useState(0)

  if (!feed) {
    return null
  }

  return (
    <View style={styles.container}>
      {paused && (
        <TouchableOpacity
          style={styles.playIconContainer}
          onPress={() => setPaused(!paused)}>
          <Image style={styles.playIcon} source={theme.icons.playButton} />
        </TouchableOpacity>
      )}
      {!isCustomFeed && (
        <View style={styles.newsByFollowing}>
          <TouchableOpacity
            disabled={isFollowingDisabled}
            onPress={onFollowingFeedPress}>
            <Text
              style={[
                styles.newsByFollowingText,
                !isForYouFeed && styles.newsByFollowingTextBold,
              ]}>
              {'Following'} |{' '}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onForYouFeedPress}>
            <Text
              style={[
                styles.newsByFollowingText,
                isForYouFeed && styles.newsByFollowingTextBold,
              ]}>
              {'For You'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <ViewPager
        style={styles.container}
        orientation={'vertical'}
        onPageSelected={e => setSelected(e.nativeEvent.position)}
        initialPage={startIndex ?? 0}>
        {feed.map((video, index) => (
          <FeedItem
            key={video.id ?? index.toString()}
            user={user}
            video={video}
            paused={paused}
            selected={selected}
            index={index}
            onSharePost={onSharePost}
            onReaction={onReaction}
            onFeedUserItemPress={onFeedUserItemPress}
            onCommentPress={onCommentPress}
            setPaused={setPaused}
            onTextFieldUserPress={onTextFieldUserPress}
            onTextFieldHashTagPress={onTextFieldHashTagPress}
            onDeletePost={onDeletePost}
            onUserReport={onUserReport}
          />
        ))}
      </ViewPager>
    </View>
  )
}
