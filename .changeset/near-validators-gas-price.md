---
"@ledgerhq/coin-near": minor
"@ledgerhq/live-common": patch
---

Stop preloading the NEAR validator list, so a refused validator fetch no longer fails NEAR account syncs; the staking screens and the stake banner load it when shown. Cache the validator list for 6 hours and read the gas price from the node first.
