import RootNavigator from '../navigators/RootNavigator'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'

const AppContainer = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  )
}

export default AppContainer
