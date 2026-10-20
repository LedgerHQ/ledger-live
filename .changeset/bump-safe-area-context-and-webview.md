---
"live-mobile": minor
---

chore(rn-upgrade): bump safe-area and webview (LIVE-39588)

Bump react-native-safe-area-context to 5.7.0 and react-native-webview to 13.16.1. Both are the versions expected by Expo SDK 57 and work on React Native 0.81. Webview 13.16.1 fixes an iOS crash on nil strings in WebView events. The local webview patch (`allowsUnsecureHttps`, LIVE-38252) is unchanged.
