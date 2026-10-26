---
"live-mobile": minor
---

chore(rn-upgrade): bump react native cli to 20 (LIVE-39587)

Bump @react-native-community/cli, cli-platform-android and cli-platform-ios from 18.0.1 to 20.2.0. CLI 20 is the line used by the React Native 0.81 and 0.86 templates. Native autolinking output is unchanged. Remove the post-install step that deleted `react-native-tcp/ios/CocoaAsyncSocket`: the app uses `react-native-tcp-socket`, so the folder never exists.
