---
"live-mobile": patch
---

fix(wallet-api): broken ble on LLM

We had to remove the reset of the device to undefined
It avoids starting the ble scanning again on success
The ble scanning is disconnecting all device which was causing the issue
