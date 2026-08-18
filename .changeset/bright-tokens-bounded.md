---
"@ledgerhq/live-common": patch
---

Bound the concurrency of CAL token lookups in the `currency.list` wallet-api handler. It resolved every requested token id in a single unbounded `Promise.all`, so a live app asking for hundreds of tokens fired hundreds of simultaneous requests. Measured against the real CAL API with the 627 ids the Buy/Sell live app requests, that took 75.6s and 251 of the requests failed outright — and a failed lookup is silently dropped, so the returned currency list was quietly incomplete. Bounded to 10 in flight the same work takes 5.9s with no failures
