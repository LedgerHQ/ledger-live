---
"ledger-live-desktop": patch
---

Fix Ledger Sync being wiped on every launch when Password Lock is enabled. `app.trustchain` is an encrypted db path, so before unlock it read back as a ciphertext string; importing it regenerated member credentials, nulled the trustchain, and persisted that fresh state over the encrypted blob in plaintext. The import is now skipped while the value is still a string, and trustchain writes are suppressed while the app is locked.
