---
"@ledgerhq/live-common": minor
---

The Wallet API `message.sign` handler now reads `options.path` and signs a Bitcoin family message with that derivation path instead of the fresh address path. The path must be a receive or change address of the same account, in the format returned by `bitcoin.getAddresses` (`m/84'/0'/0'/0/5`); any other path, or a path on a non-bitcoin account, rejects the request. Requests without `path` are unchanged. Needs the `@ledgerhq/wallet-api-*` release that adds `options.path` to `message.sign`.
