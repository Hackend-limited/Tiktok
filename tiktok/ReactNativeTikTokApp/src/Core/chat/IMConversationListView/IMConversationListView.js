import React, { memo, useCallback, useEffect } from 'react'
import IMConversationList from '../IMConversationList'
import { useChatChannels } from '../api'
import { useCurrentUser } from '../../onboarding'

const IMConversationListView = props => {
  const {
    navigation,
    headerComponent,
    emptyStateConfig,
    onRefreshHeader,
    isChatUserItemPress,
  } = props
  const currentUser = useCurrentUser()

  const {
    channels,
    refreshing,
    subscribeToChannels,
    loadMoreChannels,
    pullToRefresh,
  } = useChatChannels()

  useEffect(() => {
    const unsubscribe = subscribeToChannels(currentUser?.id)
    return () => {
      unsubscribe && unsubscribe()
    }
  }, [currentUser?.id])

  const onConversationPress = useCallback(
    channel => {
      navigation.navigate('PersonalChat', {
        channel: { ...channel, name: channel.title },
        isChatUserItemPress,
      })
    },
    [navigation],
  )

  const onListEndReached = useCallback(() => {
    loadMoreChannels(currentUser?.id)
  }, [loadMoreChannels])

  const onPullToRefresh = useCallback(() => {
    pullToRefresh(currentUser?.id)
    onRefreshHeader?.(currentUser?.id)
  }, [pullToRefresh, onRefreshHeader])

  const pullToRefreshConfig = { refreshing, onRefresh: onPullToRefresh }

  return (
    <IMConversationList
      loading={channels == null}
      conversations={channels}
      onConversationPress={onConversationPress}
      emptyStateConfig={emptyStateConfig}
      user={currentUser}
      headerComponent={headerComponent}
      onListEndReached={onListEndReached}
      pullToRefreshConfig={pullToRefreshConfig}
    />
  )
}

export default memo(IMConversationListView)
