---
"@ledgerhq/types-devices": major
---
Remove redundant device and transport exports.

| Removed exports                                            | Migration guidelines                                                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Transport`, `Observer`, `DescriptorEvent`, `Subscription` | For LedgerJS usage, import the corresponding types from `@ledgerhq/hw-transport`. Note that LedgerJS is deprecated; migrate to Device Management Kit when possible. |
| `BluetoothInfos`                                           | Import `BluetoothInfos` from `@ledgerhq/devices`, where it remains available. No migration is required when using Device Management Kit.                            |
| `DevicesWithTouchScreen`                                   | No replacement is planned yet.                                                                                                                                      |
| `ChargingModes`, `BatteryStatusFlags`                      | No replacement is planned yet. Battery-related operations are supported by Device Management Kit.                                                                   |
