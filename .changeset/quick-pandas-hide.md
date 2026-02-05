---
"live-mobile": patch
"@ledgerhq/live-common": patch
"@ledgerhq/live-dmk-mobile": patch
---

Remove legacy React Native HID transport code and make DMK always enabled

Since the `ldmkTransport` feature flag is now enabled by default in all environments, the Device Management Kit (DMK) transport is always used. This removes all dead code related to the legacy HID transport:

- Removed `@ledgerhq/react-native-hid` dependency from LLM
- Removed `getHidTransport.ts` (legacy HID transport selector)
- Removed `useLdmkFeatureFlagInitiallyEnabled` hook from live-common
- Removed `dmkEnabled` prop from `DeviceManagementKitProvider`
- Removed `useDeviceManagementKitEnabled` hook
- Removed `DeviceManagementKitHIDTransport.listen()` method (discovery now handled by new hook)

New additions:
- Added `useHidDevicesDiscovery` hook in live-dmk-mobile for direct DMK-based USB device discovery
- Added `HIDDiscoveredDevice` type

Note: The `@ledgerhq/react-native-hid` package itself (in `libs/ledgerjs/`) is not removed — it will be deprecated in a separate PR.
