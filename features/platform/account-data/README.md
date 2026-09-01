# @features/platform-account-data

> [!CAUTION]
> **Status: UNSTABLE** — The hybrid account-data layer from the [account domain migration](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7389904957/Account+domain+migration+discovery). Only the `balance` slice is served today; the API is still being designed.

> Concepts, diagrams and the current caveats: [docs/account-data-layer.md](../../../docs/account-data-layer.md).
> This README covers using the package.

Today there is exactly one way to obtain any piece of account data: `AccountBridge.sync()`, which
returns a whole `Account` — core fields, the full operation history, the balance-history cache and
every coin-specific resource bag — as one indivisible unit. Rendering a balance costs an operation
history.

This package is the layer that breaks that. A screen says *what* it needs; the layer decides *how*
to get it and *whether* a fetch is needed at all.

## The four pieces

```
        useAccountBalance / useAccountDataDemand      ← what a screen asks for
                          │
                     scheduler.ts                     ← freshness, coalescing, demand refcount
                          │
                      router.ts                       ← planFetch: capability set-cover
                          │
      ┌───────────────────┼───────────────────┐
 CoinModuleApiSource            LegacyBridgeSource    ← port implementations, injected by the app
 (direct getBalance)            (full bridge sync)
                          │
              @domain/entity-account-balance          ← where the data lands
```

### `port.ts` — the contract

`AccountDataSource` has an unusual pair of methods, and the difference between them is the whole
design:

| | Meaning |
| --- | --- |
| `capabilities(ref)` | slices this source can fetch **independently** — asking for one does not pay for the others |
| `deliveries(ref)` | slices this source **will** emit whenever it runs, whatever was asked |

A full bridge sync declares `capabilities = ∅` and `deliveries = {balance, …}`. Empty capabilities
means the router never *selects* it for a slice — it only ever covers what no cheaper source could.
Non-empty deliveries means the router knows a single run of it satisfies several wants at once.

Over-delivering is legal and expected. Under-delivering is a bug.

### `router.ts` — `planFetch`

Cheapest source first, and **each leg subtracts the source's deliveries**, not the slices it was
picked for. That one detail produces the behaviour that matters:

| Family | Wanted | Plan |
| --- | --- | --- |
| granular, A4 on | `{balance}` | A4 → `{balance}`. One conditional GET. |
| granular, A4 off | `{balance}` | CoinModuleApi → `{balance}`. One chain call. |
| granular | `{balance, resources}` | **one** legacy sync — the granular leg is dropped, because the sync it must run for `resources` produces `balance` anyway |
| legacy-only | `{balance}` | legacy sync. Same cost as today; never worse. |

The third row is the one to internalise: **asking for a family resource bag silently opts you back
into the full sync, and asking only for a balance does not.** Which means a screen that asks for more
than it needs pays for more than it needs — visibly, and per screen.

### `scheduler.ts` — where the savings actually land

Four things a per-account sync queue cannot do:

- **freshness per slice** — a balance fetched 2s ago is skipped even though the same account's
  operations are hours old;
- **coalescing per `(account, slice)`** — a portfolio mounting forty rows produces one fetch per
  account, and a second reader joins the in-flight promise instead of starting another;
- **routing per slice** — the plan comes from `planFetch`;
- **reference-counted demand** — polling exists only while something on screen is asking for it.

Per-slice status (`pending` / `error` / `lastFetchedAt` / `sourceId`) is deliberately **not** in
Redux: it is ephemeral per-run state, and storing it would mean an action per shimmer. The scheduler
holds it behind `useSyncExternalStore`, so a component re-renders when *its* pair changes rather than
whenever any account anywhere starts syncing. It graduates to `@domain/entity-account-sync-meta` when
validators (an A4 account version, a `syncHash`) have to survive a restart.

### `sources/` — the hybrid, both halves

**`createCoinModuleApiSource`** is the granular path: `getBalance(address)` → balance rows, full
stop. It never assembles an `Account`, never walks a second operation page, and never pays for a
slice nobody asked for. One call returns every asset the address holds, native and tokens alike, so
an account with twelve token accounts asks the module **once** rather than thirteen times.

> [!NOTE]
> How cheap that call is, is the *module's* business, not this layer's, and it varies: `coin-tron`
> answers from one account-state request, `coin-evm` also has to discover which token contracts the
> address holds. Both work. So "implements `CoinModuleApi`" does not mean "can serve a balance
> independently" — a capability declared here is only as honest as the module behind it. See
> [docs/account-data-layer.md](../../../docs/account-data-layer.md).

**`createLegacyBridgeSource`** is the compatibility half: today's full sync, unchanged, behind the
port. It is what makes goal 4 of the migration true — *legacy families keep working with zero
per-family work*. As families gain granular capabilities this source stops being reached for them one
at a time, with no UI change; when the last one is migrated it is unregistered and deleted.

Both take a **port**, not a coin module: `features/` may not import `libs/`, so the concrete
implementations are built and registered at each app's composition root. `capabilities()` coming from
the port is also how the repo's three hardcoded "families with the new API" lists go away — the
answer comes from the coin module, not from a JSON file in the wallet.

### `sourceRequirements.ts` — the conformance suite

`describeAccountDataSourceContract` asserts the invariants a source must hold for the router to be
correct (`deliveries ⊇ capabilities`, no emission outside `deliveries`, no silent under-delivery,
token rows parented to the requested account). Every implementation runs it, in-repo or app-side —
same idea as `describeCloudSyncModuleContract`.

## Wiring an app

```ts
const registry = createAccountDataSourceRegistry([
  createCoinModuleApiSource(coinModuleApiPort),  // priority 10
  createLegacyBridgeSource(legacyBridgePort),    // priority 0
]);
const scheduler = createAccountDataScheduler({ registry, dispatch: store.dispatch });
// <AccountDataProvider scheduler={scheduler}> at the app root
```

Then mount `accountBalancesSlice.reducer` under the `accountBalances` key, and screens can call
`useAccountBalance(ref)`.

## Why `AsyncIterable` rather than `Observable`

A source emits each slice as it resolves — a balance that took 80ms must not wait on an operation
page that takes 900ms — which needs a stream, not a promise. `AsyncIterable` gives that natively, so
this layer carries no rxjs dependency and cancellation rides the `AbortSignal` already on the
request. An `Observable`-based bridge adapts to it in a few lines inside the app's port
implementation.

## Not here yet

`operations`, `balanceHistory`, `staking`, `resources` and `core` exist in the `AccountSlice`
vocabulary and in the router's set-cover, but no source serves them. Adding one is a new
`SliceUpdate` variant plus an entry in a source's `deliveries` — the routing does not change. An
`A4Source` (priority 20, conditional revalidation through the account `version` header) is the next
one worth adding: it is the single biggest background-cost win available.
