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
`zcashShielded` feature flag in `ledger-live-common` (see
`libs/ledger-live-common/src/bridge/impl.ts`).

## Main exports

- `./api` — `createApi`, the `CoinModuleApi` implementation (headless/framework path).
- `.` (`createBridges`) — the Ledger Live `AccountBridge`/`CurrencyBridge` (device-sync path
  used by Ledger Live Desktop/Mobile).
- `./logic` — the framework-agnostic logic the headless api is built from (PCZT
  craft/combine/broadcast, ZIP-317 coin selection, address classification, chain tip).
- `./types` — bridge/signer/error type contracts.

## Layout

- `src/logic/` — the functions backing the `CoinModuleApi` surface, and nothing else:
  whatever `src/api/index.ts` cannot reach belongs to `src/bridge/`. Organized by concern
  (`account/`, `history/`, `transaction/`) with tests co-located. `src/bridge/` may import
  from here (coin selection, address rules, balance arithmetic, the transparent transaction
  primitives and the PCZT steps are shared); the reverse never happens.
- `src/api/` — thin `createApi` assembly over `src/logic/`.
- `src/bridge/` — the `AccountBridge`, with everything only it needs: sync (transparent +
  shielded), operation mapping, serialization and wallet-btc account plumbing. The only
  bespoke residue is `bridge/signOperation.ts` (PCZT device-signing orchestration).
- `src/network/` — data access: the `@ledgerhq/zcash-utils` native engine, the in-process /
  Electron-IPC / React-Native-stub client polymorphism, the UtilityProcess IPC bridge, and
  the Ledger explorer reads the engine has no address index for.
- `src/signer/` — device signer resolution (`getAddress`, `getFullViewingKey`, xpub
  composition).
- `src/types/` — bridge, signer and error type contracts (self-contained — no
  `@ledgerhq/coin-bitcoin` dependency).
