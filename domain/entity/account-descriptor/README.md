# @domain/entity-account-descriptor

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

## Why

The account descriptor (V1, see the [ADR](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7599489111/ADR+Account+descriptor+as+the+common+account+identity)) is the common identity of an account. This package holds the format wallet-cli already stores and prints, as a shared entity.

## Format (v1.0)

`account:1:<type>:<network name>:<network env>:<xpub or address>:<path>`

- `utxo`: the subject is an xpub, the path is hardened up to the account.
- `address`: the subject is the address, the path is the full path of that address.

A path is `m/` followed by indices below 2^31 without leading zeros; `'` and `H` are read as `h`.

```
account:1:utxo:bitcoin:main:xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh:m/84h/0h/0h
account:1:address:ethereum:main:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:m/44h/60h/0h/0/0
account:1:address:solana:main:7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU:m/44h/501h/0h/0h
```

## Main exports

| Export | Role |
| --- | --- |
| `AccountDescriptorSchema` | zod union of `utxo` (xpub, hardened-only path) and `address` descriptors; `'` and `H` hardened markers are read as `h` |
| `serializeAccountDescriptor` / `parseAccountDescriptor` | `account:1:<type>:<name>:<env>:<xpub or address>:<path>`, the format wallet-cli uses; a parsed descriptor always has `h` markers |
| `accountDescriptorKey` | canonical key: the serialized descriptor, normalized (see `key.ts`) |
| `computeAccountUUID` | uuid v5 of the canonical key; same on every device, no xpub nor address |
| `networkFromCurrencyId` / `currencyIdFromNetwork` | network ↔ currency id |
