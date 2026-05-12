---
"live-mobile": patch
---

Migrate mobile call sites of `isAccountEmpty`, `clearAccount`, `isEditableOperation`, `isStuckOperation`, `getStuckAccountAndOperation`, and `getVotesCount` to the `AccountBridgeExtensions` API (`useAccountBridge` / `useAccountBridgeMany` in React, `getAccountBridge` elsewhere).
