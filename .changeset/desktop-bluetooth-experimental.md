---
"ledger-live-desktop": minor
"@ledgerhq/live-dmk-desktop": minor
---

Experimental Bluetooth connection on desktop (Settings > Experimental > Bluetooth connection, restart required) for Ledger Flex, Stax and Nano X/Gen5, through the DMK Web BLE transport. The user picks the device in an in-app list the first time; afterwards only that remembered device is selected automatically. Windows and Linux pairing codes are confirmed in an in-app dialog, never automatically. Live App webviews cannot request Bluetooth devices. OS updates and repair require USB. `DeviceManagementKitTransport.open` is single-flight and targets the requested device, which fixes a concurrent-connect failure on Bluetooth. Set `DEBUG_BLE` to show an APDU activity badge.
