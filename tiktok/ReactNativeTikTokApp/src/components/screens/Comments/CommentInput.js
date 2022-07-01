import React, { useState, useRef } from 'react'
import { TouchableOpacity, Image, View, TextInput } from 'react-native'
import { useTheme, useTranslations } from 'dopenative'
import PropTypes from 'prop-types'
import dynamicStyles from './styles'

function CommentInput(props) {
  const { onCommentSend } = props

  const { localized } = useTranslations()
  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)

  const [value, setValue] = useState('')
  const textInputRef = useRef(null)

  const onChangeText = value => {
    setValue(value)
  }

  const onSendComment = () => {
    onCommentSend(value)
    setValue('')
    textInputRef.current?.blur()
  }

  const isDisabled = () => {
    if (/\S/.test(value)) {
      return false
    } else {
      return true
    }
  }

  return (
    <View style={styles.commentInputContainer}>
      <View style={styles.commentTextInputContainer}>
        <TextInput
          ref={textInputRef}
          underlineColorAndroid="transparent"
          placeholder={localized('Add a comment to this video')}
          placeholderTextColor={theme.colors[appearance].secondaryText}
          value={value}
          onChangeText={onChangeText}
          style={styles.commentTextInput}
        />
      </View>
      <TouchableOpacity
        onPress={onSendComment}
        disabled={isDisabled()}
        style={styles.commentInputIconContainer}>
        <Image
          style={[
            styles.commentInputIcon,
            isDisabled() ? { opacity: 0.3 } : { opacity: 1 },
          ]}
          source={theme.icons.send}
        />
      </TouchableOpacity>
    </View>
  )
}

CommentInput.propTypes = {
  item: PropTypes.object,
}

export default CommentInput
