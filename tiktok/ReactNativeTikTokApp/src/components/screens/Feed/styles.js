import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#333',
  },
  playIconContainer: {
    zIndex: 999,
    opacity: 0.8,
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    bottom: '40%',
    left: '40%',
    right: '40%',
  },
  playIcon: {
    width: 100,
    height: 100,
    tintColor: '#E5E5E5',
  },
  newsByFollowing: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '5%',
    zIndex: 99,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  newsByFollowingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '300',
  },
  newsByFollowingTextBold: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#fff',
  },
  contentRightHeart: {
    marginTop: 10,
    marginBottom: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default styles
