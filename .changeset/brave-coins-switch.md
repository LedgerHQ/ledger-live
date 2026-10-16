---
"@ledgerhq/wallet-btc": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/wallet-cli": minor
"@ledgerhq/coin-tester-bitcoin": minor
---

Move bitcoin onto the generic coin framework bridge: coin-bitcoin ships only its CoinModuleApi, the account layer lives in live-common, the transaction carries the user choices in familySpecificData and the estimation in feeParameters, with no Zcash path left in it (ADR-065)
