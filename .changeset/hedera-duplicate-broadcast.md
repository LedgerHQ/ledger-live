---
"live-mobile": patch
---

Fix duplicate transaction broadcast in the send flow. The broadcast was triggered from a render prop, so any re-render of the device action result state re-submitted the same signed transaction (e.g. Hedera DUPLICATE_TRANSACTION). The broadcast now fires only once per device-action result.
