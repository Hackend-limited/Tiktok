import React from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useTheme } from 'dopenative'
import dynamicStyles from './styles'

export default function CommentsHandle(props) {
  const { onDismiss, title } = props

  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)

  return (
    <View style={styles.handleContainer}>
      <View style={styles.handleLeftContainer} />
      <View style={styles.handleTitleContainer}>
        <Text style={styles.handleTitle}>{title}</Text>
      </View>
      <View style={styles.handleRightContainer}>
        <TouchableOpacity onPress={onDismiss}>
          <Image style={styles.handleRightIcon} source={theme.icons.delete} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
