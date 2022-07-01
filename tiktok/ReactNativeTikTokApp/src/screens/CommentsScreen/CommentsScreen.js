import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslations } from 'dopenative'
import { Comments, CommentsHandle } from '../../components'
import { useCurrentUser } from '../../Core/onboarding'
import {
  useCommentMutations,
  useComments,
  usePost,
} from '../../Core/socialgraph/feed'

const CommentsScreen = props => {
  const { item, onDismiss, isVisible } = props

  const { localized } = useTranslations()

  const insets = useSafeAreaInsets()

  const [feedItem, setFeedItem] = useState(item)

  const scrollViewRef = useRef()
  const bottomSheetModalRef = useRef(null)

  const snapPoints = useMemo(() => ['30%', '60%'], [])

  const currentUser = useCurrentUser()
  const { remotePost, subscribeToPost } = usePost()
  const { addComment } = useCommentMutations()
  const { comments, commentsLoading, loadMoreComments, subscribeToComments } =
    useComments()

  const commentCountHeader = `${comments?.length} comment${
    comments?.length > 1 ? 's' : ''
  }`

  useEffect(() => {
    if (!item?.id) {
      return
    }
    const postUnsubscribe = subscribeToPost(item.id, currentUser?.id)
    const commentsUnsubscribe = subscribeToComments(item.id)
    return () => {
      postUnsubscribe && postUnsubscribe()
      commentsUnsubscribe && commentsUnsubscribe()
    }
  }, [item?.id, isVisible])

  useEffect(() => {
    if (isVisible) {
      bottomSheetModalRef.current?.present()
    } else {
      bottomSheetModalRef.current?.dismiss()
    }
  }, [isVisible])

  useEffect(() => {
    setFeedItem(remotePost || item)
  }, [remotePost])

  const onCommentSend = useCallback(
    async text => {
      await addComment(text, feedItem.id, currentUser.id)
    },
    [addComment, currentUser?.id, feedItem?.id],
  )

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={1}
      snapPoints={snapPoints}
      onDismiss={onDismiss}
      backdropComponent={props => <BottomSheetBackdrop {...props} />}
      handleComponent={() => (
        <CommentsHandle
          onDismiss={onDismiss}
          title={localized(commentCountHeader)}
        />
      )}>
      <Comments
        scrollViewRef={scrollViewRef}
        commentItems={comments}
        commentsLoading={commentsLoading}
        onCommentSend={onCommentSend}
        insets={insets}
      />
    </BottomSheetModal>
  )
}

export default CommentsScreen
