---
"ledger-live-desktop": patch
"live-mobile": patch
---

chore: bump the Lumen catalog to design-core 0.1.25

`AddressInput` now accepts a `ReactNode` prefix, and `BaseInput` is no longer exported by Lumen. Both apps only consume Lumen internally, so their own public API is unchanged. The Lumen packages pin each other on exact versions, so they move together.
