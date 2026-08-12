---
"@ledgerhq/live-signer-zcash": patch
---

Report a real error when the coin being spent came from a V6 (NU6.3 / Ironwood) transaction and the installed Zcash app cannot read one.

The signer kit fails such a send before any APDU is exchanged, and its error reached Ledger Live as `new Error(details._tag)` — the whole diagnosis being `ZcashAppCommandError`, a tag a dozen unrelated causes share. It now rejects with `UnsupportedV6SourceTransaction`, carrying the kit's own message, which names the app version installed on the device. The kit error is matched on its error code or its tag, so a rename of either one on its own still reaches the mapping. Signing is untouched: the app rejected such a transaction before and after, producing no signature — only the reported error differs.
