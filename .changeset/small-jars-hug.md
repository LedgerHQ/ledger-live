---
"@ledgerhq/cryptoassets": major
"ledger-live-desktop": major
"live-mobile": major
"@ledgerhq/live-common": major
"@ledgerhq/types-cryptoassets": minor
"@ledgerhq/coin-framework": minor
"@ledgerhq/coin-evm": minor
"@ledgerhq/live-cli": minor
"@ledgerhq/live-env": minor
---

Migrate Ethereum family implementation to EVM family

Replace the legcay Ethereum familly implementation that was present in ledger-live-common by the coin-evm lib implementation.
This change was made in order to improve scalabillity and maintainability of the evm coins, as well as more easilly integrate new evm based chains in the future.
