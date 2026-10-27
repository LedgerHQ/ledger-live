---
"live-mobile": minor
---

chore(rn-upgrade): bump react navigation and screens (LIVE-39319)

Bump React Navigation to the 2026-05-08 release set (native 7.2.4, native-stack 7.14.14, bottom-tabs 7.15.13, core 7.17.4, elements 2.9.17), react-native-screens to 4.24.0 and @react-native-masked-view/masked-view to 0.3.2. Screens 4.24.0 is the last version that supports React Native 0.81. Remove @react-navigation/material-top-tabs and react-native-pager-view: no screen uses a top-tab navigator since LIVE-33326.

Editing a memo or tag from the send summary now sets the new params on the summary route directly. @react-navigation/core 7.17+ drops the nested params of popTo when the send steps are updated in the same render, so the summary kept the old value.
