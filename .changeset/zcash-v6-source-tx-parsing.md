---
"@ledgerhq/hw-app-btc": patch
---

Fix Zcash sends failing before the device prompt when the coin being spent came from a V6-format transaction.

Spending a coin whose funding transaction is a V6 (NU7 / Ironwood) one failed immediately, with no review screen on the device and `getVarint called with unexpected parameters` in the logs. Like the V4 case, this is decided by which software created the funding transaction, so it looks intermittent while being deterministic.

`splitTransaction` recognized Zcash headers up to V5. A V6 header fell through to the pre-Overwinter layout, so the input count was read off the version group id — `0x98`, meaning 152 inputs — and the parser ran past the end of the buffer and threw before any APDU was built.

A V6 reuses the V5 header and transparent layout, so both are now read the same way. Its shielded section is not the same: ZIP-229 adds an Ironwood pool this parser does not model, and it is left unread rather than parsed as an Orchard bundle would be. Callers needing it work from the raw bytes, which is what the Zcash chain adapter already attaches and what the signer kit chunks for the device.

Two guards keep the V6 path from failing quietly. `splitTransaction` now rejects a V6 whose version group id is not the `0xd884b698` that ZIP-229 mandates, before the fixed-offset header read commits to the V6 layout, and only claims the V6 header for Zcash — a V6 hex passed with other `additionals` falls through to the legacy layout whole instead of consuming a version group id nobody validated. `getTrustedInput` throws on a V6 rather than emitting the three-counter shielded frame of a V4/V5: a V6 needs a fourth counter for its Ironwood actions, so the old frame would have left the device reading that counter out of the trailing data and deriving a wrong transaction id.
