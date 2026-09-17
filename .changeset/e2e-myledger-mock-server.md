---
"@ledgerhq/live-e2e-shared": patch
---

Fix the mock server device presets for the Nano models, and add a way to seed installed apps.

`device_type` has to be the camelCase model id the transport resolves, so `nanox`, `nanosp` and `nanos` never carried a model: the device connected, but the manager screen rendered nothing behind a buy-device dialog.

`resolveInstalledApps` looks each install hash up in the manager API for the device under test. An app declared without a hash reads as sideloaded and is never reported as installed, and hashes are published per target id and firmware, so they cannot be carried from one model to another.
