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

- `.` (`createBridges`) — the Ledger Live `AccountBridge`/`CurrencyBridge`, the only path
  Ledger Live Desktop/Mobile uses.
- `./types` — bridge/signer/error type contracts.

There is deliberately no `CoinModuleApi` (`createApi`) here. Migrating to it is a separate
task, kept out of the switch away from the `coin-bitcoin` adapter so that transition changes
nothing but where the code lives: an address-indexed api would need a second data source the
bridge never exercises, and one that cannot answer for shielded value at all, since notes are
encrypted to a viewing key the api's address argument does not carry.

## Layout

- `src/logic/` — chain logic with no Ledger Live shape to it: PCZT craft/combine/broadcast,
  ZIP-317 coin selection, address rules, balance arithmetic, the explorer-transaction
  primitives. Organized by concern (`account/`, `history/`, `transaction/`) with tests
  co-located. `src/bridge/` imports from here; the reverse never happens.
- `src/bridge/` — the `AccountBridge`, with everything only it needs: sync (transparent +
  shielded), operation mapping, serialization and wallet-btc account plumbing. The only
  bespoke residue is `bridge/signOperation.ts` (PCZT device-signing orchestration).
- `src/network/` — data access: the `@ledgerhq/zcash-utils` native engine, the in-process /
  Electron-IPC / React-Native-stub client polymorphism, and the UtilityProcess IPC bridge.
- `src/signer/` — device signer resolution (`getAddress`, `getFullViewingKey`, xpub
  composition).
- `src/types/` — bridge, signer and error type contracts (self-contained — no
  `@ledgerhq/coin-bitcoin` dependency).
