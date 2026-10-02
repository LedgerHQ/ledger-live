---
"@ledgerhq/coin-polkadot": major
"@ledgerhq/coin-tester-polkadot": patch
"@ledgerhq/live-common": minor
"@shared/env": patch
---

Make coin-polkadot stateless: `createBridges` takes a `Context`, endpoints, tuning and cache TTLs come from `config_currency_polkadot`, logs go through `context.logger`, and the Polkadot env variables are removed.
