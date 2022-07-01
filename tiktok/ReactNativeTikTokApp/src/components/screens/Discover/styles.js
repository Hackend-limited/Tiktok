import { StyleSheet } from 'react-native'

const dynamicStyles = (theme, appearance) => {
  return new StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors[appearance].primaryBackground,
    },
    scrollContainer: {
      paddingHorizontal: 15,
      marginBottom: 46,
    },
    categoryPrimary: {
      paddingVertical: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E5E5',
    },
    categoryMain: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 10,
    },
    categoryHashtagIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      height: 30,
      borderRadius: 15,
      borderColor: '#333',
      borderWidth: StyleSheet.hairlineWidth,
    },
    categoryDetail: {
      width: '50%',
    },
    categoryName: {
      fontWeight: 'bold',
      color: theme.colors[appearance].primaryText,
    },
    categoryDescription: {
      color: '#333',
    },
    categoryRightIcon: {
      width: '25%',
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    categoryVideo: {
      flex: 1,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    video: {
      width: 150,
      height: 200,
      marginHorizontal: 2,
    },
    icon: {
      width: 20,
      height: 20,
      tintColor: '#E5E5E5',
    },
  })
}

export default dynamicStyles
