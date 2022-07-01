import React from 'react'
import PropTypes from 'prop-types'
import { Modal } from 'react-native'
import FullStories from '../FullStories/FullStories'
import styles from './styles'

export default class FullStoriesModal extends React.Component {
  render() {
    const { isModalOpen, onClosed } = this.props

    return (
      <Modal
        style={styles.container}
        visible={isModalOpen}
        onDismiss={onClosed}
        onRequestClose={onClosed}
        animationType={'slide'}>
        <FullStories />
      </Modal>
    )
  }
}

FullStoriesModal.propTypes = {
  isModalOpen: PropTypes.bool,
  onClosed: PropTypes.func,
}
