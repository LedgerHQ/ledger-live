---
"ledger-live-desktop": minor
---

Add a desktop known devices store: a persisted `knownDevices` reducer (seeded on settings load from `lastSeenDevice` / `lastOnboardedDevice`, upserted from device sources, deduped per model id) using the shared `KnownDevice` shape, with WebHID serialization helpers for robust persistence.
