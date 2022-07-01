import React, { useState, useEffect, useRef } from 'react'
import { Platform, View } from 'react-native'
import { Audio } from 'expo-av'
import { Camera } from 'expo-camera'
import { useTranslations } from 'dopenative'
import IMCameraModal from '../../Core/camera/IMCameraModal'
import { loadCachedItem } from '../../Core/helpers/cacheManager'
import { blendVideoWithAudio } from '../../Core/media/mediaProcessor'
import TNActivityIndicator from '../../Core/truly-native/TNActivityIndicator'
import { useConfig } from '../../config'

export default function (props) {
  const { localized } = useTranslations()

  const { navigation, route } = props
  const sound = route?.params?.sound

  const config = useConfig()

  const [soundTitle, setSoundTitle] = useState(localized('Sounds'))
  const [soundDuration, setSoundDuration] = useState(null)
  const [loading, setIsLoading] = useState(false)
  const [shouldMute, setShouldMute] = useState(false)
  const [mediaSource, setMediaSource] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)

  const soundRef = useRef(null)
  const soundPath = useRef(null)

  useEffect(() => {
    requestPermissions()
  }, [])

  useEffect(() => {
    if (sound) {
      onSoundChoose(sound)
    }
  }, [navigation, sound])

  const onSoundChoose = sound => {
    stopPlayback()
    if (sound) {
      setShouldMute(true)
      setSoundTitle(sound.title)
      setIsLoading(true)
      setSoundDuration(sound.duration)
      loadCachedAudio(sound.streamURL)
    }
  }

  const requestPermissions = async () => {
    await Audio.requestPermissionsAsync()
    const { status } = await Camera.requestPermissionsAsync()
    setHasPermission(status === 'granted')
  }

  const loadCachedAudio = async url => {
    const path = await loadCachedItem({ uri: url })
    soundPath.current = path
    setIsLoading(false)
    return loadAudio(path)
  }

  const loadAudio = async path => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: false,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    })
    soundRef.current = new Audio.Sound()

    try {
      await soundRef.current.loadAsync(
        {
          uri: path,
        },
        {
          isLooping: false,
          isMuted: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
      )
    } catch (error) {
      console.log(error)
      // An error occurred!
    }
  }

  const stopPlayback = async () => {
    if (soundRef.current !== null) {
      await soundRef.current.stopAsync()
      await soundRef.current.unloadAsync()
      soundRef.current = null
    }
  }

  const onStartRecordingVideo = async () => {
    if (soundRef.current === null) {
      return
    }
    setTimeout(() => {
      soundRef.current.playAsync()
    })
  }

  const stopSound = async () => {
    if (soundRef.current !== null) {
      soundRef.current.stopAsync()
    }
  }

  const onImagePost = fileInfo => {
    navigation.replace('NewPost', {
      media: mediaSource ?? fileInfo,
      song: sound,
    })
  }

  const onCameraClose = () => {
    stopPlayback()
    navigation.goBack()
  }

  const onCancelPost = () => {
    stopSound()
    setMediaSource(null)
  }

  const onSoundPress = () => {
    if (Platform.OS === 'ios') {
      navigation.push('SongPicker', { onSoundChoose: onSoundChoose })
    } else {
      navigation.replace('SongPicker')
    }
  }

  const onStopRecordingVideo = ({ uri, type }, videoRate) => {
    stopSound()
    setIsLoading(true)
    blendVideoWithAudio(
      { videoStream: uri, audioStream: soundPath.current, videoRate },
      newSource => {
        setMediaSource({ uri: newSource, mime: type, rate: 1.0 })
        setIsLoading(false)
      },
    )
  }

  if (!hasPermission) {
    return null
  }

  return (
    <View
      style={{
        flex: 1,
      }}>
      <IMCameraModal
        wrapInModal={false}
        useExternalSound={true}
        soundTitle={soundTitle}
        soundDuration={soundDuration}
        onCameraClose={onCameraClose}
        onCancelPost={onCancelPost}
        onImagePost={onImagePost}
        onSoundPress={onSoundPress}
        pickerMediaType={'Videos'}
        muteRecord={shouldMute}
        onStopRecordingVideo={onStopRecordingVideo}
        onStartRecordingVideo={onStartRecordingVideo}
        mediaSource={mediaSource}
        maxDuration={config.videoMaxDuration}
      />
      {loading && <TNActivityIndicator />}
    </View>
  )
}
