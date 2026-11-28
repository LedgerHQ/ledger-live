# @domain/entity-device-os-update

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

The OS updates resolved for the connected device, and whether a backup of its apps and settings is
waiting to be restored.

## Exports

- `OsUpdateSchema`, `DeviceOsUpdateStateSchema`: the OS update and the stored state.
- `DeviceBackupSchema`: the apps and settings saved before an update.
- `RestoreResultSchema`, `RestoreStatus`: what a restore put back on the device.
- Their types: `OsUpdate`, `DeviceOsUpdateState`, `DeviceBackup`, `RestoreResult`, `RestoreStatus`. They
  have the shapes of the DMK types; `@features/platform-device-os-update` checks it at compile time.
- `deviceOsUpdateSlice`, with `setOsUpdates`, `clearOsUpdates` and `setHasBackup`. Its reducer is the
  default export; the apps register it as `deviceOsUpdate`.
- `selectOsUpdates`, `selectHasOsUpdates`, `selectHasBackup`.
- Mocks: `./schema.mock`, `./slice.mock`.

`@features/platform-device-os-update` resolves the updates and writes them here. The screens that
offer an update read them.
