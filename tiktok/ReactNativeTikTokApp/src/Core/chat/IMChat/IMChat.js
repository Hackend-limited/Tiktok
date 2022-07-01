import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Alert,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import PropTypes from 'prop-types'
import ActionSheet from 'react-native-actionsheet'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import { useTheme, useTranslations } from 'dopenative'
import TNMediaViewerModal from '../../truly-native/TNMediaViewerModal'
import DialogInput from 'react-native-dialog-input'
import { useChatChannels } from '../.'
import BottomInput from './BottomInput'
import MessageThread from './MessageThread'
import dynamicStyles from './styles'
import { TNActivityIndicator, TNTouchableIcon } from '../../truly-native'
import { EU } from '../../mentions/IMRichTextInput/EditorUtils'

const reactionIcons = ['like', 'love', 'laugh', 'surprised', 'cry', 'angry']

function IMChat(props) {
  const {
    onSendInput,
    onAudioRecordSend,
    messages,
    inputValue,
    onChangeTextInput,
    user,
    loading,
    inReplyToItem,
    onLaunchCamera,
    onOpenPhotos,
    onAddMediaPress,
    uploadProgress,
    mediaItemURLs,
    isMediaViewerOpen,
    selectedMediaIndex,
    onChatMediaPress,
    onMediaClose,
    onChangeName,
    onAddDocPress,
    isRenameDialogVisible,
    groupSettingsActionSheetRef,
    adminGroupSettingsActionSheetRef,
    privateSettingsActionSheetRef,
    showRenameDialog,
    onViewMembers,
    onLeave,
    onDeleteGroup,
    onUserBlockPress,
    onUserReportPress,
    onSenderProfilePicturePress,
    onReplyActionPress,
    onReplyingToDismiss,
    onDeleteThreadItem,
    channelItem,
    onListEndReached,
    isInputClear,
    setIsInputClear,
    onChatUserItemPress,
    onReaction,
  } = props

  const { localized } = useTranslations()
  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)
  const { updateTypingUsers } = useChatChannels()

  const [channel] = useState({})
  const [temporaryInReplyToItem, setTemporaryInReplyToItem] = useState(null)
  const [threadItemActionSheet, setThreadItemActionSheet] = useState({})
  const [isReactionsContainerVisible, setIsReactionsContainerVisible] =
    useState(false)

  const photoUploadDialogRef = useRef()

  const hasPreviouslyMarkedTyping = useRef(false)
  const staleUserTyping = useRef(null)

  const mediaThreadItemSheetOptions = [localized('Cancel')]
  const inBoundThreadItemSheetOptions = [localized('Reply')]
  const outBoundThreadItemSheetOptions = [
    localized('Reply'),
    localized('Delete'),
  ]

  useEffect(() => {
    return () => {
      handleIsUserTyping('')
    }
  }, [])

  const handleIsUserTyping = inputValue => {
    clearTimeout(staleUserTyping.current)
    const userID = user.id
    const typingUsers = channelItem?.typingUsers || []
    const typingUsersCopy = [...typingUsers]
    const notTypingUser = {
      userID,
      isTyping: false,
    }
    const typingUser = {
      userID,
      isTyping: true,
    }
    let typingUserIndex = -1

    typingUserIndex = typingUsers.findIndex(
      existingTypingUser => existingTypingUser.userID === userID,
    )

    if (inputValue?.length > 0) {
      if (typingUserIndex > -1) {
        typingUsersCopy[typingUserIndex] = typingUser
      } else {
        typingUsersCopy.push(typingUser)
      }

      const channelID = channelItem?.channelID || channelItem?.id

      !hasPreviouslyMarkedTyping.current &&
        updateTypingUsers(channelID, typingUsersCopy)
      hasPreviouslyMarkedTyping.current = true
      return
    }

    if (inputValue?.length === 0) {
      if (typingUserIndex > -1) {
        typingUsersCopy[typingUserIndex] = notTypingUser
      } else {
        typingUsersCopy.push(notTypingUser)
      }

      const channelID = channelItem?.channelID || channelItem?.id

      hasPreviouslyMarkedTyping.current &&
        updateTypingUsers(channelID, typingUsersCopy)
      hasPreviouslyMarkedTyping.current = false
      return
    }
  }

  const handleStaleUserTyping = () => {
    staleUserTyping.current = setTimeout(() => {
      handleIsUserTyping('')
    }, 2000)
  }

  const onChangeText = useCallback(
    ({ displayText, text }) => {
      const mentions = EU.findMentions(text)
      onChangeTextInput({
        content: text,
        mentions,
      })
      handleIsUserTyping(displayText)
      handleStaleUserTyping()
    },
    [handleIsUserTyping, handleStaleUserTyping, onChangeTextInput],
  )

  const onAudioRecordDone = useCallback(
    item => {
      onAudioRecordSend(item)
    },
    [onAudioRecordSend],
  )

  const onSend = useCallback(() => {
    onSendInput()
    handleIsUserTyping('')
  }, [onSendInput, handleIsUserTyping])

  const onPhotoUploadDialogDone = useCallback(
    index => {
      if (index == 0) {
        onLaunchCamera()
      }

      if (index == 1) {
        onOpenPhotos()
      }
    },
    [onLaunchCamera, onOpenPhotos],
  )

  const onGroupSettingsActionDone = useCallback(
    index => {
      if (index === 0) {
        onViewMembers()
      } else if (index === 1) {
        showRenameDialog(true)
      } else if (index === 2) {
        onLeave()
      }
    },
    [onLeave, onViewMembers, showRenameDialog],
  )
  const onAdminGroupSettingsActionDone = useCallback(
    index => {
      if (index === 0) {
        onViewMembers()
      } else if (index === 1) {
        showRenameDialog(true)
      } else if (index === 2) {
        onLeave()
      } else if (index === 3) {
        onDeleteGroup()
      }
    },
    [onDeleteGroup, onLeave, onViewMembers, showRenameDialog],
  )

  const onPrivateSettingsActionDone = useCallback(
    index => {
      if (index == 2) {
        return
      }
      var message, actionCallback
      if (index == 0) {
        actionCallback = onUserBlockPress
        message = localized(
          "Are you sure you want to block this user? You won't see their messages again.",
        )
      } else if (index == 1) {
        actionCallback = onUserReportPress
        message = localized(
          "Are you sure you want to report this user? You won't see their messages again.",
        )
      }
      Alert.alert(localized('Are you sure?'), message, [
        {
          text: localized('Yes'),
          onPress: actionCallback,
        },
        {
          text: localized('Cancel'),
          style: 'cancel',
        },
      ])
    },
    [localized, onUserBlockPress, onUserReportPress],
  )

  const onMessageLongPress = useCallback(
    (threadItem, isMedia, reactionsPosition) => {
      setTemporaryInReplyToItem(threadItem)
      setIsReactionsContainerVisible(true)

      if (isMedia) {
        setThreadItemActionSheet({
          options: mediaThreadItemSheetOptions,
          reactionsPosition: reactionsPosition,
        })
      } else if (user.id === threadItem?.senderID) {
        setThreadItemActionSheet({
          inBound: false,
          options: outBoundThreadItemSheetOptions,
          reactionsPosition: reactionsPosition,
        })
      } else {
        setThreadItemActionSheet({
          inBound: true,
          options: inBoundThreadItemSheetOptions,
          reactionsPosition: reactionsPosition,
        })
      }
    },
    [setThreadItemActionSheet, setTemporaryInReplyToItem, user.id],
  )

  const onReplyPress = useCallback(
    index => {
      if (index === 0) {
        onReplyActionPress && onReplyActionPress(temporaryInReplyToItem)
      }
    },
    [onReplyActionPress, temporaryInReplyToItem],
  )

  const handleInBoundThreadItemActionSheet = useCallback(
    index => {
      if (index === 0) {
        onReplyPress(index)
      }
    },
    [onReplyPress],
  )

  const handleOutBoundThreadItemActionSheet = useCallback(
    index => {
      if (index === 0) {
        onReplyPress(index)
      }

      if (index === 1) {
        onDeleteThreadItem && onDeleteThreadItem(temporaryInReplyToItem)
      }
    },
    [onDeleteThreadItem, onReplyPress],
  )

  const onThreadItemActionSheetDone = useCallback(
    index => {
      if (threadItemActionSheet.inBound !== undefined) {
        if (threadItemActionSheet.inBound) {
          handleInBoundThreadItemActionSheet(index)
        } else {
          handleOutBoundThreadItemActionSheet(index)
        }
      }
    },
    [threadItemActionSheet.inBound, handleInBoundThreadItemActionSheet],
  )

  const onReactionPress = async reaction => {
    // this was a reaction on the reactions tray, coming after a long press + one tap

    setIsReactionsContainerVisible(false)
    onReaction(reaction, temporaryInReplyToItem)
  }

  const renderReactionButtonIcon = (src, tappedIcon, index) => {
    return (
      <TNTouchableIcon
        key={index + 'icon'}
        containerStyle={styles.reactionIconContainer}
        iconSource={src}
        imageStyle={styles.reactionIcon}
        onPress={() => onReactionPress(tappedIcon)}
      />
    )
  }

  const renderReactionsContainer = () => {
    if (isReactionsContainerVisible) {
      return (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setIsReactionsContainerVisible(false)
          }}
          style={styles.threadReactionContainer}>
          <View
            style={[
              styles.reactionContainer,
              { top: threadItemActionSheet?.reactionsPosition },
            ]}>
            {reactionIcons.map((icon, index) =>
              renderReactionButtonIcon(theme.icons[icon], icon, index),
            )}
          </View>
        </TouchableOpacity>
      )
    }
    return null
  }

  const renderThreadItemActionSheet = () => {
    return (
      <View
        style={[
          styles.threadItemActionSheetContainer,
          styles.bottomContentContainer,
        ]}>
        {threadItemActionSheet?.options?.map((item, index) => {
          return (
            <TouchableOpacity
              key={item + index}
              onPress={() => {
                onThreadItemActionSheetDone(index)
                setIsReactionsContainerVisible(false)
              }}>
              <Text style={styles.threadItemActionSheetOptionsText}>
                {item}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.personalChatContainer}>
      <KeyboardAwareView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.nonkeyboardContainer}>
        <MessageThread
          messages={messages}
          user={user}
          onChatMediaPress={onChatMediaPress}
          onSenderProfilePicturePress={onSenderProfilePicturePress}
          onMessageLongPress={onMessageLongPress}
          channelItem={channelItem}
          onListEndReached={onListEndReached}
          onChatUserItemPress={onChatUserItemPress}
        />
        {renderReactionsContainer()}
      </KeyboardAwareView>
      {!isReactionsContainerVisible ? (
        <BottomInput
          uploadProgress={uploadProgress}
          value={inputValue}
          onAudioRecordDone={onAudioRecordDone}
          onChangeText={onChangeText}
          onSend={onSend}
          trackInteractive={true}
          onAddMediaPress={() => onAddMediaPress(photoUploadDialogRef)}
          onAddDocPress={onAddDocPress}
          inReplyToItem={inReplyToItem}
          onReplyingToDismiss={onReplyingToDismiss}
          participants={channelItem?.participants}
          clearInput={isInputClear}
          setClearInput={setIsInputClear}
          onChatUserItemPress={onChatUserItemPress}
        />
      ) : (
        renderThreadItemActionSheet()
      )}
      <ActionSheet
        title={localized('Group Settings')}
        options={[
          localized('Rename Group'),
          localized('Leave Group'),
          localized('Cancel'),
        ]}
        cancelButtonIndex={2}
        destructiveButtonIndex={1}
      />
      <ActionSheet
        title={'Are you sure?'}
        options={['Confirm', 'Cancel']}
        cancelButtonIndex={1}
        destructiveButtonIndex={0}
      />
      <DialogInput
        isDialogVisible={isRenameDialogVisible}
        title={localized('Change Name')}
        hintInput={channel.name}
        textInputProps={{ selectTextOnFocus: true }}
        submitText={localized('OK')}
        submitInput={onChangeName}
        closeDialog={() => {
          showRenameDialog(false)
        }}
      />
      <ActionSheet
        ref={photoUploadDialogRef}
        title={localized('Photo Upload')}
        options={[
          localized('Launch Camera'),
          localized('Open Photo Gallery'),
          localized('Cancel'),
        ]}
        cancelButtonIndex={2}
        onPress={onPhotoUploadDialogDone}
      />
      <ActionSheet
        ref={groupSettingsActionSheetRef}
        title={localized('Group Settings')}
        options={[
          localized('View Members'),
          localized('Rename Group'),
          localized('Leave Group'),
          localized('Cancel'),
        ]}
        cancelButtonIndex={3}
        destructiveButtonIndex={2}
        onPress={onGroupSettingsActionDone}
      />
      <ActionSheet
        ref={adminGroupSettingsActionSheetRef}
        title={localized('Group Settings')}
        options={[
          localized('View Members'),
          localized('Rename Group'),
          localized('Leave Group'),
          localized('Delete Group'),
          localized('Cancel'),
        ]}
        cancelButtonIndex={4}
        destructiveButtonIndex={[2, 3]}
        onPress={onAdminGroupSettingsActionDone}
      />
      <ActionSheet
        ref={privateSettingsActionSheetRef}
        title={localized('Actions')}
        options={[
          localized('Block user'),
          localized('Report user'),
          localized('Cancel'),
        ]}
        cancelButtonIndex={2}
        onPress={onPrivateSettingsActionDone}
      />
      <TNMediaViewerModal
        mediaItems={mediaItemURLs}
        isModalOpen={isMediaViewerOpen}
        onClosed={onMediaClose}
        selectedMediaIndex={selectedMediaIndex}
      />
      {loading && <TNActivityIndicator />}
    </SafeAreaView>
  )
}

IMChat.propTypes = {
  onSendInput: PropTypes.func,
  onChangeName: PropTypes.func,
  onChangeTextInput: PropTypes.func,
  onLaunchCamera: PropTypes.func,
  onOpenPhotos: PropTypes.func,
  onAddMediaPress: PropTypes.func,
  user: PropTypes.object,
  uploadProgress: PropTypes.number,
  isMediaViewerOpen: PropTypes.bool,
  isRenameDialogVisible: PropTypes.bool,
  selectedMediaIndex: PropTypes.number,
  onChatMediaPress: PropTypes.func,
  onMediaClose: PropTypes.func,
  showRenameDialog: PropTypes.func,
  onLeave: PropTypes.func,
}

export default IMChat
