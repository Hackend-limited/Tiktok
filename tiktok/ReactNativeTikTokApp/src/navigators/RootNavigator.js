import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { LoadScreen, WalkthroughScreen } from '../Core/onboarding'
import MainStackNavigator from './MainStackNavigator'
import LoginStack from './AuthStackNavigator'

const Root = createStackNavigator()
const RootNavigator = () => {
  return (
    <Root.Navigator
      screenOptions={{ headerShown: false, animationEnabled: false }}
      initialRouteName="LoadScreen">
      <Root.Screen name="LoadScreen" component={LoadScreen} />
      <Root.Screen name="Walkthrough" component={WalkthroughScreen} />
      <Root.Screen name="LoginStack" component={LoginStack} />
      <Root.Screen name="MainStack" component={MainStackNavigator} />
    </Root.Navigator>
  )
}

export default RootNavigator
