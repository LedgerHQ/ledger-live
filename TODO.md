See `poc` branch as a reference implementation.

## important tasks

- Integrate libcore for iOS
- Integrate libcore for Android

## UI ONLY things to do (with estimation time)

> These can be worked with mock data.

- (1d) @gre – connect mock data to our store & integrate all redux part that make sense from desktop.
- (3d-7d) Implement the Dashboard screen without the graph card but with a functional operation list.
- (3d) Bootstrap a basic version of Accounts screen
- (3d) Bootstrap a basic version of Operation Details
- (3d) Bootstrap a basic version of Settings screen
- (3d) Bootstrap a basic version of Account screen
- Implement the graph card of dashboard
  - (<1d) implement the card itself with the balance, countervalue and balance history (use live-common lib)
  - (1-2d) graph: suggest to use react-native-svg (current style is minimal, don't use too much abstractions)
  - (2-3d) making it interactive with PanResponder. potential lib https://github.com/kmagiera/react-native-gesture-handler . also HIGHLY consider using an Animated.Value to bind the UI (do not use setState!)
- (1d) Implement the sticky header that appear on scroll. Mandatory use of Animated in "native" mode: https://facebook.github.io/react-native/docs/animated#handling-gestures-and-other-events
- (<1d) polish the modal that appear when c
- (1d) Implement Accounts screen header + account sorting + "AddAccount" link
- (4h) react-native-vector-icons: Remove all images in src/images and replace by usage of react-native-vector-icons. Design team will only use Material and Feather.

## When libcore have first integration

- Port poc's `src/screens/ImportAccounts.js` screen. use and improve live-common's bridgestream.
- Implement Sync (inspire from desktop)
