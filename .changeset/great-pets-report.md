---
"live-mobile": patch
"@ledgerhq/live-common": patch
---

fix(DeviceConnect): remove onError handler

The error is already handled by the UI in `DeviceActionModal`
Also adds a correct title to this screen and fixes the `SafeAreaView`
