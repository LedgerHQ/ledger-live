---
"@shared/feature-flags": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Sample `estimateFees` and `validateIntent` successes in `coin_module_call` with a new `preparationSampleRate` param of the `coinObservability` flag (default 0.1): the bridge calls them on every edit of a transaction, so sending each call made them most of the volume. Their failures are still always sent, and `craftTransaction`, `craftRawTransaction`, `craftTransactionData`, `combine` and `broadcast` stay unsampled. Each `coin_module_call` now carries its tier's `sampleRate` and an `inSample` flag, so dashboards can compute unbiased failure rates and estimate volumes from the sample.
