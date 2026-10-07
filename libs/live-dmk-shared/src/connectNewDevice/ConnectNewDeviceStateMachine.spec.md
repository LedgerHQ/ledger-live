# ConnectNewDeviceStateMachine

`ConnectNewDeviceStateMachine` drives the DMK-based connection to a device the
user has not connected before. It discovers devices, lets the user select one,
connects to it, and reports the result. Unlike `ConnectDeviceStateMachine`, it
does no known-device matching and does not reuse an existing session.

## State Diagram

```mermaid
stateDiagram-v2
  [*] --> Discovering

  Discovering --> Discovering: DevicesDiscovered
  Discovering --> Discovering: device not found delay elapsed
  Discovering --> Connecting: UserTapsDevice
  Discovering --> DiscoveryError: DiscoveryError

  DiscoveryError --> Discovering: Ignore, skipping failed transport
  DiscoveryError --> RetryDiscovery: Retry, when retry is available
  DiscoveryError --> Terminated: Close

  RetryDiscovery --> Discovering: retry succeeds
  RetryDiscovery --> Discovering: Ignore, skipping failed transport
  RetryDiscovery --> DiscoveryError: retry returns or throws an error
  RetryDiscovery --> Terminated: Close, dropping the retry

  Connecting --> Connected: DMK connect succeeds
  Connecting --> ConnectionError: DMK connect fails

  ConnectionError --> Connecting: Retry, with the same device
  ConnectionError --> Discovering: Ignore, to select another device
  ConnectionError --> Discovering: Close, same as ignore

  Connected --> Done: success delay elapsed

  Done --> [*]
  Terminated --> [*]
```

## Notes

- `Discovering` starts the discovery service and emits the device list.
  `scanningTransports` is the discovery service `transportIds` without the
  skipped transports.
- The device list keeps the order in which the devices were first discovered,
  so that a device does not move under the user's finger. When discovery no
  longer reports a device, the device stays at its position with
  `isAvailable: false` and has no `onSelect` callback. When discovery reports
  it again, it becomes available again at the same position. The injected
  `getDiscoveredDeviceKey` tells which discovered device is the same device
  from one discovery update to the next.
- Each entry into `Discovering` clears the device list, the selection and
  the errors, sets `showDeviceNotFound` to `false` and starts the device not
  found delay (`DEFAULT_DEVICE_NOT_FOUND_DELAY`, 5 s). When the delay elapses,
  `Discovering` is emitted again with `showDeviceNotFound: true`. Leaving
  `Discovering` cancels the delay.
- Discovery errors stop discovery. `retry` is only set when the error has a
  resolution that is not `"none"`. Ignoring a discovery error adds its
  `transportId` to `skipTransportIds`, then starts discovery again without that
  transport. A successful retry starts discovery again. A failed retry emits
  the returned error, or an unknown discovery error if the retry throws.
- The discovery error state has a `close` action for when the user closes its
  sheet. It moves to `Terminated`, also while a retry runs: the retry result is
  then dropped.
- `Connecting` stops discovery, then calls `dmk.connect` with the selected
  discovered device and the DMK session refresher disabled.
- A connection failure is mapped with `mapConnectionError` (for example BLE
  pairing refused, or pairing removed on the device) and emitted with `retry`
  and `ignore`. Retry connects again to the same device. Ignore goes back to
  `Discovering`, with the skipped transports kept, so that the user can select
  another device. Its `close` action does the same as ignore.
- Only the error states handle `close`. A late `close` from a sheet that closes
  after a retry or an ignore does nothing.
- `Connected` is the visible success state. After the success delay
  (`DEFAULT_SUCCESS_DELAY`, 1.5 s), the machine moves to `Done`. `Connected`
  and `Done` carry the connected device, so that the UI can show its transport.
- `Done` emits the `Done` UI state and calls `onConnected` one time with the
  DMK session, the connected device and the legacy compatibility fields.
- `Terminated` emits the `Terminated` UI state and calls `onClose` one time.
- `stop()` stops discovery and the timers, and calls neither `onConnected` nor
  `onClose`. If a connection succeeds after `stop()`, or if `stop()` runs during
  the success delay, the machine disconnects that session, because no caller
  received it.
- Both delays can be injected with `deviceNotFoundDelay` and `successDelay`.
