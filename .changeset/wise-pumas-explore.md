---
"@ledgerhq/asset-detail": minor
"live-mobile": patch
---

Expose resolved multi-network `ledgerIds` from `useAssetMarketData` so consumers (mobile Asset Detail → Receive flow) get the full CoinGecko list instead of the single id `marketCurrencyData.ledgerIds` collapses to when the DADA market entry wins.

Add `useReceiveNetworkLedgerIds`, which resolves a token's complete network list from DADA so the Receive flow can offer every network (including ones not held yet). CoinGecko's `ledgerIds` is unreliable for tokens — it can collapse to a single network or expose only a partial subset (e.g. WETH surfaces just Ethereum + Neon while DADA knows 11 networks) — so we always query DADA and only keep its list when it is strictly more complete than the CoinGecko fallback.
