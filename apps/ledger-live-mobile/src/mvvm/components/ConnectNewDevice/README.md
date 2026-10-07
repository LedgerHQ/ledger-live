# ConnectNewDevice

Pairs a device that the app does not know yet. It discovers devices, lets the user select one and connects to it.

The component runs `connectNewDevice` from `@ledgerhq/live-dmk-mobile`. It shows no top bar and does no navigation: the caller reacts to its callbacks.

## Props

| Prop                  | When the component calls it                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onConnected(result)` | One time, after the success view. `result` contains the DMK session and the connected device, which is already saved as the last connected device and as a known device. |
| `onDeviceNotFound()`  | Optional. The user pressed "I don't see my device". This button shows after a delay, and only when the caller gives this prop.                    |
| `onClose()`           | The user closed a discovery error or the unknown error. The flow is over.                                                                         |

`delays` (optional) sets the `deviceNotFound` and `success` delays, in ms. The component reads them on mount only.

## Device list

The devices stay in the order in which they were first discovered, so that a row does not move when the user taps it. A device that is no longer discovered stays at its position with a disabled card and button. It becomes selectable again when it is discovered again.

## Errors

Discovery, connection and unknown errors show in a bottom sheet, over the last view. The sheet uses the shared error components in [`../DeviceConnection/`](../DeviceConnection/).

- Closing a discovery error ends the flow, and the component calls `onClose`.
- Closing a connection error takes the user back to the device list.
- Closing the unknown error calls `onClose`.

## Try it

Settings > Debug > Features > Device Intent Executor > Connect New Device renders the component and logs each callback call.

## Links

- [ADR: Connect New Device component](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7579926586/ADR+Connect+New+Device+component+connectivity+screen)
