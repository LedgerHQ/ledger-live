---
"@ledgerhq/live-common": minor
---

Enable Aleo as a swap currency. Bump `@ledgerhq/wallet-api-core` to `^1.35.0`, which registers the `aleo` family in `WALLET_API_FAMILIES` so Aleo resolves through `currency.list` and becomes selectable as a swap source, and register Aleo as Nano S–incompatible for swap (`INCOMPATIBLE_NANO_S_CURRENCY_KEYS`) with its incompatibility copy.
