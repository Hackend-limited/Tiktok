import React, { useState } from 'react'
import { View } from 'react-native'
import { useTheme } from 'dopenative'
import CustomTabItem from './CustomTabItem'
import dynamicStyles from './styles'

const photoModalTab = {
  name: 'Photo',
  key: 'Photo-6UB4BaeaA8m662ywhstar',
}

export default function BottomTabs({
  state,
  navigation,
  tabIcons,
  colorTitle,
  colorIcon,
}) {
  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)

  const [isTransparentTab, setIsTransparentTab] = useState(true)

  const customRoutes = [...state.routes]
  const indexToInsert = Math.floor(customRoutes.length / 2)
  customRoutes.splice(indexToInsert, 0, photoModalTab)

  const onAddPress = () => {
    navigation.navigate('Camera')
  }

  const onTabItemPress = routeName => {
    if (routeName?.toLowerCase() === 'feed') {
      setIsTransparentTab(true)
    } else {
      setIsTransparentTab(false)
    }
    navigation.navigate(routeName)
  }

  const getIsFocus = (stateIndex, currentTabIndex) => {
    if (stateIndex > indexToInsert) {
      const adjustedStateIndex = stateIndex + 1
      return adjustedStateIndex === currentTabIndex
    }
    return state.index === currentTabIndex
  }

  const renderTabItem = (route, index) => {
    return (
      <CustomTabItem
        key={index + ''}
        route={customRoutes[index]}
        tabIcons={tabIcons}
        focus={getIsFocus(state.index, index)}
        routeName={route.name}
        onPress={onTabItemPress}
        isAddPhoto={route.name?.toLowerCase() === 'photo'}
        colorTitle={colorTitle}
        isTransparentTab={isTransparentTab}
        onAddPress={onAddPress}
      />
    )
  }

  return (
    <View
      style={[
        styles.tabContainer,
        isTransparentTab && {
          backgroundColor: 'transparent',
        },
      ]}>
      {customRoutes.map(renderTabItem)}
    </View>
  )
}
