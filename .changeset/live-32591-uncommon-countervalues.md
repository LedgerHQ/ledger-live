---
"@ledgerhq/live-common": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Fix the Asset Detail price chart and the Market list showing wrong/blank values for uncommon countervalues, on both mobile and desktop. The markets endpoints only serve the fiats CoinGecko lists as supported, and the chart endpoint additionally rejects crypto countervalues (e.g. BTC/ETH). For these cases (crypto, or fiats CoinGecko does not support such as COP) we now fetch in USD and rescale by the USD→countervalue spot rate, then format with the user's countervalue unit — mirroring the price section. Natively supported fiats keep using the endpoints' true values, and unsupported fiat requests wait for the support list before fetching so they do not fire a speculative native request first.
