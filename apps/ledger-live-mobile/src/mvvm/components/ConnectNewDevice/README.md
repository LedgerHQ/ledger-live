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

When a USB device is available, only the available USB devices show. Otherwise, only the devices on the other transports show. The user plugged in that device, and the same device can also be discovered over Bluetooth.

## Errors

Discovery, connection and unknown errors show in a bottom sheet, over the last view. The sheet uses the shared error components in [`../DeviceConnection/`](../DeviceConnection/).

- Closing a discovery error ends the flow, and the component calls `onClose`.
- Closing a connection error takes the user back to the device list.
- Closing the unknown error calls `onClose`.

## Show a state from a parent

`ConnectNewDeviceView` shows a UI state that it gets from a parent, without the view model. The parent gives `state`, `platform` and these props:

- `lastNonErrorState`: the view under the error sheet. Use `isErrorState` to keep it up to date.
- `onCloseErrorSheet`: called when the user closes the error sheet, and also when `state` leaves an error.
- `onDeviceNotFound` (optional): as in the props above.

`ConnectNewDeviceView` has no horizontal padding: the parent sets it. `ConnectNewDevice` gives it a padding of 16.

## Show one state in a bottom sheet

`DiscoveringView`, `ConnectingView` and `ConnectedView` each show one state that is not an error. The parent gives their layout in the `Layout` prop:

- `StateLayout`, used by `ConnectNewDeviceView`, fills the screen: the device list scrolls and the footer stays at the bottom.
- `SheetStateLayout` stacks everything for a bottom sheet that sizes to its content and scrolls by itself.

The parent then shows the errors itself, for example inline with the components of [`../DeviceConnection/`](../DeviceConnection/).

## Try it

Settings > Debug > Features > Device Intent Executor > Connect New Device renders the component and logs each callback call.

## Links

- [ADR: Connect New Device component](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7579926586/ADR+Connect+New+Device+component+connectivity+screen)
