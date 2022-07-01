import { StyleSheet } from 'react-native'
import { ifIphoneX } from 'react-native-iphone-x-helper'

const dynamicStyles = (theme, appearance) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors[appearance].primaryBackground,
    },
    searchBarContainer: {
      width: '100%',
      paddingVertical: 5,
      ...ifIphoneX(
        {
          marginTop: 45,
        },
        {
          marginTop: 12,
        },
      ),
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors[appearance].hairline,
    },
  })
}

export default dynamicStyles
