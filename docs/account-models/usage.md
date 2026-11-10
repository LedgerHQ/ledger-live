# Using account models in a screen

In the [MVVM](../../.agents/skills/mvvm-architecture/SKILL.md) split, the view model does two things per kind it shows, and the view only receives plain data:

- **`useAccountData(kind, descriptor, { query })`** keeps that kind of that account read while mounted, and gives `pending`, `error`, `refresh`, and `hasMore` and `loadMore` for paged kinds. It returns no data.
- **`useAccountDataBatch(kind, descriptors, { query })`** keeps that kind of many accounts read, with a different return: `accountUUIDs` in the order of the descriptors, `errors` (one `{ accountUUID, error }` per failed account), `pending` on first reads and refreshes only, and `refresh`. It has no `hasMore` or `loadMore`: page an account with `useAccountData`.
- **The entity's selector** reads the data from its slice, by `AccountUUID` and the same query.

The snippets type the store as `State`, the app's root state. Each app mounts the `accounts` slice at `accountEntries`.

## Find the descriptor

```ts
const { selectAccountEntry, selectAccountUUIDByLegacyId } = accountsSlice.getSelectors(
  (state: State) => state.accountEntries,
);
```

From an `AccountUUID`, for example a route parameter:

```ts
const descriptor = useSelector((state: State) => selectAccountEntry(state, accountUUID))?.descriptor;
```

Only at the boundary with a legacy screen that still holds an `Account`, get its `AccountUUID` first:

```ts
const accountUUID = useSelector((state: State) =>
  selectAccountUUIDByLegacyId(state, AccountIdSchema.parse(account.id)),
);
```

## One kind of one account

```ts
export function useAccountBalanceViewModel(descriptor: AccountDescriptor) {
  const { accountUUID, pending, error, refresh } = useAccountData("balance", descriptor);
  const balances = useSelector((state: State) =>
    accountUUID ? selectAccountBalances(state, accountUUID) : undefined,
  );
  return { balances, pending, error, refresh };
}
```

`balances` has one row per asset, native coin first, amounts as integer strings in the asset's smallest unit.

## Several kinds of one account

A token page shows the token's balance row and its operations, valued in the user's fiat, page by page. Each kind is its own read, with its own status; the view model combines them:

```ts
export function useTokenPageViewModel(descriptor: AccountDescriptor, assetId: CryptoOrTokenCurrencyId, fiat: FiatCurrencyTicker) {
  const query: AccountOperationsQuery = { filterAsset: assetId, countervalue: fiat, limit: 20 };
  const balance = useAccountData("balance", descriptor);
  const operations = useAccountData("operations", descriptor, { query });
  const { accountUUID } = balance;

  const assetBalance = useSelector((state: State) =>
    accountUUID ? selectAccountAssetBalance(state, accountUUID, assetId) : undefined,
  );
  const rows = useSelector((state: State) =>
    accountUUID ? selectAccountOperations(state, accountUUID, query) : undefined,
  );

  return {
    assetBalance,
    operations: rows, // each row carries countervalues?.[fiat], what it was worth at its date
    pending: balance.pending || operations.pending,
    error: balance.error ?? operations.error,
    hasMore: operations.hasMore,
    loadMore: operations.loadMore,
    refresh: () => Promise.all([balance.refresh(), operations.refresh()]),
  };
}
```

The query is compared by value, so an inline object does not read again. Two screens reading the same account with different queries keep separate windows and statuses.

## Every account: total balance and wallet graph

A cross-account figure is a selector over each account's entity, never a kind. Here the `balanceHistory` kind, valued in a fiat, gives both the wallet graph and the total: the last point of each series is the current balance.

> [!IMPORTANT]
> This example needs [#24309](https://github.com/LedgerHQ/ledger-live/pull/24309) (`balanceHistory` valued in a fiat), not merged yet: on develop `balanceHistory` takes no `countervalue` and its points have no `countervalues`.

```ts
const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

export const selectWalletBalanceHistory = createSelector(
  [
    selectAccountEntries,
    (state: State) => state.accountBalanceHistories,
    (_: State, range: BalanceHistoryRange) => range,
    (_: State, _range: BalanceHistoryRange, fiat: CountervalueTicker) => fiat,
  ],
  (entries, histories, range, fiat) => {
    const read = entries.map(({ accountUUID }) => histories[accountUUID]?.[range]);
    // An account not read yet would pass a partial sum for the total.
    if (!read.every(history => history !== undefined)) return undefined;
    const series = read
      .flatMap(history => history.series)
      .map(({ points }) => points.map(({ date, countervalues }) => ({ bucket: bucketOf(date, range), value: countervalues?.[fiat] })));
    const buckets = [...new Set(series.flatMap(points => points.map(p => p.bucket)))].sort();
    return buckets.map(bucket => ({ date: bucket, value: sumAt(series, bucket) }));
  },
);

/** Each series counts with its latest point so far; one unvalued point leaves the bucket unvalued. */
const sumAt = (series: { bucket: string; value?: string }[][], bucket: string) =>
  series.reduce<bigint | undefined>((sum, points) => {
    const latest = points.findLast(p => p.bucket <= bucket);
    if (!latest) return sum;
    return sum === undefined || latest.value === undefined ? undefined : sum + BigInt(latest.value);
  }, BigInt(0));

/** The hour for a day graph, the day for longer ranges. */
const bucketOf = (date: string, range: BalanceHistoryRange) => date.slice(0, range === "day" ? 13 : 10);

export function useWalletBalanceViewModel(range: BalanceHistoryRange, fiatTicker: FiatCurrencyTicker) {
  const fiat = CountervalueTickerSchema.parse(fiatTicker); // from @domain/entity-account-balance, the brand balanceHistory keys by
  const descriptors = useSelector((state: State) => selectAccountEntries(state).map(e => e.descriptor), shallowEqual);
  const { pending, errors, refresh } = useAccountDataBatch("balanceHistory", descriptors, { query: { range, countervalue: fiat } });
  const series = useSelector((state: State) => selectWalletBalanceHistory(state, range, fiat));
  const latest = series?.length === 0 ? { value: BigInt(0) } : series?.at(-1); // no point at all: a known zero
  const total = pending || errors.length > 0 ? undefined : latest?.value; // in the fiat's smallest unit
  return { series, total, pending, errors, refresh };
}
```

- `useAccountDataBatch` reads every account in one tick, so the router groups them: one call per chunk on a source with a batch reader, at most 4 calls in flight per source otherwise.
- Points are summed per hour or day, not per timestamp: FullSync stamps each series' last point with the time it was read, so two accounts never share it. A series with no point in a bucket counts with its latest earlier one, so the last bucket holds every series' current balance: it is the total.
- A partial sum never shows as the wallet balance: the selector gives `undefined` until every account has a history, a bucket where a series' latest point has no value in the fiat has no value (no older valuation is carried over it), and the view model withholds `total` while a read is pending or has failed, so the view can offer `refresh` on `errors`.
- An empty history, or a series with no point, is a source's answer that the account held nothing over the range: it adds zero. A source that does not know returns an error, not an empty history.
- A selector several screens reuse goes in a package (the planned `@features/platform-portfolio`), not in the app.

## Test and inspect

- `@devtools/mock-accounts` generates accounts served by a mock source: a screen works with no device and no network.
- The DevTools tools of each kind (`@devtools/account-balance-history`…) show the stored rows and the read status per account.
- [`newKind.test.tsx`](../../features/platform/account-data/src/newKind.test.tsx) shows the hook end to end with a test kind.
