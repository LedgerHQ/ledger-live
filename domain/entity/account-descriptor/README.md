# @domain/entity-account-descriptor

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

## Why

The account descriptor (see the [ADR](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7599489111/ADR+Account+descriptor+as+the+common+account+identity)) is the common identity of an account. This package holds it as a shared entity.

## Format (version 2)

`account:2:<type>:<network_id>:<xpub or address>:<path>`

- `network_id`: the CAL network id (`bitcoin`, `bitcoin_testnet`, `ethereum_sepolia`), lowercase in the canonical key.

- `utxo`: the subject is an xpub, the path is hardened up to the account.
- `address`: the subject is the address, the path is the full path of that address.

A path is `m/` followed by indices below 2^31 without leading zeros; `'` and `H` are read as `h`.

```
account:2:utxo:bitcoin:xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh:m/84h/0h/0h
account:2:address:ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:m/44h/60h/0h/0/0
account:2:address:solana:7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU:m/44h/501h/0h/0h
```

## Main exports

| Export | Role |
| --- | --- |
| `AccountDescriptorSchema` | zod union of `utxo` (xpub, hardened-only path) and `address` descriptors; `'` and `H` hardened markers are read as `h` |
| `serializeAccountDescriptor` / `parseAccountDescriptor` | `account:2:<type>:<network_id>:<xpub or address>:<path>`; a parsed descriptor always has `h` markers |
| `accountDescriptorKey` | canonical key: the serialized descriptor, normalized (see `key.ts`) |
| `computeAccountUUID` | uuid v5 of the canonical key; same on every device, no xpub nor address |
| `networkFromCurrencyId` / `currencyIdFromNetwork` | network id ↔ currency id, the same id for now |
