import React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from 'dopenative'
import FastImage from 'react-native-fast-image'
import PropTypes from 'prop-types'
import dynamicStyles from './styles'

function CommentItem(props) {
  const { item } = props
  const { author } = item
  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)

  return (
    <View style={styles.commentItemContainer}>
      <View style={styles.commentItemImageContainer}>
        <FastImage
          style={styles.commentItemImage}
          source={{
            uri: author?.profilePictureURL,
          }}
        />
      </View>
      <View style={styles.commentItemBodyContainer}>
        <View style={styles.commentItemBodyRadiusContainer}>
          <Text style={styles.commentItemBodyTitle}>
            {author.username?.length > 0 ? author.username : author.firstName}
          </Text>
          <Text style={styles.commentItemBodySubtitle}>{item.commentText}</Text>
        </View>
      </View>
    </View>
  )
}

CommentItem.propTypes = {
  item: PropTypes.object,
}

export default CommentItem
