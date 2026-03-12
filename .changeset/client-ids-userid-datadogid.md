---
"@ledgerhq/client-ids": minor
---

Add UserId and DatadogId ID classes with redaction and export-rules. Extend identities store with userId/datadogId; add initFromPersisted, importFromLegacy, initFromScratch. Persistence and sync middleware use identities state. Trim DeviceId persistence allowlist.
