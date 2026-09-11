---
"@ledgerhq/live-common": minor
"@ledgerhq/ledger-wallet-framework": minor
---

Casper fee estimation now names a valid dummy recipient, which a new test asserts for every family enabled on the generic coin framework.

Three additions on the way, in preparation for enabling Solana: a family can contribute its own fields to a token sub-account through the new `buildTokenAccountShapes` bridge hook; a fee estimation can propagate a transfer fee, a stake account rent and an owner token account onto the transaction, and a transfer fee is now assigned even when absent, so a fee kept from a previously selected asset can no longer reach the device screen; and a staking position's locked reserve counts towards the staked balance.

No family declares the new hook yet, and no coin module emits the new fee parameters or a locked reserve, so nothing changes on screen beyond the Casper fix.
