import React, { useEffect, useRef } from 'react'
import { Image, View, Text, TouchableOpacity } from 'react-native'
import FastImage from 'react-native-fast-image'
import ActionSheet from 'react-native-actionsheet'
import { useIsFocused } from '@react-navigation/native'
import { useTheme, useTranslations } from 'dopenative'
import VideoPlayer from '../VideoPlayer'
import IMRichTextView from '../../../../Core/mentions/IMRichTextView/IMRichTextView'
import styles from './styles'

const defaultAvatar =
  'https://www.iosapptemplates.com/wp-content/uploads/2019/06/empty-avatar.jpg'

export default function FeedItem(props) {
  const {
    video,
    paused,
    selected,
    index,
    onReaction,
    onFeedUserItemPress,
    onCommentPress,
    setPaused,
    onSharePost,
    onTextFieldUserPress,
    onTextFieldHashTagPress,
    user,
    onDeletePost,
    onUserReport,
  } = props

  const { localized } = useTranslations()
  const { theme } = useTheme()

  const isFocused = useIsFocused()

  const selectedIcon = video.myReaction ? 'filledHeart' : 'heartUnfilled'
  const reactionCount = video.reactionsCount

  useEffect(() => {
    if (!isFocused) {
      setPaused(true)
    }
  }, [isFocused])

  const moreRef = useRef()
  const moreArray = useRef([localized('Share Post')])
  const isUserAuthor = video.authorID === user.id

  useEffect(() => {
    if (isUserAuthor) {
      moreArray.current.push(localized('Delete Post'))
    } else {
      moreArray.current.push(localized('Block User'))
      moreArray.current.push(localized('Report Post'))
    }

    moreArray.current.push(localized('Cancel'))
  }, [])

  const onMorePress = () => {
    moreRef.current.show()
  }

  const onMoreDialogDone = index => {
    if (index === moreArray.current.indexOf(localized('Share Post'))) {
      onSharePost(video)
    }

    if (
      index === moreArray.current.indexOf(localized('Report Post')) ||
      index === moreArray.current.indexOf(localized('Block User'))
    ) {
      onUserReport(video, moreArray.current[index])
    }

    if (index === moreArray.current.indexOf(localized('Delete Post'))) {
      onDeletePost(video)
    }
  }

  const onReactionPress = () => {
    onReaction('like', video)
  }

  const onUserItemPress = author => {
    setPaused(true)
    onFeedUserItemPress(author)
  }

  const onComment = video => {
    setPaused(true)
    onCommentPress(video)
  }

  const onTextFieldUser = textFieldUser => {
    setPaused(true)
    onTextFieldUserPress(textFieldUser)
  }

  const onTextFieldHashTag = hashTag => {
    setPaused(true)
    onTextFieldHashTagPress(hashTag)
  }

  const firstname = video.author?.firstName ?? ''
  const lastname = video.author?.lastName ?? ''

  const username = video.author?.username
    ? `@${video.author?.username}`
    : `@${firstname?.toLowerCase()}${lastname?.toLowerCase()}`

  return (
    <TouchableOpacity
      activeOpacity={1}
      key={video.id}
      onPress={() => setPaused(prevPaused => !prevPaused)}
      style={styles.videoContent}>
      {video.postMedia?.length >= 1 && (
        <VideoPlayer
          video={video.postMedia[0]}
          paused={paused}
          isMounted={selected === index}
        />
      )}
      <View style={styles.contentRight}>
        <View style={styles.contentRightUser}>
          <TouchableOpacity
            onPress={() => onUserItemPress(video.author)}
            style={styles.contentRightUserImageContainer}>
            <FastImage
              style={styles.contentRightUserImage}
              resizeMode="cover"
              source={{ uri: video.author.profilePictureURL || defaultAvatar }}
            />
          </TouchableOpacity>
          <View style={styles.contentRightUserPlus}>
            <Image style={styles.plusIcon} source={theme.icons.add} />
          </View>
        </View>

        <TouchableOpacity
          onPress={onReactionPress}
          style={styles.iconRightContainer}>
          <Image
            style={[
              styles.iconRight,
              selectedIcon !== 'heartUnfilled' && styles.iconLike,
            ]}
            source={theme.icons.heartFilled}
          />

          <Text style={styles.contentRightText}>
            {reactionCount > 1000
              ? `${reactionCount / 1000}K`
              : reactionCount > 0
              ? reactionCount
              : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onComment(video)}
          style={styles.iconRightContainer}>
          <Image style={styles.iconRight} source={theme.icons.commentFilled} />
          <Text style={styles.contentRightText}>
            {video.commentCount > 1000
              ? `${video.commentCount}K`
              : video.commentCount > 0
              ? video.commentCount
              : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onMorePress(video)}
          style={styles.iconRightContainer}>
          <Image
            style={styles.iconRight}
            source={isUserAuthor ? theme.icons.more : theme.icons.share}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.contentLeftBottom}>
        <TouchableOpacity onPress={() => onUserItemPress(video.author)}>
          <Text style={styles.contentLeftBottomNameUserText} numberOfLines={1}>
            {username}
          </Text>
        </TouchableOpacity>
        <IMRichTextView
          defaultTextStyle={styles.contentLeftBottomDescription}
          usernameStyle={styles.username}
          hashTagStyle={styles.hashTag}
          onUserPress={onTextFieldUser}
          onHashTagPress={onTextFieldHashTag}>
          {video.postText || ' '}
        </IMRichTextView>
        {video.song && (
          <View style={styles.contentLeftBottomMusicContainer}>
            <Image source={theme.icons.musicalNotes} style={styles.musicIcon} />
            <Text style={styles.contentLeftBottomMusic} numberOfLines={1}>
              {video.song?.title}
            </Text>
          </View>
        )}
      </View>
      <ActionSheet
        ref={moreRef}
        title={localized('More')}
        options={moreArray.current}
        destructiveButtonIndex={moreArray.current.indexOf('Delete Post')}
        cancelButtonIndex={moreArray.current.length - 1}
        onPress={onMoreDialogDone}
      />
    </TouchableOpacity>
  )
}
