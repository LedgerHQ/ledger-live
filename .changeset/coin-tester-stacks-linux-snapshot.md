---
"@ledgerhq/coin-tester-stacks": patch
---

fix: let bitcoind own its snapshot data on Linux, and print why the devnet failed to boot

Booting from the snapshot, Clarinet copies the bitcoin chain state into bitcoind's bind-mounted data
directory with a plain `docker cp`, which does not give the files an owner bitcoind (uid 1000) can
use. A Linux host enforces ownership, so bitcoind could not read its own `settings.json` and exited;
Docker Desktop does not enforce it, which is why the snapshot boot passed on macOS. A new Clarinet
patch makes the extracted snapshot world-readable and writable before the copy, which keeps mode
bits, so the files are usable the moment they land.

A failed boot now prints the tail of Clarinet's output and every devnet container's exit state and
logs, without `DEBUG`. Before, the error pointed at "the clarinet output above", which was never
printed.
