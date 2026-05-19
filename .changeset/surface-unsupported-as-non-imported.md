---
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/live-wallet": patch
---

When accounts are dropped at load because their currency is unsupported by the current build, surface them as non-imported entries in the wallet store. If the user has wallet-sync active, the next sync cycle naturally cleans up any entry whose descriptor is no longer in the cloud; otherwise entries stay parked invisibly. A new `addNonImportedAccounts` action merges new entries without overwriting existing ones. No UI change in this PR — surfacing comes next.
