import React, { useRef, useLayoutEffect } from 'react'
import {
  View,
  TouchableOpacity,
  Text,
  SafeAreaView,
  FlatList,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import ActionSheet from 'react-native-actionsheet'
import ImagePicker from 'react-native-image-crop-picker'
import { useTheme, useTranslations } from 'dopenative'
import dynamicStyles from './styles'
import { TNStoryItem } from '../../../Core/truly-native'
import TNVideo from '../../../Core/truly-native/TNVideo/TNVideo'

export default function Profile(props) {
  const { localized } = useTranslations()
  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)

  const {
    profilePosts,
    isOtherUser,
    hasBottomTab,
    user,
    followingCount,
    followersCount,
    reactionsCount,
    mainButtonTitle,
    onMainButtonPress,
    onFollowingButtonPress,
    onFollowersButtonPress,
    startUpload,
    removePhoto,
    onFeedItemPress,
    pullToRefreshConfig,
  } = props

  const { onRefresh, refreshing } = pullToRefreshConfig

  const navigation = useNavigation()

  const updatePhotoDialogActionSheet = useRef()
  const photoUploadDialogActionSheet = useRef()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme.colors[appearance].primaryBackground,
      },
      headerTintColor: theme.colors[appearance].primaryText,
    })
  }, [navigation, appearance])

  const onProfilePicturePress = () => {
    if (isOtherUser) {
      return
    }
    updatePhotoDialogActionSheet.current.show()
  }

  const onUpdatePhotoDialogDone = index => {
    if (index === 0) {
      photoUploadDialogActionSheet.current.show()
    }

    if (index === 1) {
      removePhoto()
    }
  }

  const onPhotoUploadDialogDone = index => {
    if (index === 0) {
      onLaunchCamera()
    }

    if (index === 1) {
      onOpenPhotos()
    }
  }

  const onLaunchCamera = () => {
    ImagePicker.openCamera({
      cropping: false,
    }).then(image => {
      startUpload(image)
    })
  }

  const onOpenPhotos = () => {
    ImagePicker.openPicker({
      cropping: false,
    }).then(image => {
      startUpload(image)
    })
  }

  const firstname = user?.firstName ?? ''
  const lastname = user?.lastName ?? ''

  const username = user?.username
    ? `@${user?.username}`
    : `@${firstname?.toLowerCase()}${lastname?.toLowerCase()}`

  const renderListHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <TNStoryItem
          item={user}
          imageStyle={styles.userImage}
          imageContainerStyle={styles.userImageContainer}
          containerStyle={styles.userImageMainContainer}
          activeOpacity={1}
          onPress={onProfilePicturePress}
        />
        <Text style={styles.userName}>{username}</Text>
        <View style={styles.userFollowers}>
          <TouchableOpacity
            onPress={onFollowingButtonPress}
            style={styles.userFollowersText}>
            <Text style={styles.userFollowersTextNumber}>{followingCount}</Text>
            <Text style={styles.userFollowersTextDesc}>
              {localized('Following')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onFollowersButtonPress}
            style={styles.userFollowersText}>
            <Text style={styles.userFollowersTextNumber}>{followersCount}</Text>
            <Text style={styles.userFollowersTextDesc}>
              {localized('Followers')}
            </Text>
          </TouchableOpacity>
          <View style={styles.userFollowersText}>
            <Text style={styles.userFollowersTextNumber}>{reactionsCount}</Text>
            <Text style={styles.userFollowersTextDesc}>
              {localized('Likes')}
            </Text>
          </View>
        </View>
        <View style={styles.editProfile}>
          <TouchableOpacity
            onPress={onMainButtonPress}
            style={styles.buttonEditProfile}>
            <Text style={styles.buttonEditProfileText}>{mainButtonTitle}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderItem = ({ item, index }) => {
    if (item?.postMedia?.length < 1) {
      return null
    }
    const videoURL = item?.postMedia[0].url
    if (!videoURL) {
      return null
    }

    return (
      <TouchableOpacity
        key={index + ''}
        onPress={() => onFeedItemPress(index)}
        style={styles.videoContainer}>
        <TNVideo
          style={styles.video}
          rate={1.0}
          volume={1.0}
          shouldPlay={false}
          useNativeControls={false}
          source={{ uri: item?.postMedia[0].url }}
          resizeMode={'cover'}
        />
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={profilePosts}
        style={hasBottomTab ? styles.scrollContainer : styles.container}
        keyExtractor={(item, index) => item.id ?? index?.toString()}
        ListHeaderComponent={renderListHeader}
        numColumns={3}
        renderItem={renderItem}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      <ActionSheet
        ref={updatePhotoDialogActionSheet}
        title={localized('Profile Picture')}
        options={[
          localized('Change Photo'),
          localized('Remove'),
          localized('Cancel'),
        ]}
        cancelButtonIndex={2}
        destructiveButtonIndex={1}
        onPress={onUpdatePhotoDialogDone}
      />
      <ActionSheet
        ref={photoUploadDialogActionSheet}
        title={localized('Select Photo')}
        options={[
          localized('Camera'),
          localized('Library'),
          localized('Cancel'),
        ]}
        cancelButtonIndex={2}
        onPress={onPhotoUploadDialogDone}
      />
    </SafeAreaView>
  )
}
