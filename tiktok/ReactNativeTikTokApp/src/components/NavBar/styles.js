import { Dimensions, StyleSheet } from 'react-native'
import { ifIphoneX } from 'react-native-iphone-x-helper'

const { width } = Dimensions.get('window')

const dynamicStyles = (theme, appearance) => {
  return new StyleSheet.create({
    container: {
      flexDirection: 'row',
      width,
      ...ifIphoneX(
        {
          height: 80,
        },
        {
          height: 55,
        },
      ),
      borderBottomColor: theme.colors[appearance].hairline,
      borderBottomWidth: 1,
      backgroundColor: theme.colors[appearance].primaryBackground,
    },
    textContainer: {
      justifyContent: 'flex-end',
      marginBottom: 7,
      alignItems: 'center',
    },
    text: {
      color: theme.colors[appearance].primaryText,
      fontSize: 16,
    },
    nextText: {
      paddingLeft: 15,
      fontWeight: '500',
    },
    leftContainer: {
      flex: 2,
    },
    titleContainer: {
      flex: 6,
    },
    rightContainer: {
      flex: 2,
    },
  })
}

export default dynamicStyles
