import React, { useRef, useState, useEffect, useCallback } from 'react'
import { View } from 'react-native'
import { Video } from 'expo-av'
import { useTheme, useTranslations } from 'dopenative'
import TNActivityIndicator from '../../Core/truly-native/TNActivityIndicator'
import { IMRichTextInput, IMMentionList, EU } from '../../Core/mentions'
import { NavBar } from '../../components'
import dynamicStyles from './styles'
import { usePostMutations } from '../../Core/socialgraph/feed'
import { useSocialGraphFriends } from '../../Core/socialgraph/friendships'
import { useCurrentUser } from '../../Core/onboarding'

export default function NewPost(props) {
  const { route, navigation } = props
  const { params } = route
  const { media, song } = params

  const { localized } = useTranslations()
  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)

  const currentUser = useCurrentUser()

  const { addPost } = usePostMutations()
  const { friends } = useSocialGraphFriends(currentUser?.id)

  const [keyword, setKeyword] = useState('')
  const [isTrackingStarted, setIsTrackingStarted] = useState(false)
  const [friendshipData, setFriendshipData] = useState([])
  const [showUsersMention, setShowUsersMention] = useState(false)
  const [shouldPlayVideo, setShouldPlayVideo] = useState(true)
  const [loading, setLoading] = useState(false)

  const textInputRef = useRef()
  const editorRef = useRef()
  const newPost = useRef()

  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const formattedFriends = friends?.map(friend => {
      const name = `${friend.firstName} ${friend.lastName}`
      const username = `${friend.firstName}.${friend.lastName}`
      const id = friend.id || friend.userID

      return { id, name, username, ...friend }
    })
    setFriendshipData(formattedFriends)
  }, [friends])

  const onDismiss = () => {
    navigation.goBack()
  }

  const onPost = useCallback(async () => {
    console.log(media)
    setLoading(true)
    const tempPost = {
      ...newPost.current,
      authorID: currentUser.id,
      postMedia: media,
    }
    if (song) {
      tempPost.song = song
    }

    await addPost(tempPost, [media], currentUser)
    setLoading(false)
    navigation.goBack()
    // TODO: Handle errors
  }, [setLoading, addPost, navigation])

  const onChangeText = ({ displayText, text }) => {
    const mentions = EU.findMentions(text)
    newPost.current = {
      ...newPost.current,
      postText: text,
      displayText,
      commentCount: 0,
      reactionsCount: 0,
      reactions: {
        like: 0,
      },
      mentions,
    }
  }

  const onVideoLoad = () => {
    setShouldPlayVideo(false)
  }

  const editorStyles = {
    input: {
      color: theme.colors[appearance].primaryText,
    },
    mainContainer: {
      width: '100%',
    },
  }

  return (
    <View style={styles.container}>
      <NavBar
        headerTitle={localized('New post')}
        headerLeftTitle={localized('Cancel')}
        headerRightTitle={localized('Share')}
        onHeaderLeftPress={onDismiss}
        onHeaderRightPress={onPost}
      />
      <View style={[styles.captionAvatarContainer, styles.centerContainer]}>
        <View style={styles.avatarContainer}>
          <Video
            style={styles.avatar}
            source={{ uri: media?.uri }}
            shouldPlay={shouldPlayVideo}
            isMuted={true}
            resizeMode={'cover'}
            onLoad={onVideoLoad}
          />
        </View>
        <View style={styles.captionContainer}>
          <IMRichTextInput
            richTextInputRef={editorRef}
            inputRef={textInputRef}
            list={friendshipData}
            mentionListPosition={'bottom'}
            // initialValue={initialValue}
            // clearInput={this.state.clearInput}
            onChange={onChangeText}
            showEditor={true}
            toggleEditor={() => {}}
            editorStyles={editorStyles}
            showMentions={showUsersMention}
            onHideMentions={() => setShowUsersMention(false)}
            onUpdateSuggestions={setKeyword}
            onTrackingStateChange={setIsTrackingStarted}
          />
        </View>
        <IMMentionList
          containerStyle={styles.container}
          list={friendshipData}
          keyword={keyword}
          isTrackingStarted={isTrackingStarted}
          onSuggestionTap={editorRef.current?.onSuggestionTap}
        />
      </View>
      {loading && <TNActivityIndicator />}
    </View>
  )
}
