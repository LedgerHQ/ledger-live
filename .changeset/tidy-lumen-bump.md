---
"ledger-live-desktop": minor
"live-mobile": minor
---

chore: bump the Lumen packages to the latest pinned set

`AddressInput` now accepts a `ReactNode` prefix, and `BaseInput` is no longer exported by Lumen. Both apps only consume Lumen internally, so their own public API is unchanged. The Lumen packages pin each other on exact versions, so they move together.
