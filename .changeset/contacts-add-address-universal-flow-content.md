---
"@features/flow-contacts-add-address": minor
"live-mobile": minor
---

`ContactsAddAddressFlowContent` has one props contract on both platforms: it takes the flow `state` and its callbacks, and each platform picks the step to render. On mobile it replaces the per-step `step`, `addressEntryProps`, `addressNameProps` and `addressReviewProps`, takes `onScanQrCode` and `bottomOffset`, and derives the name step action from the entry mode. The step components and their props types are no longer exported, the `.` entry has no `react-native` condition, and `./native` is gone.
