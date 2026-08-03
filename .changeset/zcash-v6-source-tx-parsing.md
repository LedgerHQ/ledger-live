---
"@ledgerhq/hw-app-btc": patch
---

Fix Zcash sends failing before the device prompt when the coin being spent came from a V6-format transaction.

Spending a coin whose funding transaction is a V6 (NU7 / Ironwood) one failed immediately, with no review screen on the device and `getVarint called with unexpected parameters` in the logs. Like the V4 case, this is decided by which software created the funding transaction, so it looks intermittent while being deterministic.

`splitTransaction` recognized Zcash headers up to V5. A V6 header fell through to the pre-Overwinter layout, so the input count was read off the version group id — `0x98`, meaning 152 inputs — and the parser ran past the end of the buffer and threw before any APDU was built.

A V6 reuses the V5 header and transparent layout, so both are now read the same way. Its shielded section is not the same: ZIP-230 adds an Ironwood pool this parser does not model, and it is left unread rather than parsed as an Orchard bundle would be. Callers needing it work from the raw bytes, which is what the Zcash chain adapter already attaches and what the signer kit chunks for the device.
