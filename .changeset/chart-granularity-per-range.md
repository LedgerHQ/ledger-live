---
"live-mobile": minor
"ledger-live-desktop": minor
"@ledgerhq/live-common": minor
---

Align asset chart point granularity per date range with the product spec (LIVE-31777). Adds a shared per-range resampler in live-common and wires it into both apps: desktop targets finer intervals (e.g. 1D 5min, 1M 2h, All 7d) while mobile uses coarser ones (e.g. 1D 10min, 1M 6h, All 1mo) for render performance. The resampler only coarsens, so ranges where the API serves coarser data than requested (desktop 6M) gracefully fall back to the available resolution.
