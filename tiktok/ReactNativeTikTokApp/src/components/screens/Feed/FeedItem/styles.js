import { StyleSheet, Dimensions } from 'react-native'

const styles = StyleSheet.create({
  videoContent: {
    ...StyleSheet.absoluteFill,
    // height: Dimensions.get('window').height,
    backgroundColor: '#010101',
  },

  contentRight: {
    position: 'absolute',
    padding: 10,
    right: 5,
    top: '40%',
    // bottom: '20%',
    height: 350,
    zIndex: 99,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    justifyContent: 'space-around',
  },
  contentRightUser: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRightUserImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#555',
    overflow: 'hidden',
  },
  contentRightUserImage: {
    width: 40,
    height: 40,
    borderRadius: 25,
    overflow: 'hidden',
  },
  contentRightUserPlus: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: '#f00',
  },
  plusIcon: {
    width: 12,
    height: 12,
    tintColor: '#fff',
  },
  iconRight: {
    width: 33,
    height: 33,
    tintColor: '#fff',
    opacity: 0.7,
  },
  iconLike: {
    opacity: 1,
    tintColor: '#df4a59',
  },
  iconRightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRightText: {
    marginTop: 4,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentLeftBottom: {
    position: 'absolute',
    padding: 10,
    left: 5,
    bottom: '10%',
    zIndex: 99,
    width: '75%',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  contentLeftBottomNameUserText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentLeftBottomDescription: {
    marginTop: 10,
    color: '#fff',
  },
  username: {
    color: '#fff',
    opacity: 0.7,
  },
  hashTag: {
    color: '#fff',
    opacity: 0.7,
  },
  contentLeftBottomMusicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  contentLeftBottomMusic: {
    color: '#fff',
    overflow: 'scroll',
    paddingLeft: 7,
  },
  musicIcon: {
    height: 20,
    width: 20,
    tintColor: '#fff',
  },
})

export default styles
