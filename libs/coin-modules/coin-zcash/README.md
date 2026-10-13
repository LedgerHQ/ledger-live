# @ledgerhq/coin-zcash

> [!CAUTION]
> **Status: UNSTABLE** — new standalone Zcash coin-module; API under active development.

Standalone Zcash coin-module, following the [`coin-module-boilerplate`](../coin-module-boilerplate) layout.

## Scope

Serves every Zcash account in Ledger Live, in one of two modes. The host picks the mode
from the `zcashShielded` feature flag (see `libs/ledger-live-common/src/bridge/zcashRouting.ts`):

- **Shielded** (the native `@ledgerhq/zcash-utils` engine is available): owns all four
  transfer flows (transparent → transparent, transparent → shielded, shielded → transparent,
  shielded → shielded), each crafted, signed and broadcast as a PCZT, and syncs the
  shielded pools alongside the transparent one.
- **Transparent-only** (no native engine — React Native, or the desktop app with the flag
  off): syncs and sends transparent funds only, through `@ledgerhq/wallet-btc` and the
  device's legacy transaction signing (`src/legacy`). A shielded recipient is refused.

Either way this module owns the transparent (UTXO) path itself; `@ledgerhq/coin-bitcoin` no
longer carries any Zcash code.

Two of those flows do not complete on a NU6.3 chain, where newly shielded value goes to
the Ironwood pool: a shielded send to a third party (z→z) has no builder at all, because it
would need Orchard spends alongside an Ironwood output and the V6 builder only takes
Ironwood spends; and a flow that does build a V6 PCZT cannot be finalized, since
`@ledgerhq/zcash-utils` exposes no V6 counterpart to its finalizer. See
`src/bridge/signOperation.ts` for which builder each `transferType` reaches.

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
