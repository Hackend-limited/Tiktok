import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { useTranslations } from 'dopenative'
import {
  FeedScreen,
  DiscoverScreen,
  ProfileScreen,
  ChatScreen,
} from '../screens'
import { IMChatScreen, IMCreateGroupScreen, IMViewGroupMembersScreen } from '../Core/chat'
import {
  IMFriendsScreen,
  IMUserSearchModal,
} from '../Core/socialgraph/friendships'
import { Platform } from 'react-native'

const InnerStack = createStackNavigator()
const InnerFeedNavigator = () => {
  return (
    <InnerStack.Navigator initialRouteName="Feed">
      <InnerStack.Screen
        name="Feed"
        options={{ headerShown: false }}
        component={FeedScreen}
      />
    </InnerStack.Navigator>
  )
}

const ChatSearch = createStackNavigator()
const InnerChatSearchNavigator = () => {
  return (
    <ChatSearch.Navigator
      initialRouteName="Main"
      screenOptions={{ headerMode: 'float', presentation: 'modal' }}>
      <ChatSearch.Screen
        name="Main"
        component={InnerChatNavigator}
        options={{ headerShown: false }}
      />
      <ChatSearch.Screen
        name="UserSearchScreen"
        component={IMUserSearchModal}
        options={{ headerShown: false }}
      />
    </ChatSearch.Navigator>
  )
}

const InnerChat = createStackNavigator()
const InnerChatNavigator = () => {
  return (
    <InnerChat.Navigator initialRouteName="Chat" headerMode="float">
      <InnerChat.Screen name="Chat" component={ChatScreen} />
      <InnerChat.Screen name="CreateGroup" component={IMCreateGroupScreen} />
      <InnerChat.Screen
        name="ViewGroupMembers"
        component={IMViewGroupMembersScreen}
      />
      <InnerChat.Screen name="PersonalChat" component={IMChatScreen} />
    </InnerChat.Navigator>
  )
}

const FriendsSearch = createStackNavigator()
const InnerFriendsSearchNavigator = () => {
  return (
    <FriendsSearch.Navigator
      initialRouteName="Friends"
      screenOptions={{ headerMode: 'float', presentation: 'modal' }}>
      <FriendsSearch.Screen
        name="Friends"
        component={InnerFriendsNavigator}
        options={{ headerBackTitle: '' }}
      />
      <FriendsSearch.Screen
        name="UserSearchScreen"
        component={IMUserSearchModal}
        options={{ headerShown: false }}
      />
    </FriendsSearch.Navigator>
  )
}

const InnerFriends = createStackNavigator()
const InnerFriendsNavigator = () => {
  const { localized } = useTranslations()
  return (
    <InnerFriends.Navigator headerMode="float" initialRouteName="Friends">
      <InnerFriends.Screen
        initialParams={{
          followEnabled: false,
          friendsScreenTitle: localized('Friends'),
          showDrawerMenuButton: Platform.OS == 'android',
        }}
        options={{ headerShown: false }}
        name="Friends"
        component={IMFriendsScreen}
      />
    </InnerFriends.Navigator>
  )
}

const InnerDiscover = createStackNavigator()
const InnerDiscoverNavigator = () => {
  return (
    <InnerDiscover.Navigator initialRouteName="Discover" headerMode="float">
      <InnerDiscover.Screen name="Discover" component={DiscoverScreen} />
    </InnerDiscover.Navigator>
  )
}

const InnerProfile = createStackNavigator()
const InnerProfileNavigator = () => {
  return (
    <InnerProfile.Navigator initialRouteName="Profile" headerMode="float">
      <InnerProfile.Screen
        name="Profile"
        initialParams={{
          hasBottomTab: true,
        }}
        component={ProfileScreen}
      />
    </InnerProfile.Navigator>
  )
}

export {
  InnerFeedNavigator,
  InnerChatSearchNavigator,
  InnerFriendsSearchNavigator,
  InnerDiscoverNavigator,
  InnerProfileNavigator,
}
