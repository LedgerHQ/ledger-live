---
"live-mobile": minor
---

Hide Send and Receive for HyperCore accounts on mobile: HyperCore has no on-chain send on Ledger Wallet and a plain receive is misleading (deposits go through bridging). Both actions are now hidden across the account actions (FAB), the asset actions, the quick-action drawers and the no-funds empty state, reusing the shared `isSendDisabledForFamily` / `isReceiveDisabledForFamily` predicates from `@ledgerhq/live-common`. The account "Quick actions" section is also hidden entirely when it has no actions left (e.g. HyperCore), instead of showing an empty titled section.
