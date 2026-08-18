---
"ledger-live-desktop": minor
---

Fix the receive flow reporting a verification error (visible on Polkadot) while the address confirmation succeeded on the device: re-renders no longer start a concurrent `confirmAddress` call, and a late result can no longer overwrite a successful verification.
