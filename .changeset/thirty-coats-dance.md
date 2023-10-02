---
"@ledgerhq/hw-transport-node-hid-singleton": minor
"@ledgerhq/hw-transport-node-hid-noevents": minor
"@ledgerhq/react-native-hw-transport-ble": minor
"@ledgerhq/hw-transport": minor
"@ledgerhq/live-common": patch
---

feat: usage of new tracing system

The tracing helps keeping a context (for ex a `job id`) that is propagated to other logs,
creating a (simple) tracing span
