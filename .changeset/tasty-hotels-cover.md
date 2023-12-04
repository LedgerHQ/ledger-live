---
"@ledgerhq/devices": minor
---

Feat: cleaner refactoring of BLE and USB HID frames encoding/decoding

- Cleans up + documentation + tracing/logs + unit tests of BLE frame encoding and decoding:
  `receiveAPDU` and `sendAPDU`
- Cleans up + documentation + tracing/logs + unit tests of HID USB frame encoding and decoding:
  `hid-framing`
