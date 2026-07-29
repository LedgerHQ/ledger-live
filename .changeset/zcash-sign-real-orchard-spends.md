---
"@ledgerhq/live-signer-zcash": patch
---

Take `@ledgerhq/device-signer-kit-zcash` 0.4.3, which asks the device for a spend-auth signature only on real Orchard spends. The dummy padding spend of a single-spend bundle is self-signed host-side by the PCZT IO finalizer, so signing it on-device too made the device return one signature more than the finalizer had unsigned actions, and the transaction was rejected. Sending from a shielded balance with a single note now goes through.
