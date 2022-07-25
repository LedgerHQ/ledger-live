---
"live-mobile": patch
---

- Upgraded `react-native` to `0.68.2`, following [this guide](https://react-native-community.github.io/upgrade-helper/?from=0.67.3&to=0.68.2) and picked what works for us:
  - we don't upgrade Flipper as it crashes on runtime
  - we don't upgrade gradle as it builds fine like this and v7 didn't work out of the box
  - we don't keep `react-native-gradle-plugin` as it's only necessary for the new architecture..
  - we don't change `AppDelegate.m` to the new `AppDelegate.mm` as it's only useful for the new RN arch which we aren't using yet + it was a pain to migrate the existing config (Firebase, Flipper, splash screen)
- Upgraded `react-native-reanimated` to `2.8.0`
- Upgraded `lottie-react-native` to `5.1.3` as it was not building on iOS without upgrading -> I tested the device lotties in the "Debug Lottie" menu and it seems to work fine.
- Upgraded `react-native-gesture-handler` to `2.5.0` & [Migrating off RNGHEnabledRootView](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/migrating-off-rnghenabledroot) as its setup on Android (in `MainActivity.java`) might conflict with react-native stuff later on
- Fixed an issue in the portfolio where if there was no assets, scrolling was crashing the app on iOS. This is a mysterious issue and the logs are similar to this issue https://github.com/software-mansion/react-native-reanimated/issues/2285, for now it has been solved by removing the animation of a border width (border which anyway was invisible so the animation was pointless).
