---
"@ledgerhq/coin-tester-stacks": patch
---

chore: drop the external bitcoin miner and tighten the devnet timeouts

With Clarinet's Bitcoin RPC proxy restored, Clarinet mines the devnet's blocks itself, so
`scripts/bitcoin-miner.js` and its start-timing logic are removed. The boot deadline and contract
waits drop from 15/25 minutes to 5, since a snapshot boot is ready in about a minute; the setup hook
allows 30 minutes to cover a Clarinet build on a cache miss.

The pinned Clarinet commit and Rust toolchain are now read from `docker/clarinet/Dockerfile` only,
and the local binary cache is keyed on a hash of `docker/clarinet/**`, so changing the commit, a
patch or the toolchain rebuilds it. The snapshot-copy patch also creates the destination with a
blocking `mkdir -p`, as Clarinet's own mkdir is a detached exec that `docker cp` could outrun.
