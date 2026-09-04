# @features/platform-account-data

> [!CAUTION]
> **Status: EXPLORATION** — first slice of the [account domain migration](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7389904957/Account+domain+migration+discovery), tracked in [LIVE-36765](https://ledgerhq.atlassian.net/browse/LIVE-36765). Nothing here is stable.

> **Why this exists, how wallet-xp and ptx are meant to consume it, and where the duplication with
> the legacy sync comes from:** [docs/account-data-layer.md](../../../docs/account-data-layer.md).
> This README covers using the package.

Today a balance costs a whole `Account`: `AccountBridge.sync()` takes one and returns one, history
and resource bags included, and you cannot ask for it at all unless something already synced that
account into the store. This package lets a caller read **just the balance**, addressed by five
strings rather than by an object it must already own.

## Two concepts

```
useAccountBalance(ref) ──► fetchAccountBalance ──► pickSource ──► accountBalancesSlice
                             (fresh? pending?)      (priority)      (rows + status)
```

**`AccountBalanceSource`** — `{ id, priority, supports(ref), getBalances(ref, signal) }`. What it can
serve, and how cheaply. Registered at the app composition root, never imported by a screen: that is
what lets a family move from a full sync to a direct chain read with no UI change.

**`accountBalancesSlice`** (`@domain/entity-account-balance`) — the rows, the per-account status, and
the selectors. Where the data lands and where it is read from.

Selection is one rule: **the highest-priority source whose `supports(ref)` is true.** New world first
when it is available, full sync otherwise. There is no plan, no set-cover, no scheduler.

## Wiring an app

```ts
registerAccountBalanceSources([
  {
    id: "granular",
    priority: 10,
    supports: ref => !ref.parentId && granularFamilies.has(familyOf(ref.currencyId)),
    getBalances: ref => readBalancesFromCoinModule(ref),
  },
  {
    id: "full-sync",
    priority: 0,
    supports: ref => !ref.parentId,
    getBalances: (ref, signal) => syncAndProject(ref, signal),
  },
]);
```

Then mount `accountBalancesSlice.reducer` under the `accountBalances` key, and a screen can call
`useAccountBalance(ref)`.

The capability decision — *which families can serve a balance on their own* — must be read from the
app's coin layer, never copied into a list here. Three divergent hardcoded "families with the new
API" lists is how this repo got into trouble in the first place.

## Freshness, de-duplication, and what replaced the scheduler

Both guards live in `fetchAccountBalance` and read state that is already in the store:

- **fresh enough** — the row's own `at`, so freshness survives a reload and needs nothing on the side;
- **already pending** — `accountBalanceRequested` lands synchronously, so forty portfolio rows
  mounting in one tick produce one read per account.

There is **no polling** and no reference-counted demand: a read happens because something asked for
it. `BridgeSync` keeps running in the background beside this layer, not behind it.

## Without React, without Redux

`readAccountBalances(ref, sources, signal)` is a plain function, and `fetchAccountBalance` is a plain
thunk — `(dispatch, getState) => Promise<void>`. wallet-cli drives
`accountBalancesSlice.reducer` over a local variable and calls either one directly. No provider, no
context, no store required.

## Token accounts

A token account's balance is not independently readable: one chain call returns every asset held at
an *address*, so a token row arrives with its parent's read. Sources take the **main account's** ref;
`useAccountBalance` on a token ref reads its row and triggers nothing.

## Not here yet

`operations`, `balanceHistory`, `staking` and the family resource bags. Adding one is a new entity
slice and a new source method — not a change to this selection rule. Second slice:
[LIVE-36923](https://ledgerhq.atlassian.net/browse/LIVE-36923).
