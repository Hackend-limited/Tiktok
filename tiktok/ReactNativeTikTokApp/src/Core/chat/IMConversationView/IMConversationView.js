import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useTheme, useTranslations } from 'dopenative'
import PropTypes from 'prop-types'
import IMConversationIconView from './IMConversationIconView/IMConversationIconView'
import { timeFormat } from '../../helpers/timeFormat'
import dynamicStyles from './styles'
import { formatMessage } from '../helpers/utils'
import { IMRichTextView } from '../../mentions'

function IMConversationView(props) {
  const { onChatItemPress, item, user } = props

  const { localized } = useTranslations()
  const { theme, appearance } = useTheme()
  const styles = dynamicStyles(theme, appearance)

  const userID = user.userID || user.id

  let title = item.title

  const getIsRead = () => {
    return item.markedAsRead
  }

  return (
    <TouchableOpacity
      onPress={() => onChatItemPress(item)}
      style={styles.chatItemContainer}>
      <IMConversationIconView
        participants={
          item?.admins?.length
            ? item.participants
            : item.participants.filter(value => {
                return value?.id !== userID
              })
        }
      />
      <View style={styles.chatItemContent}>
        <Text
          style={[styles.chatFriendName, !getIsRead() && styles.unReadmessage]}>
          {title}
        </Text>
        <View style={styles.content}>
          <Text
            numberOfLines={1}
            ellipsizeMode={'middle'}
            style={[styles.message, !getIsRead() && styles.unReadmessage]}>
            <IMRichTextView
              emailStyle={[
                styles.message,
                !getIsRead() && styles.unReadmessage,
              ]}
              phoneStyle={[
                styles.message,
                !getIsRead() && styles.unReadmessage,
              ]}
              hashTagStyle={[
                styles.message,
                !getIsRead() && styles.unReadmessage,
              ]}
              usernameStyle={[
                styles.message,
                !getIsRead() && styles.unReadmessage,
              ]}>
              {formatMessage(item?.content, localized) || ' '}
            </IMRichTextView>
              {' • '}
            <Text
              numberOfLines={1}
              ellipsizeMode={'middle'}
              style={[styles.message, !getIsRead() && styles.unReadmessage]}>
              {timeFormat(item.updatedAt || item.createdAt)}
            </Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

IMConversationView.propTypes = {
  item: PropTypes.object,
  onChatItemPress: PropTypes.func,
}

export default IMConversationView
