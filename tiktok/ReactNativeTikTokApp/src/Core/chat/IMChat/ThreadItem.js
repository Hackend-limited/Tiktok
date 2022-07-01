import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Image,
  View,
  TouchableOpacity,
  Text,
  Platform,
  NativeModules,
  TouchableWithoutFeedback,
} from 'react-native'
import FastImage from 'react-native-fast-image'
import { useTheme, useTranslations } from 'dopenative'
import ThreadMediaItem from './ThreadMediaItem'
import { IMRichTextView } from '../../mentions'
import FacePile from './FacePile'
import dynamicStyles, { WINDOW_HEIGHT } from './styles'
import { TNTouchableIcon } from '../../truly-native'

const { VideoPlayerManager } = NativeModules

const assets = {
  boederImgSend: require('../assets/borderImg1.png'),
  boederImgReceive: require('../assets/borderImg2.png'),
  textBoederImgSend: require('../assets/textBorderImg1.png'),
  textBoederImgReceive: require('../assets/textBorderImg2.png'),
  reply: require('../assets/reply-icon.png'),
}

function ThreadItem(props) {
  const {
    item,
    user,
    onChatMediaPress,
    onSenderProfilePicturePress,
    onMessageLongPress,
    isRecentItem,
    onChatUserItemPress,
  } = props
  const { localized } = useTranslations()
  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)

  const senderProfilePictureURL = item.senderProfilePictureURL
  const [readFacePile, setReadFacePile] = useState([])

  const videoRef = useRef(null)
  const imagePath = useRef()
  const threadRef = useRef()

  const updateItemImagePath = path => {
    imagePath.current = path
  }

  const isAudio = item.url && item.url.mime && item.url.mime.startsWith('audio')
  const isFile = item.url && item.url.mime && item.url.mime.startsWith('file')
  const isVideo = item.url && item.url.mime && item.url.mime.startsWith('video')
  const outBound = item.senderID === user.userID
  const inBound = item.senderID !== user.userID

  useEffect(() => {
    getReadFacePile()
  }, [item?.readUserIDs])

  const getReadFacePile = () => {
    const facePile = []
    if (
      outBound &&
      isRecentItem &&
      item?.participantProfilePictureURLs &&
      item?.readUserIDs
    ) {
      item?.readUserIDs.forEach(readUserID => {
        const userFace = item?.participantProfilePictureURLs.find(
          participant => participant.participantId === readUserID,
        )

        userFace && facePile.push(userFace)
      })
    }
    setReadFacePile(facePile)
  }

  const didPressMediaChat = () => {
    if (isAudio) {
      return
    }

    const newLegacyItemURl = imagePath.current
    const newItemURl = { ...item.url, url: imagePath.current }
    let ItemUrlToUse

    if (!item.url.url) {
      ItemUrlToUse = newLegacyItemURl
    } else {
      ItemUrlToUse = newItemURl
    }

    if (isVideo) {
      if (Platform.OS === 'android') {
        VideoPlayerManager.showVideoPlayer(item.url.url)
      } else {
        if (videoRef.current) {
          videoRef.current.presentFullscreenPlayer()
        }
      }
    } else {
      onChatMediaPress({ ...item, senderProfilePictureURL, url: ItemUrlToUse })
    }
  }

  const renderTextBoederImg = () => {
    if (item.senderID === user.userID) {
      return (
        <Image
          source={assets.textBoederImgSend}
          style={styles.textBoederImgSend}
        />
      )
    }

    if (item.senderID !== user.userID) {
      return (
        <Image
          source={assets.textBoederImgReceive}
          style={styles.textBoederImgReceive}
        />
      )
    }
  }

  const renderBoederImg = () => {
    if (isAudio || isFile) {
      return renderTextBoederImg()
    }
    if (item.senderID === user.userID) {
      return (
        <Image source={assets.boederImgSend} style={styles.boederImgSend} />
      )
    }

    if (item.senderID !== user.userID) {
      return (
        <Image
          source={assets.boederImgReceive}
          style={styles.boederImgReceive}
        />
      )
    }
  }

  const renderInReplyToIfNeeded = (item, isMine) => {
    const inReplyToItem = item.inReplyToItem
    if (
      inReplyToItem &&
      inReplyToItem?.content &&
      inReplyToItem?.content?.length > 0
    ) {
      return (
        <View
          style={
            isMine
              ? styles.inReplyToItemContainerView
              : styles.inReplyToTheirItemContainerView
          }>
          <View style={styles.inReplyToItemHeaderView}>
            <Image style={styles.inReplyToIcon} source={assets.reply} />
            <Text style={styles.inReplyToHeaderText}>
              {isMine
                ? localized('You replied to ') +
                  (inReplyToItem.senderFirstName ||
                    inReplyToItem.senderLastName)
                : (item.senderFirstName || item.senderLastName) +
                  localized(' replied to ') +
                  (inReplyToItem.senderFirstName ||
                    inReplyToItem.senderLastName)}
            </Text>
          </View>
          <View style={styles.inReplyToItemBubbleView}>
            <IMRichTextView
              onUserPress={onChatUserItemPress}
              defaultTextStyle={styles.inReplyToItemBubbleText}>
              {item?.inReplyToItem?.content?.slice(0, 50)}
            </IMRichTextView>
          </View>
        </View>
      )
    }
    return null
  }

  const handleOnPress = () => {}

  const handleOnLongPress = () => {
    threadRef.current.measure((fx, fy, width, height, px, py) => {
      let reactionsPosition = 0
      if (py <= 0) {
        reactionsPosition = py * -1 + WINDOW_HEIGHT * 0.05
      } else if (py - WINDOW_HEIGHT * 0.2 < WINDOW_HEIGHT * 0.05) {
        reactionsPosition = py - (WINDOW_HEIGHT * 0.07)
      } else {
        reactionsPosition = py - WINDOW_HEIGHT * 0.2
      }
      onMessageLongPress &&
        onMessageLongPress(
          item,
          isAudio || isVideo || item.url,
          reactionsPosition,
        )
    })
  }

  const handleOnPressOut = () => {}

  const renderReactionsContainer = useCallback(() => {
    let totalIcons = 0
    if (item?.reactionsCount > 0) {
      return (
        <View style={styles.threadItemReactionContainer}>
          {item?.reactions &&
            Object.keys(item?.reactions).map(reactionKey => {
              if (item?.reactions[reactionKey].length > 0 && totalIcons < 3) {
                totalIcons = totalIcons + 1
                return (
                  <TNTouchableIcon
                    containerStyle={styles.threadReactionIconContainer}
                    iconSource={theme?.icons[reactionKey]}
                    imageStyle={styles.threadReactionIcon}
                    // onPress={() => onReactionPress(tappedIcon)}
                  />
                )
              }
            })}
          <Text style={styles.threadItemReactionsCountText}>
            {item?.reactionsCount}
          </Text>
        </View>
      )
    }
  }, [appearance, item?.reactions, item?.reactionsCount])

  return (
    <TouchableWithoutFeedback
      onPress={handleOnPress}
      onLongPress={handleOnLongPress}
      onPressOut={handleOnPressOut}>
      <View
        ref={ref => {
          threadRef.current = ref
        }}>
        {/* user thread item */}
        {outBound && (
          <>
            <View style={styles.sendItemContainer}>
              {item.url != null && item.url != '' && (
                <TouchableOpacity
                  onPress={didPressMediaChat}
                  onLongPress={handleOnLongPress}
                  activeOpacity={0.9}
                  style={[
                    styles.itemContent,
                    styles.sendItemContent,
                    { padding: 0, marginRight: isAudio || isFile ? 8 : -1 },
                  ]}>
                  <ThreadMediaItem
                    outBound={outBound}
                    updateItemImagePath={updateItemImagePath}
                    videoRef={videoRef}
                    dynamicStyles={styles}
                    item={item}
                  />
                  {renderBoederImg()}
                  {renderReactionsContainer()}
                </TouchableOpacity>
              )}
              {!item.url && (
                <View style={[styles.myMessageBubbleContainerView]}>
                  {renderInReplyToIfNeeded(item, true)}
                  <View style={[styles.itemContent, styles.sendItemContent]}>
                    <IMRichTextView
                      onUserPress={onChatUserItemPress}
                      defaultTextStyle={styles.sendTextMessage}>
                      {item?.content}
                    </IMRichTextView>
                    {renderTextBoederImg()}
                    {renderReactionsContainer()}
                  </View>
                </View>
              )}
              <TouchableOpacity
                onPress={() =>
                  onSenderProfilePicturePress &&
                  onSenderProfilePicturePress(item)
                }>
                <FastImage
                  style={styles.userIcon}
                  source={{ uri: senderProfilePictureURL }}
                />
              </TouchableOpacity>
            </View>
            {isRecentItem && (
              <View style={styles.sendItemContainer}>
                <FacePile numFaces={4} faces={readFacePile} />
              </View>
            )}
          </>
        )}
        {/* receiver thread item */}
        {inBound && (
          <View style={styles.receiveItemContainer}>
            <TouchableOpacity
              onPress={() =>
                onSenderProfilePicturePress && onSenderProfilePicturePress(item)
              }>
              <FastImage
                style={styles.userIcon}
                source={{ uri: senderProfilePictureURL }}
              />
            </TouchableOpacity>
            {item.url != null && item.url != '' && (
              <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={handleOnLongPress}
                style={[
                  styles.itemContent,
                  styles.receiveItemContent,
                  { padding: 0, marginLeft: isAudio || isFile ? 8 : -1 },
                ]}
                onPress={didPressMediaChat}>
                <ThreadMediaItem
                  updateItemImagePath={updateItemImagePath}
                  videoRef={videoRef}
                  dynamicStyles={styles}
                  item={item}
                />
                {renderBoederImg()}
                {renderReactionsContainer()}
              </TouchableOpacity>
            )}
            {!item.url && (
              <View style={styles.theirMessageBubbleContainerView}>
                {renderInReplyToIfNeeded(item, false)}
                <View style={[styles.itemContent, styles.receiveItemContent]}>
                  <IMRichTextView
                    onUserPress={onChatUserItemPress}
                    defaultTextStyle={styles.receiveTextMessage}>
                    {item?.content}
                  </IMRichTextView>
                  {renderTextBoederImg()}
                  {renderReactionsContainer()}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  )
}

ThreadItem.propTypes = {}

export default ThreadItem
