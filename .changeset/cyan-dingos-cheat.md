---
"ledger-live-desktop": patch
"@ledgerhq/hw-transport-node-hid-singleton": patch
---

Refactor on listen HID devices on LLD:

- make the listenDevices definition command into TS, and rename into listenToHidDevices
- transform the ListenDevices component (that was mainly a useEffect returning null) into a hook useListenToHidDevices
- add the types-devices lib into LLD
