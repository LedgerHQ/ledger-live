---
"@ledgerhq/wallet-cli": minor
---

Add session layer: `account discover` now persists found accounts to `~/.local/state/ledger-wallet-cli/session.yaml`. All `--account` flags accept session labels (e.g. `ethereum-1`) in addition to full descriptors. New `session view` and `session reset` commands.
