---
"@ledgerhq/live-common": patch
---

Bound and size the concurrency of CAL token lookups in the `currency.list` wallet-api handler. It resolved every requested token id in a single unbounded `Promise.all`, so a live app asking for hundreds of tokens fired hundreds of simultaneous requests. Measured against the real CAL API with the ids the Buy screen requests, that took 75.6s and 251 of 627 requests failed outright — and a failed lookup is silently dropped, so the returned currency list was quietly incomplete. CAL exposes no bulk id endpoint, so the number of requests is fixed and only the pool size is tunable: it is now 25, which puts the Buy screen's 736 lookups near ~22s on an Android emulator (each lookup costs ~747ms there against ~90ms on a host network) instead of 67.5s
