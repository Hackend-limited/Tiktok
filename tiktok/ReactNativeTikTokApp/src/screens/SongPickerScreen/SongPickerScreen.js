import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { useTheme } from 'dopenative'
import { Audio } from 'expo-av'
import { NavBar } from '../../components'
import { songsAPIManager } from './api'
import { loadCachedItem } from '../../Core/helpers/cacheManager'
import dynamicStyles from './styles'

export default function ComposerSongs(props) {
  const { navigation, route } = props
  const onSoundChoose = route?.params?.onSoundChoose

  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)

  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [songLoading, setSongLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  const soundRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    loadSongs()
  }, [])

  const loadCachedAudio = async url => {
    stopPlayback()
    setSongLoading(true)
    const path = await loadCachedItem({ uri: url })
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
        },
      )
      soundRef.current.playAsync()
      setSongLoading(false)
    } catch (error) {
      console.log(error)
      // An error occurred!
    }
  }

  const stopPlayback = async () => {
    if (soundRef.current !== null) {
      await soundRef.current.stopAsync()
      await soundRef.current.unloadAsync()
    }
  }

  const loadSongs = async () => {
    const songs = await songsAPIManager.fetchSongs()
    if (songs) {
      setSongs(songs)
    }
    setLoading(false)
  }

  const onDismiss = () => {
    stopPlayback()
    if (Platform.OS === 'ios') {
      onSoundChoose(null)
      navigation.goBack()
    } else {
      navigation.replace('Camera', { sound: null })
    }
  }

  const onSave = () => {
    stopPlayback()
    if (Platform.OS === 'ios') {
      onSoundChoose(selectedItem)
      navigation.goBack()
    } else {
      navigation.replace('Camera', { sound: selectedItem })
    }
  }

  const onItemPress = (item, index) => {
    setSelectedIndex(index)
    setSelectedItem(item)
    loadCachedAudio(item.streamURL)
  }

  const renderItem = ({ item, index }) => {
    const isSelected = selectedIndex === index
    return (
      <TouchableOpacity
        key={index?.toString()}
        onPress={() => onItemPress(item, index)}
        style={styles.itemContainer}>
        <View style={styles.itemImageContainer}>
          <Image
            style={styles.itemImage}
            source={{
              uri: item.coverURL,
            }}
          />
        </View>
        <View style={styles.itemDecriptionContainer}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemArtiste}>{item.artist}</Text>
          <Text style={styles.itemDuration}>{item.duration}</Text>
        </View>
        <View style={styles.selectIconContainer}>
          {isSelected && !songLoading && (
            <Image style={styles.selectIcon} source={theme.icons.checkedRed} />
          )}
          {isSelected && songLoading && <ActivityIndicator />}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <NavBar
        headerTitle={'Sounds'}
        headerLeftTitle={'Cancel'}
        headerRightTitle={'Save'}
        onHeaderLeftPress={onDismiss}
        onHeaderRightPress={onSave}
      />
      {loading && <ActivityIndicator />}
      <FlatList
        style={styles.listContainer}
        keyExtractor={(item, index) => item.id ?? index?.toString()}
        data={!loading && songs}
        renderItem={renderItem}
      />
    </View>
  )
}
