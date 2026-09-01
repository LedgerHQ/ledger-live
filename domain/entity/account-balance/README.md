# @domain/entity-account-balance

> [!CAUTION]
> **Status: UNSTABLE** — First slice carved out of the `Account` god object by the [account domain migration](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7389904957/Account+domain+migration+discovery); the API is still being designed.

The `balance` / `spendableBalance` table for wallet accounts — the cheapest and most frequently
changing part of an account, given a home of its own so that rendering a balance no longer requires
holding a whole `Account` (and therefore its full operation history).

## What it owns

One flat table, keyed by account id, with **main accounts and token accounts as sibling rows**:

```
Record<AccountId, {
  accountId, assetId, balance, spendableBalance, parentId?, at
}>
```

Three deliberate choices:

- **Normalised, not nested.** A token account is a row with `parentId` set, not a member of a
  parent's `subAccounts` array. `flattenAccounts` becomes a selector, and a token account's balance
  is reachable without walking a tree.
- **Serializable throughout.** Ids and decimal strings (`BigNumberStr`), never `BigNumber`, `Date`
  or resolved currency objects. The table can go into Redux and to disk untouched; callers parse
  amounts with their own BigNumber implementation at the edge.
- **`at` on every row.** Freshness is a property of the balance, not of a whole account sync, which
  is what lets a caller decide whether a value is stale enough to be worth refetching.

## Main exports

| Export | Purpose |
| --- | --- |
| `AccountBalanceSchema`, `AccountBalancesStateSchema` | The canonical model, and validation for persisted / untrusted data |
| `accountBalancesSlice` | The RTK slice. Mount its reducer under the `accountBalances` key (`WithAccountBalances`) |
| `replaceAccountBalances` | Atomically set an account's balance **and** the full set of its token-account balances |
| `upsertAccountBalances` | Insert/overwrite specific rows, leaving the rest alone |
| `removeAccountBalances`, `resetAccountBalances` | Account removal, profile reset |
| `accountBalanceSelector`, `subAccountBalancesSelector`, `hasAccountBalanceSelector` | Reads, with a memoized parent → children index |
| `toAccountBalances` | Project a legacy `Account` / `TokenAccount` onto rows — the compatibility seam |

### Why `replaceAccountBalances` is the one sources should use

Chains that return every asset held at an address in a single call — EVM and friends — report a
token swept to zero by *omitting* it from the response, not by sending a zero. An upsert-only API
would freeze that token's row at its pre-sweep value forever. `replaceAccountBalances` diffs the
account's own row plus all rows parented to it, so a vanished token account vanishes from the table
and no orphan row is left behind.

### `toAccountBalances` and the legacy seam

`AccountForBalance` is a *structural* view of an account — narrow enough that `Account` and
`TokenAccount` from `@ledgerhq/types-live` satisfy it as-is, without this package depending on the
god object it is carving up. That is what lets the table be filled by today's full account sync
while nothing downstream has migrated yet.

## Who fills the table

`@features/platform-account-data` — the capability-routed data-source layer that decides, per
account and per slice, whether a balance comes from a direct on-chain `getBalance` call or from a
full legacy bridge sync.
