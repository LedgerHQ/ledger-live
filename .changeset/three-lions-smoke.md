---
"@ledgerhq/react-native-hid": patch
---

Android sdk 34 give the following error when use transporter from the lib @ledger/react-native-hid:

One of RECEIVER_EXPORTED or RECEIVER_NOT_EXPORTED should be specified when a receiver isn't being registered exclusively for system broadcasts.

To fix this bug is needed call getReactApplicationContext() with the Context.RECEIVER_NOT_EXPORTED attribute. https://github.com/LedgerHQ/ledger-live/issues/7786
