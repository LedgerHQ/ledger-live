---
"ledger-live-desktop": patch
"@ledgerhq/live-common": patch
---

Migrate desktop call sites of deprecated top-level helpers (isAccountEmpty, clearAccount, isEditableOperation, isStuckOperation, getStuckAccountAndOperation) to AccountBridgeExtensions via useAccountBridge / useAccountBridgeMany / getAccountBridge; solana/banner.ts now accepts the resolved bridge as a parameter.
