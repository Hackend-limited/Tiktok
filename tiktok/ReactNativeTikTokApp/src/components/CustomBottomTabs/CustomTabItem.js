import React from 'react'
import { TouchableOpacity, Image, Text, View } from 'react-native'
import { useTheme } from 'dopenative'
import dynamicStyles from './styles'

function TabItem({
  route,
  onPress,
  focus,
  tabIcons,
  routeName,
  isAddPhoto,
  isTransparentTab,
  onAddPress,
}) {
  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)

  const onTabPress = () => {
    onPress(routeName)
  }

  if (isAddPhoto) {
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={onAddPress} style={[styles.addContainer]}>
          <Image style={[styles.addIcon]} source={theme.icons.add} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={onTabPress}>
      <Image
        style={[
          styles.icon,
          focus ? styles.focusTintColor : styles.unFocusTintColor,
          isTransparentTab && { tintColor: '#f5f5f5' },
        ]}
        source={
          focus ? tabIcons[route.name].focus : tabIcons[route.name].unFocus
        }
      />
      <Text
        style={[
          styles.title,
          isTransparentTab && { color: '#f5f5f5' },
          // (isTransparentTab || focus) && { color: '#f5f5f5' },
        ]}>
        {routeName}
      </Text>
    </TouchableOpacity>
  )
}

export default TabItem
