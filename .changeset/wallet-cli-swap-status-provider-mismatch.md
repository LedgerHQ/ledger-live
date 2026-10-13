---
"@ledgerhq/wallet-cli": patch
---

Fail `swap status` when `--provider` does not own the swap id.

The swap API answers `unknown` for a swap id queried under the wrong provider, and the command used to print that as a successful `UNKNOWN` status. It now exits with code 1, and the error names the other allowed provider(s) that know the swap id, so the command can be re-run with the right `--provider`.

A swap that its own provider still reports as `unknown` (for example, not yet registered by the partner) now also exits with code 1 instead of printing `UNKNOWN`. Callers that poll `swap status` should treat exit code 1 as "maybe not registered yet, retry" rather than a permanent failure.
