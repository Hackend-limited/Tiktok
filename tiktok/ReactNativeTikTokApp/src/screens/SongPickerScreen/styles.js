import { StyleSheet } from 'react-native'

const dynamicStyles = (theme, appearance) => {
  return new StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors[appearance].primaryBackground,
    },
    listContainer: {
      width: '90%',
      height: 300,
      alignSelf: 'center',
      paddingTop: 10,
    },
    itemContainer: {
      height: 80,
      flexDirection: 'row',
      alignItems: 'center',
      // backgroundColor: 'pink',
    },
    itemImageContainer: {
      flex: 1.4,
    },
    itemImage: {
      width: 65,
      height: 65,
      borderRadius: 4,
    },
    itemDecriptionContainer: {
      flex: 5,
    },
    itemTitle: {
      paddingLeft: 10,
      color: theme.colors[appearance].primaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    itemArtiste: {
      paddingLeft: 10,
      fontSize: 12,
      color: theme.colors[appearance].secondaryText,
      paddingTop: 4,
    },
    itemDuration: {
      paddingLeft: 10,
      fontSize: 12,
      color: theme.colors[appearance].secondaryText,
      paddingTop: 4,
    },
    selectIconContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectIcon: {
      width: 35,
      height: 35,
    },
  })
}

export default dynamicStyles
