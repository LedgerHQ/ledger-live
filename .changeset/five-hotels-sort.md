---
"@ledgerhq/live-common": major
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/web-tools": patch
"@ledgerhq/live-cli": patch
---

- Refactoring of `getVersion`
  - moved entrypoint to `@ledgerhq/live-common/device/use-cases/getVersionUseCase`
  - moved logic to live-common/device-core
  - pulled out parsing function in `parseGetDeviceVersionResponse.ts`, reused that same parsing function in legacy `deviceSDK/commands/getVersion.ts`
  - added unit tests for `parseGetDeviceVersionResponse`, removed duplicated tests of parsing logic from `deviceSDK`
  - moved out functions and tests for the version checks `isHardwareVersionSupported`, `isBootloaderVersionSupported`
- Refactoring of `getDeviceName`
  - moved entrypoint to `@ledgerhq/live-common/device/use-cases/getDeviceNameUseCase`
  - moved logic to live-common/device-core
  - pulled out parsing function in `parseGetDeviceNameResponsed.ts`
  - added unit tests for `parseGetDeviceVersionResponse`, removed duplicated tests of parsing logic from `deviceSDK`
