import React, { useEffect } from 'react'
import { LogBox } from 'react-native'
import { Provider } from 'react-redux'
import { MenuProvider } from 'react-native-popup-menu'
import { extendTheme, DNProvider, TranslationProvider } from 'dopenative'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import configureStore from './redux/store'
import translations from './translations/'
import { ConfigProvider } from './config'
import { AuthProvider } from './Core/onboarding/hooks/useAuth'
import { ProfileAuthProvider } from './Core/profile/hooks/useProfileAuth'
import { authManager } from './Core/onboarding/api'
import AppContent from './AppContent'

import InstamobileTheme from './theme'

const store = configureStore()

const App = () => {
  const theme = extendTheme(InstamobileTheme)

  useEffect(() => {
    LogBox.ignoreAllLogs(true)
  }, [])

  return (
    <Provider store={store}>
      <TranslationProvider translations={translations}>
        <DNProvider theme={theme}>
          <ConfigProvider>
            <AuthProvider authManager={authManager}>
              <ProfileAuthProvider authManager={authManager}>
                <MenuProvider>
                  <BottomSheetModalProvider>
                    <AppContent />
                  </BottomSheetModalProvider>
                </MenuProvider>
              </ProfileAuthProvider>
            </AuthProvider>
          </ConfigProvider>
        </DNProvider>
      </TranslationProvider>
    </Provider>
  )
}

export default App
