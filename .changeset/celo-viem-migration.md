---
"@ledgerhq/coin-celo": minor
"@ledgerhq/hw-app-celo": minor
"@ledgerhq/live-signer-celo": minor
---

Remove all `@celo/*` runtime dependencies (except `@celo/abis`) and replace with `viem` SDK; source contract ABIs (Registry, Accounts, Election, LockedGold, IERC20) from the official `@celo/abis` package instead of a local hand-written copy; drop `rlpEncodedTxForLedger` from the Celo signer interface in favour of viem/celo CIP-64 transaction serialization
