# `legacy/store/` — why it exists and when it goes away

This directory is **temporary**. It lives under `legacy/` so the intent stays obvious; each legacy
concern gets its own `legacy/<concern>/` subdir with its own `FUTURE.md`.

## What it is

`buildCryptoAssetsStore` + the local `CryptoAssetsStore` port. It adapts the
`@domain/api-currency-token` RTK-Query api to the legacy `getCryptoAssetsStore()` contract;
apps inject the result through the legacy `setCryptoAssetsStore` global singleton.

## Why it's temporary

It is a **strangler facade**. The destination is: consumers read the `@domain/*` data layer
directly, and the legacy `@ledgerhq/cryptoassets` store (`getCryptoAssetsStore` /
`setCryptoAssetsStore`) is removed. The facade exists only to keep the legacy contract alive
during the migration, so there is a **single runtime source** — one RTK cache (the
`@domain/api-currency-token` instance), never a parallel cache — without changing every caller
at once.

## What comes next (in order)

1. **Single-source gate** — each app store is wired onto `buildCryptoAssetsStore`, **replacing**
   (not adding to) the legacy `cryptoAssetsApi` reducer. One cache, app-wide.
2. **Repoint our own consumers** — live-common and the apps read `@domain/*` directly instead of
   going through `getCryptoAssetsStore()`.
3. **Coin-modules are the blocker** — they still depend on `@ledgerhq/cryptoassets` and call
   `getCryptoAssetsStore()`. We **cannot** repoint them from here: they must first be decoupled
   from `cryptoassets`, which is owned by **#team-coin-integration** and runs on their roadmap, not
   ours. This is the gate on removing `legacy/store/`.
4. **Drop** — once nothing calls `getCryptoAssetsStore()`, this directory and the legacy store are
   deleted (kept frozen / extracted only if external consumers that cannot migrate still need it).

## TL;DR

`legacy/store/` lives exactly as long as something still calls `getCryptoAssetsStore()`. The last
holdouts are the coin-modules, and their decoupling is owned by **#team-coin-integration** — so treat
this directory as temporary, but do not expect to delete it on our own schedule.
