import React, { useLayoutEffect, useRef } from 'react'
import { View, SafeAreaView } from 'react-native'
import { useSelector } from 'react-redux'
import { useTheme, useTranslations } from 'dopenative'
import { IMChatHomeComponent } from '../../Core/chat'
import { TNTouchableIcon } from '../../Core/truly-native'
import { useCurrentUser } from '../../Core/onboarding'
import { useSocialGraphFriends } from '../../Core/socialgraph/friendships'

const ChatScreen = props => {
  const { navigation } = props

  const { localized } = useTranslations()
  const { theme, appearance } = useTheme()

  const searchBarRef = useRef()

  const currentUser = useCurrentUser()
  const { friends } = useSocialGraphFriends(currentUser?.id)
  const audioVideoChatConfig = useSelector(state => state.audioVideoChat)

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: localized('Conversations'),
      headerRight: () => (
        <TNTouchableIcon
          imageStyle={{ tintColor: theme.colors[appearance].primaryText }}
          iconSource={theme.icons.inscription}
          onPress={() => navigation.navigate('CreateGroup')}
        />
      ),
      headerStyle: {
        backgroundColor: theme.colors[appearance].primaryBackground,
      },
      headerTintColor: theme.colors[appearance].primaryText,
    })
  }, [])

  const onFriendItemPress = friend => {
    const id1 = currentUser.id || currentUser.userID
    const id2 = friend.id || friend.userID
    if (id1 == id2) {
      return
    }
    const channel = {
      id: id1 < id2 ? id1 + id2 : id2 + id1,
      participants: [friend],
    }
    navigation.navigate('PersonalChat', { channel })
  }

  const onSearchButtonPress = async () => {
    navigation.navigate('UserSearchScreen', { followEnabled: true })
  }

  const onEmptyStatePress = () => {
    onSearchButtonPress()
  }

  const defaultEmptyStateConfig = {
    title: localized('No Conversations'),
    description: localized(
      'Add some friends and start chatting with them. Your conversations will show up here.',
    ),
    buttonName: localized('Search for people'),
    onPress: onEmptyStatePress,
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, marginBottom: 46 }}>
        <IMChatHomeComponent
          loading={friends === null}
          searchBarRef={searchBarRef}
          searchBarplaceholderTitle={localized('Search for people')}
          emptyStateConfig={defaultEmptyStateConfig}
          friends={friends}
          onFriendItemPress={onFriendItemPress}
          onSearchBarPress={onSearchButtonPress}
          navigation={navigation}
          onEmptyStatePress={onEmptyStatePress}
          audioVideoChatConfig={audioVideoChatConfig}
        />
      </View>
    </SafeAreaView>
  )
}

export default ChatScreen
