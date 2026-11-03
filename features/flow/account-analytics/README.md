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
must report unavailable when required pricing/history is missing rather than silently sum a
partial result. Ports receive an AbortSignal; the ViewModel also rejects outdated requests even
when a port cannot cancel its work. Changing the port callback refreshes the current selection
when host accounts or countervalues change.

The chart range preserves asset/account selection and affects only the chart, not the current
balance or PnL cards/details. The PnL result key excludes both the chart metric and its range;
existing current/lifetime PnL definitions remain unchanged. Historical return-series definitions
and data are delivered separately.
Routing, legacy portfolio access, formatting and widgets belong to host adapters. No global
portfolio state is written and no user data is persisted here.
