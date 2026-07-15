---
"@ledgerhq/live-common": minor
---

Move the cross-platform parts of the swap device-intent stack (`signApprovalEvm`, `signSwapEvm`, `broadcastEvm` jobs, definitions and types) from `apps/ledger-live-mobile` into `@ledgerhq/live-common/wallet-api/Exchange/intents` so the same logic can later be reused by the desktop wallet. The mobile side now only owns the LWM React components and `intentLWMDefinition.ts` thin wrappers that attach those components to the shared cross-platform definitions.
