---
"live-mobile": patch
---

Remove eager `prepareCurrency(ethereum)` call at app startup to improve startup performance. The call was redundant as BridgeSync and the add-account flow already call it on demand.
