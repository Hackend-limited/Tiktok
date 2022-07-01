import { StyleSheet } from 'react-native'

const dynamicStyles = (theme, appearance) => {
  const avatarSize = 80

  return new StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors[appearance].primaryBackground,
    },
    centerContainer: {
      alignSelf: 'center',
      width: '90%',
    },
    captionAvatarContainer: {
      flexDirection: 'row',
      paddingVertical: 20,
    },
    avatarContainer: {
      flex: 2,
    },
    avatar: {
      width: avatarSize,
      height: avatarSize,
    },
    captionContainer: {
      flex: 6,
    },
    textInput: {
      color: theme.colors[appearance].primaryText,
      fontSize: 18,
      paddingTop: 10,
      textAlignVertical: 'top',
      height: avatarSize * 1.1,
    },

    locationContainer: {
      paddingVertical: 9,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors[appearance].hairline,
    },
    addLocationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addLocationContainerTitle: {
      flex: 6,
    },
    addLocationTitle: {
      fontSize: 17,
      paddingVertical: 8,
      color: theme.colors[appearance].primaryText,
    },
    locationTitle: {
      color: theme.colors[appearance].primaryText,
      fontSize: 17,
      paddingVertical: 3,
    },
    locationDetail: {
      color: theme.colors[appearance].secondaryText,
      fontSize: 17,
    },
    suggestedLoationTitle: {
      color: theme.colors[appearance].primaryText,
    },
    addLocationIconContainer: {
      flex: 1,
      alignItems: 'flex-end',
    },
    addLocationIcon: {
      width: 16,
      height: 16,
    },
    cancelIcon: {
      width: 9,
      height: 9,
    },

    suggestedLocationConatainer: {
      marginTop: 19,
      paddingLeft: 20,
    },
    suggestedLoationItemContainer: {
      backgroundColor: theme.colors[appearance].grey6,
      borderRadius: 7,
      padding: 8,
      marginRight: 10,
    },
    buttonText: {
      fontSize: 17,
      paddingHorizontal: 18,
      color: theme.colors[appearance].primaryText,
      fontWeight: '400',
    },
    blueText: {
      color: '#3d8fe1',
    },
  })
}

export default dynamicStyles
