# @domain/entity-account-descriptor

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

## Why

The account descriptor (V1, see the [ADR](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7599489111/ADR+Account+descriptor+as+the+common+account+identity)) is the common identity of an account. This package holds the format wallet-cli already stores and prints, as a shared entity.

## Main exports

| Export | Role |
| --- | --- |
| `AccountDescriptorSchema` | zod union of `utxo` (xpub, hardened-only path) and `address` descriptors; `'` and `H` hardened markers are read as `h` |
| `serializeAccountDescriptor` / `parseAccountDescriptor` | `account:1:<type>:<name>:<env>:<xpub or address>:<path>`, the format wallet-cli uses; a parsed descriptor always has `h` markers |
| `accountDescriptorKey` | canonical key: serialized descriptor with `h` hardened markers and `0x` addresses lowercased; network and non-`0x` address case are kept as is |
| `computeAccountUUID` | uuid v5 of the canonical key; same on every device, no xpub nor address |
| `networkFromCurrencyId` / `currencyIdFromNetwork` | network ↔ currency id |
