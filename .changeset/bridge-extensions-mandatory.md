---
"@ledgerhq/live-common": major
"ledger-live-desktop": minor
"live-mobile": minor
---

Remove the 6 deprecated top-level helpers from @ledgerhq/live-common: `isAccountEmpty`, `clearAccount`, `getVotesCount`, `isEditableOperation`, `isStuckOperation`, `getStuckAccountAndOperation`. Consumers must now resolve an `AccountBridge` first (via `useAccountBridge`/`useAccountBridgeMany` in React, or `getAccountBridge`/`getAccountBridgeByFamily` elsewhere) and call the corresponding method on the bridge. Desktop and mobile apps have been migrated.
