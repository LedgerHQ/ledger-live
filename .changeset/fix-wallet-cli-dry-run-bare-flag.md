---
"@ledgerhq/wallet-cli": patch
---

Fix bare boolean flags (`--dry-run`, `--rbf`, `--verify`) being silently ignored. Previously `--dry-run` without an explicit value routed the send command to the full sign-and-broadcast path; now it correctly activates the dry-run path. Root cause: missing `argumentKind: "flag"` on all boolean options.
