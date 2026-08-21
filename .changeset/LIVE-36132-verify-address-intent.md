---
"@features/platform-verify-address-intent": minor
"ledger-live-desktop": minor
---

Add `@features/platform-verify-address-intent`, a Device Intent that verifies a receive address on the device Secure Screen, and wire it to the desktop Pay tab Verify CTA.

The host injects a family-agnostic `startAddressVerification` (generic `getAddress` over the DIE DMK transport). When `ldmkTransport` is off, Verify opens the classic Receive modal. Address comparison is encoding-aware (case-insensitive for hex, exact otherwise). `verified` / `cancelled` / `unsupported` return to the request summary; `mismatch` closes the flow.

Generalize desktop `InfoState` by adding a full-width `content` slot and optional `backgroundTone` support for the `spot` preset.