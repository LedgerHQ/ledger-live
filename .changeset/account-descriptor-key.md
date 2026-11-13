---
"@domain/entity-account-descriptor": minor
"@domain/api-account-data": minor
"@features/platform-account-source-coin-module": minor
"@features/platform-account-source-portfolio": minor
"@devtools/mock-accounts": minor
"@devtools/bindings": minor
"@domain/entity-account": minor
"@ledgerhq/live-common": minor
"@ledgerhq/coin-ton": minor
"@ledgerhq/coin-stacks": minor
---

Account descriptor: one `key` field for both types; Canton, Concordium, Internet Computer, TON, Aptos and Stacks accounts are keyed on their public key, their address computed through the coin module loaders; a legacy account left out is mirrored again once it converts
