import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import BottomTabNavigator from './BottomTabNavigator'
import { useTranslations } from 'dopenative'
import {
  IMEditProfileScreen,
  IMUserSettingsScreen,
  IMContactUsScreen,
  IMProfileSettingsScreen,
  IMBlockedUsersScreen,
} from '../Core/profile'
import { IMAllFriendsScreen } from '../Core/socialgraph/friendships'
// import {IMNotificationScreen} from '../Core/notifications';
import {
  CustomFeedScreen,
  CommentsScreen,
  ProfileScreen,
  FeedScreen,
  FeedSearchScreen,
  CameraScreen,
  NewPostScreen,
  SongPickerScreen,
} from '../screens'
// import { Camera, NewPost, ComposerSongs } from '../components';
import { InnerFriendsSearchNavigator } from './InnerStackNavigators'
import useNotificationOpenedApp from '../Core/helpers/notificationOpenedApp'

const cardStyleInterpolator = ({ current, layouts }) => {
  return {
    cardStyle: {
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.height, 0],
          }),
        },
      ],
    },
  }
}

const MainStack = createStackNavigator()
const MainStackNavigator = () => {
  useNotificationOpenedApp()
  const { localized } = useTranslations()
  return (
    <MainStack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        headerBackTitle: localized('Back'),
      }}
      initialRouteName="NavStack">
      <MainStack.Screen
        name="NavStack"
        options={{ headerShown: false }}
        component={BottomTabNavigator}
      />
      <MainStack.Screen
        options={{
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#fff',
        }}
        name="DiscoverFeed"
        component={FeedScreen}
      />
      <MainStack.Screen
        options={{
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#fff',
        }}
        name="CustomFeedScreen"
        component={CustomFeedScreen}
      />
      <MainStack.Screen name="Comments" component={CommentsScreen} />
      <MainStack.Screen
        name="FeedSearch"
        component={FeedSearchScreen}
        options={{
          headerTitle: localized('Hashtags'),
        }}
      />
      <MainStack.Screen
        options={{
          headerTitle: null,
        }}
        name="Profile"
        component={ProfileScreen}
      />
      <MainStack.Screen
        name="ProfileEditProfile"
        component={IMEditProfileScreen}
      />
      <MainStack.Screen
        name="ProfileAppSettings"
        component={IMUserSettingsScreen}
      />
      <MainStack.Screen
        name="ProfileSettings"
        component={IMProfileSettingsScreen}
      />
      <MainStack.Screen
        name="ProfileBlockedSettings"
        component={IMBlockedUsersScreen}
      />
      <MainStack.Screen name="ProfileContactUs" component={IMContactUsScreen} />
      <MainStack.Screen name="AllFriends" component={IMAllFriendsScreen} />
      <MainStack.Screen
        name="Friends"
        options={{ headerShown: false }}
        component={InnerFriendsSearchNavigator}
      />
      <MainStack.Screen
        name="Camera"
        options={{
          headerShown: false,
          cardStyleInterpolator,
          gestureDirection: 'vertical',
        }}
        component={CameraScreen}
      />
      <MainStack.Screen
        name="SongPicker"
        options={{
          headerShown: false,
          title: 'Sounds',
          cardStyleInterpolator,
          gestureDirection: 'vertical',
        }}
        component={SongPickerScreen}
      />
      <MainStack.Screen
        name="NewPost"
        options={{
          headerShown: false,
          cardStyleInterpolator,
          gestureDirection: 'vertical',
        }}
        component={NewPostScreen}
      />
      {/*
      <MainStack.Screen name="Notification" component={IMNotificationScreen} />
      <MainStack.Screen name="ContactUs" component={IMContactUsScreen} />
      */}
    </MainStack.Navigator>
  )
}

export default MainStackNavigator
