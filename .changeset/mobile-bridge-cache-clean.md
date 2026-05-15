---
"live-mobile": patch
---

Replace the CLEAN_CACHE reducer handler with a thunk in useCleanCache that resolves the AccountBridge per account and dispatches replaceAccounts.
