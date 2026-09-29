# @features/platform-account-source-coin-module

> [!CAUTION]
> **Status: EXPLORATION.** API still being designed.

An account data source that reads straight from a coin module: one `getBalance` for a balance, one
`listOperations` page for operations. No full sync.

## Responsibility

`CoinModuleSource` implements `AccountDataSource` from
[`@domain/api-account-data-source`](../../../domain/api/account-data-source):

- `balance`: the native row, then one row per known, non-blacklisted token account.
- `operations`: one page, token operations fanned out to their token account, the module's cursor
  handed back as `nextCursor`.
- `supports(ref, datum)`: the account's family is in the list the app gave for that datum. A family
  served for `balance` says nothing about `operations`: each datum is gated on its own parity.

## What it is given, not what it knows

It never imports live-common. The app injects:

- `loadCoinModule(currencyId)`: the coin module with its context bound, loaded lazily through the
  existing registry. live-common provides it as `loadCoinModule` in `account-data/coinModulePorts`.
- `tokenAccountIdOf(parentId, tokenId)`: the legacy token account id encoding, so both sources
  write the same ids. Also in `coinModulePorts`.
- `families`: per datum, the families to serve. No list of families lives here.

The operation mapping is checked against the legacy adapter in
`libs/ledger-live-common/src/account-data/coinModulePorts.test.ts`.
