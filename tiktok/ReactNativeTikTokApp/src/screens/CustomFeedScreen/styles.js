import { StyleSheet } from 'react-native'

const navIconSize = 25

const styles = StyleSheet.create({
  doubleNavIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  navIcon: {
    width: navIconSize,
    height: navIconSize,
    margin: 6,
  },
  navIconMenuOptions: {
    flexDirection: 'row',
    width: null,
  },
})

export default styles
