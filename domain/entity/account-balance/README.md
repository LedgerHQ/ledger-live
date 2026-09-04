# @domain/entity-account-balance

> [!CAUTION]
> **Status: EXPLORATION** — first slice carved out of the `Account` god object by the [account domain migration](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7389904957/Account+domain+migration+discovery), tracked in [LIVE-36765](https://ledgerhq.atlassian.net/browse/LIVE-36765).

The `balance` / `spendableBalance` table for wallet accounts — the cheapest and most frequently
changing part of an account, given a home of its own so that rendering a balance no longer requires
holding a whole `Account` (and therefore its full operation history).

## What it owns

```
{
  rows:   Record<AccountId, { accountId, assetId, balance, spendableBalance, parentId?, at }>,
  status: Record<AccountId, { pending, error?, sourceId? }>,
}
```

Main accounts and token accounts are **sibling rows** in `rows`; `status` is keyed by main-account id
because a read is always addressed to a main account.

Four deliberate choices:

- **Normalised, not nested.** A token account is a row with `parentId` set, not a member of a
  parent's `subAccounts` array. A token account's balance is reachable without walking a tree.
- **Serializable throughout.** Ids and decimal strings (`BigNumberStr`), never `BigNumber`, `Date` or
  resolved currency objects — and `error` is a message, not an `Error`. The whole state can go into
  Redux and to disk untouched; callers parse amounts with their own BigNumber implementation at the
  edge.
- **`at` on every row.** Freshness is a property of the balance, not of a whole account sync, which
  is what lets a caller decide whether a value is worth refetching — and what let the fetch layer
  drop its bespoke bookkeeping.
- **Status next to the rows it describes.** A shimmer and a retry button are ordinary derived state.
  Keeping them here is what removed the subscription layer this slice used to need.

## Main exports

| Export | Purpose |
| --- | --- |
| `AccountBalanceSchema`, `AccountBalanceRowsSchema` | The canonical model, and validation for persisted / untrusted data |
| `accountBalancesSlice` | The RTK slice. Mount its reducer under the `accountBalances` key (`WithAccountBalances`) |
| `accountBalanceRequested` / `accountBalanceReceived` / `accountBalanceFailed` | The three states of one read |
| `accountBalancesRemoved`, `accountBalancesReset` | Account removal, profile reset |
| `accountBalancesSlice.selectors` | `selectAccountBalance`, `selectSubAccountBalances`, `selectAccountBalanceStatus`, `selectAccountBalanceAt`, `selectAccountBalanceRows` |

Selectors are declared **inside** the slice (RTK 2), so `accountBalancesSlice.selectors.*` takes the
app's root state and `accountBalancesSlice.getSelectors()` takes the slice state alone — which is
what lets wallet-cli run this reducer over a local variable.

### Why `accountBalanceReceived` replaces the whole set

Chains that return every asset held at an address in a single call — EVM and friends — report a token
swept to zero by *omitting* it from the response, not by sending a zero. An upsert-only API would
freeze that token's row at its pre-sweep value forever. `accountBalanceReceived` diffs the account's
own row plus all rows parented to it, so a vanished token account vanishes from the table and no
orphan row is left behind.

## What this package deliberately does not know

**What an `Account` is.** There is no legacy mapper here: an entity that imports
`@ledgerhq/types-live` inherits the god object it exists to carve up. The
`Account → AccountBalance[]` projection lives on the legacy side of the boundary, in
[`libs/ledger-live-common/src/legacy-mapping`](../../../libs/ledger-live-common/src/legacy-mapping).

## Who fills the table

[`@features/platform-account-data`](../../../features/platform/account-data) — the source layer that
decides, per account, whether a balance comes from a direct on-chain `getBalance` call or from a full
legacy bridge sync.
