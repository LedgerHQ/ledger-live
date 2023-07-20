---
"@ledgerhq/live-common": patch
---

feat: new get latest available firmware action and hook

Created a getLatestAvailableFirmwareAction and a React adapter with a hook: useGetLatestAvailableFirmware
The need came from having a version of a "get latest available firmware" function that is resilient
to Transport race conditions (by catching and retrying).

Implemented using the new device SDK paradigm.

Also now propagating the following informations:

- does the current error that occurred in a task triggered an attempt to retry the task ?
- what kind of locked device error occurred: 0x5515 (LockedDeviceError) or device "unresponsive"
