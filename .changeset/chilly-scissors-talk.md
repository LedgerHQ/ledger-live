---
"@ledgerhq/hw-transport-node-hid-singleton": patch
"@ledgerhq/hw-transport-node-hid-noevents": patch
"@ledgerhq/hw-transport": patch
"ledger-live-desktop": patch
"@ledgerhq/live-common": patch
---

Fix: HID USB reconnection on LLD during the sync onboarding

- Refactoring of the disconnect after inactivity of the transport implementation
  hw-transport-node-hid-singleton
- Better logs and documentation
