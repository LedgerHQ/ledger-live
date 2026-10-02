# @domain/entity-account-data

> [!CAUTION]
> **Status: UNSTABLE** — New package; API still being designed.

The account data **protocol**, data side. Types only.

## Responsibility

- `AccountData`: an open interface, one key per datum (`balance`, `operations`, …). It is empty
  here. Each `@domain/entity-account-*` package declares its key by augmentation, next to its models.
- `AccountDatum`, `AccountDataQuery<K>`, `AccountDataResult<K>`: read from that map.
- `AccountDataBinding<K, S>`: what a slice exposes so the generic read can drive it: three action
  creators and the selectors for freshness, pending state, the source that last answered and, for a
  paginated datum, the next page.

This package knows no slice and no source. The source contract and the read live in
`@domain/api-account-data-source`.

## Adding a datum

```ts
// in @domain/entity-account-staking
declare module "@domain/entity-account-data" {
  interface AccountData {
    staking: { query: undefined; result: AccountStaking };
  }
}

export const accountStakingBinding: AccountDataBinding<"staking", WithAccountStaking> = {
  datum: "staking",
  requested: accountStakingRequested,
  received: accountStakingReceived,
  failed: accountStakingFailed,
  selectAt: selectAccountStakingAt,
  selectPending: (state, id) => selectAccountStakingStatus(state, id).pending,
  selectSourceId: (state, id) => selectAccountStakingStatus(state, id).sourceId,
};
```

Nothing in this package changes.
