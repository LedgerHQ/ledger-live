---
"@ledgerhq/live-common": patch
---

Bound the concurrency of CAL token lookups in the `currency.list` wallet-api handler. It resolved every requested token id in a single unbounded `Promise.all`, so a live app asking for hundreds of tokens fired hundreds of simultaneous requests. Measured against the real CAL API with the ids the Buy screen requests, that took 75.6s and 251 of 627 requests failed outright — and a failed lookup is silently dropped, so the returned currency list was quietly incomplete. Bounded, none fail. Note this is a correctness fix only: CAL exposes no bulk id endpoint, so the request count is fixed, and raising the bound does not make the call faster — measured on an Android emulator, going from 10 to 25 in flight took the same 624 lookups from 67.5s to 88.8s, because the connection is throughput-limited rather than latency-limited
