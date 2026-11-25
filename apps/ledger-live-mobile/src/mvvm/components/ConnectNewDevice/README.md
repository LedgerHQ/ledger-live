# ConnectNewDevice

Pairs a device that the app does not know yet. It discovers devices, lets the user select one and connects to it.

The component runs `connectNewDevice` from `@ledgerhq/live-dmk-mobile`. It shows no top bar and does no navigation: the caller reacts to its callbacks.

## Props

| Prop                  | When the component calls it                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sourceFlow`          | Not a callback. The flow that shows the component, for example `onboarding`. The component adds it to all its analytics events. |
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

## Analytics

The component sends its events itself, with the Device UX V2 helpers of the DIE (`../DeviceIntentExecutor/utils/trackDeviceIntent.ts`). The events and their properties are in the [tracking plan](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7620034573).

- The views send the pages and the buttons of their state: the `Connect Device - Discovering`, `Connecting` and `Connected` pages, `device_selected`, "I don't see my device", and the pages and buttons of the error sheet.
- `useConnectNewDeviceTracking`, called by the view model, sends the flow events: `device_prompted` once discovery runs, `device_connecting` at each connection, and `deviceflow_aborted` or `deviceflow_failed` when the flow unmounts before a connection. With `reportsOutcome: false`, it sends no outcome: the Add mode of the device list passes it, because the device list sends the outcome.
- The view under an error sheet sends its page again once the sheet closes. The `Close` button of an error sheet is sent only when the user presses it, not when the sheet closes for another reason.
- The view model sends `device_connected`, before it saves the device.
- `isNewDevice` is `true` when the device is not in the known devices (`useIsNewDevice`). It goes on the events about one device. The view model gives the view `checkIsNewDevice`, the function that tells it.
- `ConnectNewDeviceView` reads `sourceFlow` from `DeviceIntentTrackingProvider`. A parent that shows the view gives this provider, calls `useConnectNewDeviceTracking` in its view model and gives `checkIsNewDevice`, as the Add mode of `ConnectKnownOrNewDevice` does. So the events are the same in the Add mode of the device list.

## Try it

Settings > Debug > Features > Device Intent Executor > Connect New Device renders the component and logs each callback call.

## Links

- [ADR: Connect New Device component](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7579926586/ADR+Connect+New+Device+component+connectivity+screen)
