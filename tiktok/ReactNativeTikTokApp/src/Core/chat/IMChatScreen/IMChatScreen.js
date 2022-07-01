import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useDispatch } from 'react-redux'
import { Alert, BackHandler, View, Dimensions } from 'react-native'
import { useTheme, useTranslations } from 'dopenative'
import ImagePicker from 'react-native-image-crop-picker'
import * as DocumentPicker from 'expo-document-picker'
import { useFocusEffect } from '@react-navigation/native'
import { IMIconButton } from '../../truly-native'
import { useCurrentUser } from '../../onboarding'
import IMChat from '../IMChat/IMChat'
import {
  useChatMessages,
  useChatChannels,
  useChatSingleChannel,
} from '../../chat'
import { storageAPI } from '../../media'
import { useUserReportingMutations } from '../../user-reporting'
import { formatMessage } from '../helpers/utils'

const IMChatScreen = props => {
  const { localized } = useTranslations()
  const { theme, appearance } = useTheme()
  const currentUser = useCurrentUser()
  const dispatch = useDispatch()

  const { navigation, route } = props
  const openedFromPushNotification = route.params.openedFromPushNotification
  const isChatUserItemPress = route.params.isChatUserItemPress

  const {
    messages,
    subscribeToMessages,
    loadMoreMessages,
    sendMessage: sendMessageAPI,
    deleteMessage,
    addReaction,
  } = useChatMessages()

  const [channel, setChannel] = useState(null)
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [downloadObject, setDownloadObject] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)
  const [isRenameDialogVisible, setIsRenameDialogVisible] = useState(false)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(-1)
  const [inReplyToItem, setInReplyToItem] = useState(null)
  const [images, setImages] = useState([])
  const [isInputClear, setIsInputClear] = useState(false)

  const {
    createChannel,
    markChannelMessageAsRead,
    updateGroup,
    leaveGroup,
    deleteGroup,
  } = useChatChannels()
  const { remoteChannel, subscribeToSingleChannel } = useChatSingleChannel(
    route.params.channel,
  )

  const { markAbuse } = useUserReportingMutations()
  const subscribeMessagesRef = useRef(null)

  const groupSettingsActionSheetRef = useRef(null)
  const adminGroupSettingsActionSheetRef = useRef(null)
  const privateSettingsActionSheetRef = useRef(null)

  useLayoutEffect(() => {
    if (!openedFromPushNotification) {
      configureNavigation(
        channelWithHydratedOtherParticipants(route.params.channel),
      )
    } else {
      navigation.setOptions({ headerTitle: '' })
    }
  }, [navigation])

  useEffect(() => {
    configureNavigation(channel)
  }, [channel])

  useEffect(() => {
    if (messages) {
      configureImages()
    }
  }, [messages])

  useEffect(() => {
    if (selectedMediaIndex !== -1) {
      setIsMediaViewerOpen(true)
    } else {
      setIsMediaViewerOpen(false)
    }
  }, [selectedMediaIndex])

  useEffect(() => {
    const hydratedChannel = channelWithHydratedOtherParticipants(
      route.params.channel,
    )
    if (!hydratedChannel) {
      return
    }

    const channelID = hydratedChannel?.channelID || hydratedChannel?.id

    setChannel(hydratedChannel)
    subscribeMessagesRef.current = subscribeToMessages(channelID)
    const unsubscribe = subscribeToSingleChannel(channelID)

    return () => {
      subscribeMessagesRef.current && subscribeMessagesRef.current()
      unsubscribe && unsubscribe()
    }
  }, [currentUser?.id])

  useFocusEffect(
    React.useCallback(() => {
      BackHandler.addEventListener(
        'hardwareBackPress',
        onBackButtonPressAndroid,
      )
      return () => {
        BackHandler.removeEventListener(
          'hardwareBackPress',
          onBackButtonPressAndroid,
        )
      }
    }, [onBackButtonPressAndroid]),
  )

  useEffect(() => {
    if (downloadObject !== null) {
      // We've just finished the photo upload, so we send the message out
      setUploadProgress(0)
      onSendInput()
    }
  }, [downloadObject])

  const onListEndReached = useCallback(() => {
    loadMoreMessages(route?.params?.channel?.id)
  }, [loadMoreMessages, route?.params?.channel?.id])

  const configureNavigation = channel => {
    if (!channel) {
      return
    }

    var title = channel?.name
    var isGroupChat = channel?.otherParticipants?.length > 1
    if (!title && channel?.otherParticipants?.length > 0) {
      title =
        channel.otherParticipants[0]?.fullName ||
        channel.otherParticipants[0]?.firstName +
          ' ' +
          channel.otherParticipants[0]?.lastName
    }

    navigation.setOptions({
      headerTitle: title || route.params.title || localized('Chat'),
      headerStyle: {
        backgroundColor: theme.colors[appearance].primaryBackground,
      },
      headerBackTitleVisible: false,
      headerTitleStyle: isGroupChat
        ? {
            width: Dimensions.get('window').width - 110,
          }
        : null,
      headerTintColor: theme.colors[appearance].primaryText,
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <IMIconButton
            source={require('../assets/settings-icon.png')}
            tintColor={theme.colors[appearance].primaryForeground}
            onPress={onSettingsPress}
            marginRight={15}
            width={20}
            height={20}
          />
        </View>
      ),
    })
  }

  useEffect(() => {
    if (!remoteChannel) {
      return
    }
    // We have a hydrated channel, so we replace the partial channel we have on the state
    const hydratedChannel = channelWithHydratedOtherParticipants(remoteChannel)
    setChannel(hydratedChannel)
    markThreadItemAsReadIfNeeded(hydratedChannel)

    // We have a hydrated channel, so we update the title of the screen
    if (openedFromPushNotification) {
      configureNavigation(hydratedChannel)
    }
  }, [remoteChannel])

  const channelWithHydratedOtherParticipants = channel => {
    const allParticipants = channel?.participants
    if (!allParticipants) {
      return channel
    }
    // otherParticipants are all the participants in the chat, except for the currently logged in user
    const otherParticipants =
      allParticipants &&
      allParticipants.filter(
        participant => participant && participant.id !== currentUser.id,
      )
    return { ...channel, otherParticipants }
  }

  const onBackButtonPressAndroid = useCallback(() => {
    navigation.goBack()
    return true
  }, [navigation])


  const onSettingsPress = useCallback(() => {
    if (channel?.admins && channel?.admins?.includes(currentUser?.id)) {
      adminGroupSettingsActionSheetRef.current.show()
    } else if (channel?.admins) {
      groupSettingsActionSheetRef.current.show()
    } else {
      privateSettingsActionSheetRef.current.show()
    }
  }, [channel?.admins, currentUser?.id])

  const onViewMembers = useCallback(() => {
    navigation.navigate('ViewGroupMembers', {
      channel: remoteChannel,
    })
  }, [navigation, remoteChannel])

  const onChangeName = useCallback(
    async text => {
      const channelID = channel?.channelID || channel?.id
      setIsRenameDialogVisible(false)
      const data = {
        ...channel,
        name: text,
        content: `${
          currentUser?.firstName ?? 'Someone'
        } has renamed the group.`,
      }
      await updateGroup(channelID, currentUser?.id, data)
      setChannel(data)
      configureNavigation(data)
    },
    [
      channel,
      currentUser?.id,
      setChannel,
      configureNavigation,
      updateGroup,
      setIsRenameDialogVisible,
    ],
  )

  const onLeave = useCallback(() => {
    if (
      channel?.admins.length === 1 &&
      channel?.admins?.includes(currentUser?.id)
    ) {
      Alert.alert(
        localized('Set a new admin'),
        localized(
          'You are the only admin of this group so please choose a new admin first in order to leave this group',
        ),
        [{ text: 'Okay' }],
        { cancelable: false },
      )
    } else {
      Alert.alert(
        localized(`Leave ${channel?.name ?? 'group'}`),
        localized('Are you sure you want to leave this group?'),
        [
          {
            text: 'Yes',
            onPress: onLeaveGroupConfirmed,
            style: 'destructive',
          },
          { text: 'No' },
        ],
        { cancelable: false },
      )
    }
  }, [onLeaveGroupConfirmed, channel])

  const onDeleteGroup = useCallback(() => {
    if (channel?.admins?.includes(currentUser?.id)) {
      Alert.alert(
        localized('Delete Group'),
        localized('Are you sure you want to delete this group?'),
        [
          {
            text: 'Delete Group',
            onPress: () => onDeleteGroupConfirmed(),
            style: 'destructive',
          },
          { text: 'No' },
        ],
        { cancelable: false },
      )
    }
  }, [onLeaveGroupConfirmed, channel])

  const onLeaveGroupConfirmed = useCallback(async () => {
    await leaveGroup(
      channel?.id,
      currentUser?.id,
      `${currentUser?.firstName ?? 'Someone'} has left the group.`,
    )
    navigation.goBack(null)
  }, [leaveGroup, navigation, channel, currentUser?.id])

  const onDeleteGroupConfirmed = useCallback(async () => {
    await deleteGroup(channel?.id)
    navigation.goBack(null)
  }, [deleteGroup, channel?.id, navigation])

  const showRenameDialog = useCallback(
    show => {
      setIsRenameDialogVisible(show)
    },
    [setIsRenameDialogVisible],
  )

  const markThreadItemAsReadIfNeeded = channel => {
    const {
      id: channelID,
      lastThreadMessageId,
      readUserIDs,
      participants,
      lastMessage,
    } = channel
    const userID = currentUser?.id
    const isRead = readUserIDs?.includes(userID)

    if (!isRead && channelID && lastMessage && userID) {
      const newReadUserIDs = readUserIDs ? [...readUserIDs, userID] : [userID]
      markChannelMessageAsRead(
        channelID,
        userID,
        lastThreadMessageId,
        newReadUserIDs,
        participants,
      )
    }
  }

  const onChangeTextInput = useCallback(
    text => {
      setInputValue(text)
    },
    [setInputValue],
  )

  const createOne2OneChannel = async () => {
    const response = await createChannel(
      currentUser,
      channelWithHydratedOtherParticipants(channel)?.otherParticipants,
    )
    if (response) {
      const channelID = channel?.channelID || channel?.id

      setChannel(channelWithHydratedOtherParticipants(response))
      subscribeMessagesRef.current && subscribeMessagesRef.current()
      subscribeMessagesRef.current = subscribeToMessages(channelID)
    }
    return response
  }

  const onSendInput = async () => {
    if (messages?.length > 0 || channel?.otherParticipants?.length > 1) {
      await sendMessage()
      return
    }

    // If we don't have a chat message, we need to create a 1-1 channel first
    setLoading(true)
    const newChannel = await createOne2OneChannel()
    if (newChannel) {
      await sendMessage(newChannel)
    }
    setLoading(false)
  }

  const getParticipantPictures = () => {
    if (channel?.otherParticipants) {
      return channel.otherParticipants.map(participant => {
        return {
          participantId: participant.id || participant.userID,
          profilePictureURL: participant.profilePictureURL,
          profilePictureKey: participant.profilePictureKey,
        }
      })
    } else {
      return []
    }
  }

  const sendMessage = async (newChannel = channel) => {
    let tempInputValue = inputValue
    const tempInReplyToItem = inReplyToItem
    const participantProfilePictureURLs = getParticipantPictures()
    setInputValue('')
    setInReplyToItem(null)

    if (!tempInputValue) {
      tempInputValue = formatMessage(downloadObject, localized)
    }

    setIsInputClear(true)

    const response = await sendMessageAPI(
      currentUser,
      newChannel,
      tempInputValue,
      downloadObject,
      tempInReplyToItem,
      participantProfilePictureURLs,
    )
    if (response?.error) {
      alert(response.error)
      setInputValue(tempInputValue)
      setInReplyToItem(tempInReplyToItem)
    } else {
      setDownloadObject(null)
    }
  }

  const onAddMediaPress = useCallback(photoUploadDialogRef => {
    photoUploadDialogRef.current.show()
  })

  const onAudioRecordSend = useCallback(
    audioRecord => {
      startUpload(audioRecord)
    },
    [startUpload],
  )

  const onLaunchCamera = useCallback(() => {
    ImagePicker.openCamera({
      cropping: false,
    })
      .then(image => {
        startUpload(image)
      })
      .catch(function (error) {
        console.log(error)
      })
  }, [startUpload])

  const onOpenPhotos = useCallback(() => {
    ImagePicker.openPicker({
      cropping: false,
      multiple: false,
    })
      .then(image => {
        startUpload(image)
      })
      .catch(function (error) {
        console.log(error)
      })
  }, [startUpload])

  const onAddDocPress = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync()
      if (res) {
        startUpload({
          ...res,
          mime: 'file',
          fileID: +new Date() + res.name,
        })
      }
    } catch (e) {
      console.warn(e)
    }
  }, [startUpload])

  const startUpload = uploadData => {
    const { mime } = uploadData

    storageAPI.processAndUploadMediaFileWithProgressTracking(
      uploadData,
      async (loaded, total) => {
        const uploadProgress = (loaded / total) * 100
        setUploadProgress(uploadProgress)
      },
      async (url, urlKey = '') => {
        if (url) {
          setDownloadObject({
            ...uploadData,
            source: url,
            uri: url,
            url,
            urlKey,
            mime,
          })
        }
      },
      error => {
        setUploadProgress(0)
        alert(localized('Oops! An error has occurred. Please try again.'))
        console.log(error)
      },
    )
  }

  const configureImages = () => {
    var images = []

    messages?.forEach(item => {
      if (item && item.url && item.url !== '') {
        if (item.url.mime && item.url.mime.startsWith('image')) {
          images.push({
            id: item.id,
            url: item.url,
          })
        } else if (!item.url.mime && item.url.startsWith('https://')) {
          // To handle old format before video feature
          images.push({
            id: item.id,
            url: item.url,
          })
        }
      }
    })
    setImages(images)
  }

  const onChatMediaPress = useCallback(
    item => {
      const index = images?.findIndex(image => {
        return image.id === item.id
      })
      setSelectedMediaIndex(index)
    },
    [images, setSelectedMediaIndex],
  )

  const onMediaClose = useCallback(() => {
    setSelectedMediaIndex(-1)
  }, [setSelectedMediaIndex])

  const onUserBlockPress = useCallback(() => {
    reportAbuse('block')
  }, [channel?.otherParticipants, currentUser?.id, reportAbuse])

  const onUserReportPress = useCallback(() => {
    reportAbuse('report')
  }, [channel?.otherParticipants, currentUser?.id, reportAbuse])

  const reportAbuse = async type => {
    setLoading(true)
    const participants = channel?.otherParticipants

    if (!participants || participants.length != 1) {
      return
    }
    const myID = currentUser.id
    const otherUserID = participants[0].id

    const response = await markAbuse(myID, otherUserID, type)
    if (!response?.error) {
      navigation.goBack(null)
    }
    setLoading(false)
  }

  const onReplyActionPress = useCallback(
    inReplyToItem => {
      setInReplyToItem(inReplyToItem)
    },
    [setInReplyToItem, inReplyToItem],
  )

  const onReplyingToDismiss = useCallback(() => {
    setInReplyToItem(null)
  }, [setInReplyToItem])

  const onDeleteThreadItem = useCallback(
    message => {
      deleteMessage(channel, message?.id)
    },
    [channel, deleteMessage],
  )

  const onChatUserItemPress = useCallback(
    async item => {
      if (isChatUserItemPress) {
        if (item.id === currentUser.id) {
          navigation.navigate('MainProfile', {
            stackKeyTitle: 'MainProfile',
            lastScreenTitle: 'Chat',
          })
        } else {
          navigation.navigate('MainProfile', {
            user: item,
            stackKeyTitle: 'MainProfile',
            lastScreenTitle: 'Chat',
          })
        }
      }
    },
    [navigation, currentUser?.id],
  )

  const onReaction = useCallback(
    async (reaction, message) => {
      await addReaction(message, currentUser, reaction, channel?.id)
    },
    [addReaction, currentUser],
  )

  return (
    <IMChat
      user={currentUser}
      messages={messages}
      inputValue={inputValue}
      inReplyToItem={inReplyToItem}
      loading={loading}
      onAddMediaPress={onAddMediaPress}
      onAddDocPress={onAddDocPress}
      onSendInput={onSendInput}
      onAudioRecordSend={onAudioRecordSend}
      onChangeTextInput={onChangeTextInput}
      onLaunchCamera={onLaunchCamera}
      onOpenPhotos={onOpenPhotos}
      uploadProgress={uploadProgress}
      mediaItemURLs={images.flatMap(i => i.url?.url)}
      isMediaViewerOpen={isMediaViewerOpen}
      selectedMediaIndex={selectedMediaIndex}
      onChatMediaPress={onChatMediaPress}
      onMediaClose={onMediaClose}
      isRenameDialogVisible={isRenameDialogVisible}
      groupSettingsActionSheetRef={groupSettingsActionSheetRef}
      adminGroupSettingsActionSheetRef={adminGroupSettingsActionSheetRef}
      privateSettingsActionSheetRef={privateSettingsActionSheetRef}
      showRenameDialog={showRenameDialog}
      onViewMembers={onViewMembers}
      onChangeName={onChangeName}
      onLeave={onLeave}
      onDeleteGroup={onDeleteGroup}
      onUserBlockPress={onUserBlockPress}
      onUserReportPress={onUserReportPress}
      onReplyActionPress={onReplyActionPress}
      onReplyingToDismiss={onReplyingToDismiss}
      onDeleteThreadItem={onDeleteThreadItem}
      channelItem={channel}
      onListEndReached={onListEndReached}
      isInputClear={isInputClear}
      setIsInputClear={setIsInputClear}
      onChatUserItemPress={onChatUserItemPress}
      onReaction={onReaction}
    />
  )
}

export default IMChatScreen
