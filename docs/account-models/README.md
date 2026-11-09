# Account models

How Ledger Wallet represents an account in the new architecture, and how we get there from the legacy `Account` type of [`@ledgerhq/types-live`](../../libs/types-live/README.md).

> [!IMPORTANT]
> The legacy `Account`, `TokenAccount` and `AccountLike` types are being retired. New code in `shared/`, `domain/` and `features/` never takes them: it takes an `AccountDescriptor` and reads `account-*` entities. See [migration.md](./migration.md) for what is left.

| Read | When |
| --- | --- |
| [usage.md](./usage.md) | Showing account data on a screen: one account, several kinds, several accounts |
| [data-layer.md](./data-layer.md) | The framework: read flow, router, adding an entity or a source |
| [migration.md](./migration.md) | Where each `Account` field goes, what is left, in which order |

## The paradigms

**1. One universal identity.** An account is an [`AccountDescriptor`](../../domain/entity/account-descriptor): its type (`utxo` with an xpub, or `address`), CAL network, xpub or address, and derivation path. That is all any source needs to read it. Its `AccountUUID`, a uuid v5 of the canonical key, keys the `accounts` list and every account data kind: the same on every device, and it holds no xpub and no address, unlike the legacy `account.id` (`js:2:ethereum:0x…`).

```text
account:2:utxo:bitcoin:xpub6Bosf…NzH:m/84h/0h/0h
account:2:address:ethereum:0x71C7…976F:m/44h/60h/0h/0/0
```

**2. One entity per UI concept.** The monolithic `Account` is split into small entities, each a `domain/entity/account-<kind>` package: a Zod schema, one `AccountDataRegistry` line, a slice keyed by `AccountUUID`, selectors and a mock. An entity exists only for a concept a screen shows. Tokens are rows of each entity (one balance row, one operation row per asset), not sub-accounts. Sync state (`blockHeight`, `lastSyncDate`, `syncHash`) is not a UI concept and is not carried over.

**3. Read on demand, not synced ahead.** A screen asks for the kind it shows, when it shows it, with `useAccountData(kind, descriptor, { query })`, or `useAccountDataBatch(kind, descriptors, { query })` for a figure over many accounts. Nothing refreshes every account in the background to fill a monolith. A read younger than 30 s is not repeated, a read in flight is joined, and the latest one wins.

**4. Layers that decouple the UI from the implementations.**

| # | Layer | Where |
| --- | --- | --- |
| 1 | Screen: view model and view | `features/flow/*`, `apps/*/src/mvvm` |
| 2 | Hooks: `useAccountData`, `useAccountDataBatch` | `features/platform/account-data` |
| 3 | Entities: what a kind is | `domain/entity/account-*` |
| 4 | Router: which source answers | `domain/api/account-data` |
| 5 | Sources: connectors to an implementation | `live-common` (FullSync), `features/platform/account-source-*`, `devtools/mock-accounts` |
| 6 | Coins: the implementations | `libs/coin-modules/*`, backends |

Layers 1 to 3 are the UI model and layers 5 and 6 the implementations. The router is their only link, so a screen never knows which source answered.

**5. Sources are interchangeable.** A source has one `supports(descriptor, kind)` and one reader per kind it serves. The router picks, per account and kind, the first ranked source that serves it. Each app ranks its sources in `src/config/account-data-setup.ts`: today CoinModule, then FullSync (a Portfolio backend source is a PoC). FullSync remaps the legacy synced `Account` and serves every kind as the fallback. An empty cell in the kind × source grid never blocks a screen.

**6. Status in the framework, data in the entity.** Pending, error, source and next-page cursor live in the generic `accountData` slice, per kind, account and query. The entity slice only stores its data.

**7. Writes are not reads.** Preparing, signing and broadcasting go through a `send` capability on the same sources, never through a kind. The only store write is the pending operation. This is still being explored (see [migration.md](./migration.md)).

**8. Network data is not account data.** Validators, fee currency and network parameters are keyed by network, not by `AccountUUID`. Data only one coin family shows becomes a kind declared by that family's package, not a generic "resources" kind.

**9. Aggregates are selectors, not kinds.** Portfolio total, asset details and allocation combine the entities of every account with selectors. They are not stored per account.

## The entities

This list is not complete: more entities are needed before no screen reads `Account`. If your feature needs one that does not exist yet, create it yourself, following the recipe in [data-layer.md](./data-layer.md#adding-an-entity): a `domain/entity/account-<kind>` package and its FullSync reader are enough for a screen to use it. You do not need to wait for another team.

| Kind | Package | Status |
| --- | --- | --- |
| `balance` | [`@domain/entity-account-balance`](../../domain/entity/account-balance) | merged |
| `operations` | [`@domain/entity-account-operation`](../../domain/entity/account-operation) | merged: pages, `filterAsset`, `countervalue` |
| `balanceHistory` | [`@domain/entity-account-balance-history`](../../domain/entity/account-balance-history) | merged; valued in a fiat in [#24309](https://github.com/LedgerHQ/ledger-live/pull/24309) |
| `receive` | `@domain/entity-account-receive` | discovery [LIVE-40837](https://ledgerhq.atlassian.net/browse/LIVE-40837), PoC [#24410](https://github.com/LedgerHQ/ledger-live/pull/24410) |
| `existence` | [`@domain/entity-account-existence`](../../domain/entity/account-existence) | FullSync reader; discovery [LIVE-40835](https://ledgerhq.atlassian.net/browse/LIVE-40835), [#24600](https://github.com/LedgerHQ/ledger-live/pull/24600), coin module `exists` [#24601](https://github.com/LedgerHQ/ledger-live/pull/24601) |
| `send` capability, not a kind | none yet | discovery [LIVE-40836](https://ledgerhq.atlassian.net/browse/LIVE-40836) |
| staking, locked balances, family kinds | none yet | to explore |

Names, aliases and stars are their own entities ([`account-name`](../../domain/entity/account-name), [`account-alias`](../../domain/entity/account-alias), [`starred-account`](../../domain/entity/starred-account)), still keyed by the legacy account id, never by an `AccountUUID`. Only names have a UUID selector, `selectAccountNameByUUID`. For a star, pass the entry's `legacyId` (`selectAccountEntry(state, accountUUID)?.legacyId`) to `isStarredAccountSelector`; an alias resolves to an `AnyAccountId`, which `selectAccountUUIDByLegacyId` turns into an `AccountUUID` once it is a top-level `AccountId`. A token account id (`TokenAccountIdSchema.safeParse`) first goes to its parent with `getParentId`, and the screen keeps its token as the asset to show. The list of accounts is the `accounts` slice of [`@domain/entity-account`](../../domain/entity/account).
