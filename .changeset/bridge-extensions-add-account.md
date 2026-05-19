---
"ledger-live-desktop": patch
---

Migrate add-account flows (legacy modal + AddAccountDrawer scan), account screen entry, cache-clean reducer, and useAccountStatus from deprecated isAccountEmpty / clearAccount top-level helpers to bridge-resolved equivalents (useAccountBridgeMany, useAreAccountsEmpty, getAccountBridge thunks).
