---
"@ledgerhq/coin-tester-stacks": patch
---

fix: let bitcoind own its snapshot data on Linux, and print why the devnet failed to boot

Booting from the snapshot, Clarinet copies the bitcoin chain state into bitcoind's bind-mounted data
directory with a plain `docker cp`, which creates the files as root, while bitcoind runs as uid 1000.
A Linux host enforces that ownership, so bitcoind could not write its chain state and never became
ready; Docker Desktop does not enforce it, which is why the snapshot boot passed on macOS. A new
Clarinet patch chowns the data directory to 1000:1000 right after the copy.

A failed boot now prints the tail of Clarinet's output and every devnet container's exit state and
logs, without `DEBUG`. Before, the error pointed at "the clarinet output above", which was never
printed.
