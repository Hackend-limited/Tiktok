import { StyleSheet, Dimensions, Platform } from 'react-native'
const width = Dimensions.get('window').width

const dynamicStyles = (theme, appearance) => {
  const colorSet = theme.colors[appearance]

  return StyleSheet.create({
    container: {
      width: '100%',
    },
    textContainer: {
      alignSelf: 'stretch',
      position: 'relative',
      minHeight: 40,
      maxHeight: 140,
    },
    input: {
      fontSize: 16,
      color: colorSet.primaryText,
      fontWeight: '400',
      paddingLeft: 20,
      paddingRight: 40,
      zIndex: Platform.OS === 'ios' ? 3 : undefined,
      width: '100%',
    },
    formmatedTextWrapper: {
      minHeight: 40,
      position: 'absolute',
      top: 0,
      paddingHorizontal: 20,
      paddingVertical: 5,
      width: '100%',
    },
    formmatedText: {
      fontSize: 16,
      fontWeight: '400',
    },
    mention: {
      fontSize: 16,
      fontWeight: '400',
      backgroundColor: 'rgba(36, 77, 201, 0.05)',
      color: '#244dc9',
    },
    placeholderText: {
      position: 'absolute',
      top: 3,
      color: 'rgba(0, 0, 0, 0.1)',
      fontSize: 16,
    },
  })
}

export const mentionStyle = {
  mention: {
    fontSize: 16,
    fontWeight: '400',
    backgroundColor: 'rgba(36, 77, 201, 0.05)',
    color: '#244dc9',
  },
}

export default dynamicStyles
