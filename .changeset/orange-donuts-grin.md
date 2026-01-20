---
"live-mobile": minor
"@ledgerhq/native-ui": minor
---

upgrade react-native-reanimated from v3 to v4

- Add new required dependency `react-native-worklets` (0.7.2)
- Migrate babel plugin from `react-native-reanimated/plugin` to `react-native-worklets/plugin`
- Migrate `runOnJS` API to `scheduleOnRN` from `react-native-worklets`
- Add missing dependency arrays to `useAnimatedStyle` hooks (required for Reanimated 4 without Babel plugin)
- Update test mocks for compatibility with Reanimated 4
