# @ledgerhq/coin-zcash

> [!CAUTION]
> **Status: UNSTABLE** — new standalone Zcash coin-module; API under active development; coexists with the coin-bitcoin Zcash adapter during transition.

Standalone Zcash coin-module, following the [`coin-module-boilerplate`](../coin-module-boilerplate) layout.

## Scope

Owns all four Zcash transfer flows (transparent → transparent, transparent → shielded,
shielded → transparent, shielded → shielded), crafted, signed and finalized as V5 PCZT
transactions via the native `@ledgerhq/zcash-utils` engine. Unlike the Zcash chain-adapter
living in `@ledgerhq/coin-bitcoin`, this module owns the transparent (UTXO) path itself —
via `@ledgerhq/wallet-btc` — instead of falling back to the Bitcoin bridge. The two
implementations coexist temporarily; routing between them is controlled by the
`zcashCoinModule` feature flag in `ledger-live-common` (see
`libs/ledger-live-common/src/bridge/impl.ts`).

## Main exports

- `./api` — `createApi`, the `CoinModuleApi` implementation (headless/framework path).
- `.` (`createBridges`) — the Ledger Live `AccountBridge`/`CurrencyBridge` (device-sync path
  used by Ledger Live Desktop/Mobile).
- `./logic` — the core, framework-agnostic Zcash logic (crafting, signing helpers, sync,
  balance, coin-selection, address classification).
- `./types` — bridge/signer/error type contracts.

## Layout

- `src/logic/` — main codebase; pure functions implementing the `CoinModuleApi` surface.
- `src/api/` — thin `createApi` assembly over `src/logic/`.
- `src/bridge/` — thin `AccountBridge`; the only bespoke residue is `bridge/signOperation.ts`
  (PCZT device-signing orchestration).
- `src/network/` — data access: the `@ledgerhq/zcash-utils` native engine, the in-process /
  Electron-IPC / React-Native-stub client polymorphism, and the UtilityProcess IPC bridge.
- `src/signer/` — device signer resolution (`getAddress`, `getFullViewingKey`, xpub
  composition).
- `src/types/` — bridge, signer and error type contracts (self-contained — no
  `@ledgerhq/coin-bitcoin` dependency).
