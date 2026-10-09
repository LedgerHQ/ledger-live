# @domain/entity-account-descriptor

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

## Why

The account descriptor (V1, see the [ADR](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7599489111/ADR+Account+descriptor+as+the+common+account+identity)) is the common identity of an account. This package holds the format wallet-cli already stores and prints, as a shared entity.

## Main exports

| Export | Role |
| --- | --- |
| `AccountDescriptorSchema` | zod union of `utxo` (xpub, hardened-only path, `h` marker only) and `address` descriptors |
| `serializeAccountDescriptor` / `parseAccountDescriptor` | `account:1:<type>:<name>:<env>:<xpub or address>:<path>`, same format as wallet-cli; unlike wallet-cli, apostrophe paths (`m/84'/0'/0'`) are rejected |
| `accountDescriptorKey` | canonical key: serialized descriptor, with `0x` addresses lowercased; no other normalization (path notation, network and non-`0x` address case are kept as is) |
| `computeAccountUUID` | uuid v5 of the canonical key; same on every device, no xpub nor address |
| `networkFromCurrencyId` / `currencyIdFromNetwork` | network ↔ currency id |
