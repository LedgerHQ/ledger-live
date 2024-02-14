---
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

- Fixed bad conditional branching for `listAppsUseCase`: list apps v1 and v2 were switched
  - Added unit tests for that.
- Fixed `forceProvider` parameter missing in `listAppsV2` call in `listAppsUseCase`. It was resulting in "not found entity" errors regardless of the selected "My Ledger" provider in Ledger Live.
  - Added a stricter typing (the parameter is now always required)
- Fixed bad error remapping for `HttpManagerApiRepository.getCurrentFirmware` which should throw a `FirmwareNotRecognized` in case of a `404`.
  - Added a unit test for that.
- Added full unit testing coverage of `HttpManagerApiRepository`.
