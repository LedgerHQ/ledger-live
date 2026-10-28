---
"@ledgerhq/coin-tester-bitcoin": minor
"@ledgerhq/coin-tester": minor
---

Run the Bitcoin deterministic tester on coin-sandbox: the regtest node and Atlas are started through its `up` and funded by its airdrop, instead of the tester's own docker-compose, which is removed with the `docker-compose` dependency

The coin-tester awaits a transaction's `expect` when it returns a promise, so the next transaction and the last sync wait for it, and its failed assertions fail the scenario
