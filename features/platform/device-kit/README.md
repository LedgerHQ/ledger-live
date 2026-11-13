# @features/platform-device-kit

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

The Device Management Kit (DMK) integration shared by the device features.

## Exports

- `createDeviceActionStateMachine`: runs a DMK device action as an xstate actor, and outputs an
  `Either`: `Right(output)` once completed, `Left(error)` on a device action error.
- `DeviceActionStoppedError`: the `Left` of a device action that was stopped before
  its output. An actor failure becomes an `UnknownDAError` whose `cause` keeps the original value.
- `findLastConnectedDevice`: the most recent DMK session opened over USB (`wired`) or BLE, if any.
- `isDeviceLockedError`, `isDeviceDisconnectedError`, `isRefusedByUserError`: tell what a DMK error
  means, whether it comes tagged, as a status word, or nested in `error`, `originalError`, `cause`
  or `err` (cycles included). `isDeviceDisconnectedError` also matches transport disconnections
  (`DisconnectError`, `WebHidSendReportError`).
