---
"@ledgerhq/coin-tester-stacks": patch
---

fix: put the bitcoin snapshot in place before bitcoind starts, and print why the devnet failed to boot

Booting from the snapshot, Clarinet copied the bitcoin chain state into the bitcoind container with
`docker cp` after starting it. That raced bitcoind: on Linux, which enforces bind-mount ownership
unlike Docker Desktop, bitcoind (uid 1000) could not read the copied files and exited; and when it
had already begun its own chain state, the stacks-node's snapshot no longer matched its blocks
(`Non-contiguous header`, intermittent). A Clarinet patch now copies the snapshot on the host into
the bind-mounted data directory before the container is created, and makes it world-readable and
writable.

A failed boot now prints the tail of Clarinet's output and every devnet container's exit state and
logs, without `DEBUG`. Before, the error pointed at "the clarinet output above", which was never
printed.
