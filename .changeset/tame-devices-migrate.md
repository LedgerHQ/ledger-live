---
"@features/platform-device-action-content": minor
"live-mobile": patch
"ledger-live-desktop": patch
"@support/jest-features-flow": patch
---

Migrate the DeviceActionContent component into a new `@features/platform-device-action-content` package so DDD flows can render it, decoupling it from the `DeviceModelId` enum. Also render Lumen `Tag` labels and `Banner` titles as text in the shared web/native passthrough test stubs.
