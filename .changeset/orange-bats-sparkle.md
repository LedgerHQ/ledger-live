---
"@ledgerhq/wallet-api-acre-module": minor
"@ledgerhq/coin-ton": minor
"@ledgerhq/live-common": minor
"@ledgerhq/wallet-api-deeplink-module": minor
"@ledgerhq/wallet-api-exchange-module": minor
---

feat(coin-ton): support new TON payload types (tonwhales deposit/withdraw, vesting comment)

Adds typed payload variants and serialization/deserialization for:

- tonwhales-pool-deposit
- tonwhales-pool-withdraw
- vesting-send-msg-comment

Updates unit tests to cover new payloads and retains an explicit unsupported payload test case (lint-suppressed locally). Also bumps TON-related and wallet-api dependencies and replaces the @ton/core patch file reference.
