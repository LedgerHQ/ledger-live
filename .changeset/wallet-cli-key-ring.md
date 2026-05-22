---
"@ledgerhq/wallet-cli": minor
---

Add `ring` command group: a developer surface to your Ledger Key Ring (LKRP) for trustless, hardware-rooted encryption of files and text.

Commands: `ring init`, `ring encrypt`, `ring decrypt`, `ring keys`, `ring destroy`. Files via `-i/-o`, text via stdin/stdout. Keys are AES-256-GCM, derived per-name with HKDF-SHA256 from the LKRP-shared root key; the ring is recoverable from your Ledger.
