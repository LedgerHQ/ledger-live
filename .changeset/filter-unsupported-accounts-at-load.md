---
"ledger-live-desktop": patch
"live-mobile": patch
---

Filter accounts at load time: accounts whose currency (or derivation mode) is not supported by the current build are dropped before they reach the Redux store. This makes the invariant "if an account is in state, getAccountBridge resolves" hold, preventing crashes in the Send/Receive/Swap/Sync paths when the supported-currencies list shrinks or a coin module is missing.
