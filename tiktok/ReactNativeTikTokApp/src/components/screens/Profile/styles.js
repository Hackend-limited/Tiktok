import { StyleSheet } from 'react-native'

const imageWidth = 110

const dynamicStyles = (theme, appearance) => {
  return new StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors[appearance].primaryBackground,
    },
    scrollContainer: {
      marginBottom: 46,
    },
    headerContainer: {
      flex: 1,
      alignItems: 'center',
      alignSelf: 'center',
      paddingBottom: 38,
    },
    userImage: {
      alignSelf: 'center',
      marginTop: 15,
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: '#E5E5E5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    userFollowers: {
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '80%',
      alignSelf: 'center',
    },
    userImage: {
      width: imageWidth,
      height: imageWidth,
      borderRadius: Math.floor(imageWidth / 2),
      borderWidth: 0,
    },
    userImageContainer: {
      width: imageWidth,
      height: imageWidth,
      borderWidth: 0,
      margin: 18,
    },
    userImageMainContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    userName: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      color: theme.colors[appearance].primaryText,
      paddingTop: 0,
    },
    userFollowersText: {
      width: '30%',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.colors[appearance].primaryText,
    },
    userFollowersTextNumber: {
      color: '#010101',
      fontWeight: 'bold',
      textAlign: 'center',
      color: theme.colors[appearance].primaryText,
    },
    userFollowersTextDesc: {
      marginTop: 10,
      color: '#333',
      color: theme.colors[appearance].primaryText,
    },
    editProfile: {
      marginTop: 20,
      // width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonEditProfile: {
      width: 200,
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#333',
      padding: 15,
    },
    buttonEditProfileText: {
      color: '#333',
      color: theme.colors[appearance].primaryText,
    },
    videoContainer: {
      flex: 0.33,
      // width: 150,
      height: 200,
      margin: 2,
    },
    video: {
      height: '100%',
      width: '100%',
    },
    profileFeedContent: {},
    tabs: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#E5E5E5',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E5E5',
    },
    tab: {
      width: '33%',
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
}

export default dynamicStyles
