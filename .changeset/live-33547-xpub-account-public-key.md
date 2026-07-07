---
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
---

generic-coin-framework: store the account public key in `Account.xpub` (previously the address) for the evm/xrp/stellar/tezos families. Derive `makeSync`'s account-id identity from the immutable account id instead of the mutable `xpub` field, so healing `xpub` to the public key never re-keys or clears accounts. Account ids remain address-based; existing accounts populate `xpub` on the next device-connected scan.
