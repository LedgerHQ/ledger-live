---
"ledger-live-desktop": patch
"@ledgerhq/client-ids": patch
---

Fix desktop userId migration so returning users keep their identity after upgrade. When `app.identities` was created by the deviceId rollout (deviceIds only, no userId), boot now recovers the legacy userId from `app.user`/localStorage instead of generating a new one, which had made returning users appear as new in Segment and Braze. `shouldUsePersistedId` is now exported from `@ledgerhq/client-ids/store`.
