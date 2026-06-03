---
"@ledgerhq/live-common": patch
---

perf(llc): defer coin bridge loading in generic-coin-framework via async import()

getBridgeApi now lazily imports the matched family bridge (evm, solana, stellar, tezos) instead of eagerly loading all of them at module load.
