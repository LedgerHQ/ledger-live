---
"@ledgerhq/live-common": minor
"@ledgerhq/live-countervalues": minor
---

Enable Aleo as a swap currency. Register Aleo as Nano S–incompatible for swap (`INCOMPATIBLE_NANO_S_CURRENCY_KEYS`) with its incompatibility copy, and add Aleo to the live-countervalues mock registry so mocked countervalues cover it. Aleo becomes selectable as a swap source because the `aleo` family is present in `WALLET_API_FAMILIES` (via `@ledgerhq/wallet-api-core` `^1.35.0`, already a dependency), so it resolves through `currency.list`.
