---
"@ledgerhq/client-ids": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Gate the device-ids push middleware behind the `analyticsOptIn` feature flag in addition to the user analytics consent. Device IDs are now only sent to `/v2/pushdevices` when the FF is enabled AND the user has opted in.
