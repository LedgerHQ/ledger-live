# Account Analytics

> [!CAUTION]
> **Status: UNSTABLE** — Selection and data contracts are under active development.

Owns the Analytics visit: asset/account selection, compatibility and removal fallbacks, and the
latest-request-wins read lifecycle. The host supplies an eligible catalog and a memoized
`loadBalance` port. Native and token positions have distinct position IDs but share their parent
account ID. Asset IDs represent cross-network DADA groups, not tickers.

`useAccountAnalyticsViewModel` keeps selection local to its mount. Initial account/currency
context is resolved only after the catalog succeeds. Catalog loading/errors never clear a
selection. Hosts must keep blacklisted assets excluded and include zero positions with history,
including an empty native position when account activity makes its Analytics entry eligible.

Balance amounts and history use the host fiat currency's smallest unit; variation ratios use
fractions (`0.1` means 10%). A ready amount of zero is different from unavailable data. Hosts
leave held positions without a price out of the total and history, as the Portfolio does, and
report unavailable when no held position of the selection is priced or a priced holding has no
history. Ports receive an AbortSignal; the ViewModel also rejects outdated requests even
when a port cannot cancel its work. Changing the port callback refreshes the current selection
when host accounts or countervalues change.

The chart range preserves asset/account selection and affects the chart and its variation, not the current
balance or PnL cards/details. The PnL result key excludes both the chart metric and its range;
existing current/lifetime PnL definitions remain unchanged. Historical return-series definitions
and data are delivered separately.
Routing, legacy portfolio access, formatting and widgets belong to host adapters. No global
portfolio state is written and no user data is persisted here.

## Host kit

The rules above are shared by both apps through the root entry, so a host only maps its own
state and its legacy portfolio code:

- **Sources.** Pass host accounts straight in: they match `AnalyticsAccountSource` and
  `AnalyticsTokenAccountSource` structurally, and the helpers return the host's own position type.
- **Catalog.** `useAnalyticsCatalog` takes the host accounts, their names, the blacklist, an
  `isConfirmed(operation, account)` check built from the host confirmation settings, and the
  DADA `product`/`version`. It selects the eligible positions, requests their asset metadata and
  returns the catalog state, the positions and a refresh callback (none when nothing is eligible).
- **Balance.** `useAnalyticsBalancePort` builds the `loadBalance` port from the positions, the
  countervalues, the fiat currency and a module-level `readPortfolio(positions, range, countervalues,
  fiat)` function. It is the only host code that reads the legacy portfolio: it returns the raw
  `balanceHistory` and `availableAccounts` with a `readVariation(currentBalance)` callback, and the
  package maps them.
- **Renderers.** `useAnalyticsBalanceSummary` and `useAnalyticsPnlPositions` give the statuses,
  the current balance and the scoped positions a host renderer shows.
- **Settings.** `toAnalyticsPeriod` maps the host range setting. The query context carries the
  ticker of the host countervalue, fiat or crypto, the same currency the balance port reads.

## Tracking

The Analytics rows of the tracking plan ([Account detail - Tracking Plan](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7644020738))
are encoded in `src/tracking/accountAnalyticsTracking.ts`. The module is **pure**: it builds
payloads, and the filters view model calls `track(...)`. The banner on the account page is
tracked by `@features/flow-account-detail`.

| Event | When | Properties |
| --- | --- | --- |
| `button_clicked` | A filter dropdown opens | `button`: `asset filter` or `account filter`, `page`: `Analytics` |
| `filter_changed` | Another option is picked (not when the current one is re-selected) | `filter`: `Asset` or `Account`, `page`: `Analytics`, `value`, `previousValue` |

`value` and `previousValue` are the asset name for the asset filter and the network name for the
account filter, never the account name. The "All" options send `all`.
