---
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
---

feat(stacks): keep public-key account ids and persist staking positions on the generic bridge

- New `BridgeApi.accountIdFromPublicKey` opt-in: a synced account keeps the id it was stored under, and a scanned one is keyed on the device public key, so a family whose legacy bridge keyed ids on the public key is not re-keyed by the generic bridge. Stacks opts in.
- Stacks registers generic-bridge hooks for its estimation recipient and for persisting `stakingPositions`, which gates the Stake action.
