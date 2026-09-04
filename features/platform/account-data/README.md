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

A wallet host does not hand-write its sources. `createAccountBalanceSources` in
`@ledgerhq/live-common/account-data/sources` builds both from the little that genuinely differs:

```ts
registerAccountBalanceSources(
  createAccountBalanceSources({
    getAccount: accountId => accountSelector(store.getState(), { accountId }),
    prepareCurrency,
    blacklistedTokenIds: () => blacklistedTokenIdsSelector(store.getState()),
  }),
);
```

Then mount `accountBalancesSlice.reducer` under the `accountBalances` key, and a screen can call
`useAccountBalance(ref)`.

It lives in `libs/` and not here because the sources are built from live-common's coin layer and
`features/` may not import `libs/` — and because the decision it encodes, *which families can serve a
balance on their own*, has to exist in exactly one place. Three apps each writing their own is how
this repo ended up with three divergent "families with the new API" lists. A host that genuinely
needs its own source (wallet-cli narrows to `evm`) still just passes an object matching
`AccountBalanceSource`.

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

## The second datum: operations

`useAccountOperations(ref)` reads an account's history one page at a time, through
`AccountOperationsSource` and its own registry. It was built to falsify the shape above — see
[what survived and what broke](../../../docs/account-data-layer.md#the-second-slice-what-survived-and-what-broke).

Three differences worth knowing before using it:

- **two verbs, two guards.** `fetchAccountOperations` reads the head and is freshness-guarded;
  `fetchMoreAccountOperations` reads the next page and is deliberately **not** — a user reaching the
  bottom of a list is always inside any sensible max-age window.
- **`paginated` on the source.** A full bridge sync returns the whole history or nothing, so it
  declares `paginated: false` and never receives a cursor. "Load more" on such a family does not
  exist rather than being slow.
- **`total` can be `undefined`.** A paginated read cannot know how many operations an account has.
  Every "N transactions" label has to handle that.

The history gate defaults to **empty**: every family reads through the full sync, because
`listOperations` parity is unproven. A family being granular for `balance` says nothing about
`operations`.

## Not here yet

`balanceHistory`, `staking` and the family resource bags. `balanceHistory` should be a *derived*
slice: the graph walks back from the current balance over a window of operations bounded by its
granularity, so it composes the two slices that exist rather than needing a third source.
