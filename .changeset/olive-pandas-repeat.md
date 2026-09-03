---
"@ledgerhq/coin-solana": minor
"@ledgerhq/live-common": minor
"@ledgerhq/ledger-wallet-framework": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Enable the generic coin framework for Solana: the send and staking screens move onto the generic transaction shape, and the validation, fees, balances, operation types and transaction serialization the legacy bridge produced are restored on the generic path. A live app can again submit the four token and stake commands the wallet API defines.

Restored on the way, each a behaviour the legacy bridge had: an incoming SPL transfer produces an operation again, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

The legacy Solana bridge goes with it: `prepareTransaction`, `getTransactionStatus`, `signOperation`, the synchronisation and the on-chain instruction parsers are deleted, as they were for every family already on the framework. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

A family can now contribute its own fields to a token sub-account, through the new `buildTokenAccountShapes` bridge hook.

Also affects Casper: fee estimation now names a valid dummy recipient, which a new test asserts for every generic-framework family.
