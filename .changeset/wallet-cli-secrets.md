---
"@ledgerhq/wallet-cli": minor
---

Add `secrets` command group for hardware-backed encryption: `init`, `encrypt`, `decrypt`, `keys`, `destroy`.
Secrets are encrypted with AES-256-GCM keys derived from a trustchain managed by the Ledger Key Ring Protocol.
