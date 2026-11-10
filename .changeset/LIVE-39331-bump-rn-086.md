---
"live-mobile": minor
"ledger-live-desktop": minor
"@shared/system-bars": minor
"@features/flow-device-mock-server": minor
"@features/flow-pay-card-auth": minor
---

chore(rn-upgrade): bump react native to 0.86.3 and expo to sdk 57 (LIVE-39331)

Bump react-native 0.81.6 to 0.86.3, Expo SDK 54 to 57 and React 19.1.4 to 19.2.3, with reanimated 4.5.1, worklets 0.10.1, gesture-handler 2.32.0, screens 4.26.2 and React Navigation 7.5.0. Migrate the Android and iOS native projects, the JS tooling and the Jest preset. Opt out of `expo/fetch` so the app keeps the React Native `fetch`. Repaint the Android navigation bar when the activity resumes. Rebase the react-native patch on 0.86.3, drop the worklets patch and add an expo patch for the SDK 57 type errors. Patch bottom-sheet 5.2.7 to use `StyleSheet.absoluteFill`, because React Native 0.86 removes `absoluteFillObject` and sheets would open below the screen (LIVE-41010).
