---
"@ledgerhq/live-common": minor
---

The Wallet API `message.sign` handler now reads `options.path` and signs a Bitcoin family message with that derivation path instead of the fresh address path. The path must be a receive or change address of the same account, in the format returned by `bitcoin.getAddresses` (`m/84'/0'/0'/0/5`). Any other path rejects the request. On other account families only the account's own path is accepted, and the message is signed as without a path. Requests without `path` are unchanged. Needs the `@ledgerhq/wallet-api-*` release that adds `options.path` to `message.sign`.
