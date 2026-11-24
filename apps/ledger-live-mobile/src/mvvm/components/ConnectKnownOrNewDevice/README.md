# ConnectKnownOrNewDevice

The device section of My Wallet. It lists the known, connected and discovered devices, connects to one, and pairs a new device in its Add mode.

The component runs `connectKnownOrNewDevice` from `@ledgerhq/live-dmk-mobile`. The rules of the list and of each state are in the [state machine spec](../../../../../../libs/live-dmk-shared/src/connectKnownOrNewDevice/ConnectKnownOrNewDeviceStateMachine.spec.md). The component has no end and does no navigation: it stays on screen, and the caller reacts to its callbacks.

## Props

| Prop                                | What it does                                                                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sourceFlow`                        | The flow that shows the component, for example `my_wallet`. The component adds it to all its analytics events, also in the Add mode. |
| `onConnected(result)`               | Called each time the user connects a device, also a device that was already connected. The device is already saved.                                                                  |
| `onAddModeChange(isAdding)`         | Called when the Add mode starts and stops. The caller hides the rest of its screen during the Add mode.                                                                             |
| `isPaused`                          | Stops discovery while the caller uses the device.                                                                                                                                   |
| `onDeviceNotFound()`                | Optional. Called by the "I don't see my device" button of the Add mode. This button shows only when the caller gives this prop. The component stays in the Add mode.                 |
| `onAddDevice(hasDevices)`           | Optional. Replaces the Add mode: the Add buttons call it instead. `hasDevices` is `false` when the list is empty. See [Add mode](#add-mode).                                         |
| `delays`                            | Optional. The delay of the waiting hint (`deviceNotFound`) and the delays of the Add mode (`connectNewDevice`), in ms. The component reads them on mount only.                      |
| `listFooter`                        | Optional. Shown right under the list, only when the list has devices, for example the Explore row of My Wallet.                                                                      |
| `children`                          | Optional. Shown under the list, also when it is empty.                                                                                                                               |

## Device list

Each row shows the packshot, the name and the status of the device: Not connected, Available or Connected. The order comes from the state machine.

- Tapping a row connects the device. The rows have actions only in the list state: while the component waits for a device, connects or shows an error, they are for display only.
- The ⋮ button opens a sheet with Disconnect for a connected device and Remove for a known Bluetooth device. A row with neither action has no ⋮ button.
- The list shows 3 devices, then "Show all N devices". "Show less" collapses it again.
- With no device, the list shows the "Add a Ledger device" row instead of the Add link.

## Waiting and connecting

Tapping a device that is not connected shows a sheet over the list: "power on and unlock" while the component waits for the device, then the connecting view. After a delay, the waiting sheet shows a hint that opens the Add mode. Closing the sheet goes back to the list.

## Discovery

Discovery stops while `isPaused` is `true`, while the screen is not focused, and while the app is in the background. While discovery is stopped, the rows and the Add button show greyed out.

`onConnected` does not stop discovery. A caller that uses the device after `onConnected` sets `isPaused` to `true` or leaves the screen.

## Saving and removing a device

Each `onConnected` saves the device with `useSaveConnectedDevice`: it becomes the last connected device and a known device, with its last use time. It also turns off the read-only mode.

Removing a known device removes it from the known devices and from the legacy BLE devices, and clears the last connected device when it is the removed device.

## Add mode

The Add mode shows the `ConnectNewDevice` views with the UI state of the embedded flow, under a close bar. The close button and the Android back button go back to the list.

With `onAddDevice`, the component does not open the Add mode. The Add link, the "Add a Ledger device" row and the hint of the waiting sheet call `onAddDevice` instead. The hint closes the waiting sheet first.

## Errors

Discovery, connection and unknown errors show in a bottom sheet over the list, with the shared error components in [`../DeviceConnection/`](../DeviceConnection/). Closing a discovery or connection error goes back to the list. Closing the unknown error starts the component again, with a new state machine.

## Analytics

The component sends its events itself, with the Device UX V2 helpers of the DIE and the `sourceFlow` of the caller. The events and their properties are in the [tracking plan](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7620034573).

- The views send the pages and the buttons of their state: `device_selected` with `deviceStatus` and `isNewDevice`, Add, "Add a Ledger device", Show all and Show less, the `Drawer - Device Menu` page with Disconnect and Remove, the waiting and connecting pages, the waiting hint, the error sheets and the close bar of the Add mode.
- The connecting sheet sends `device_connecting` at each connection from the list, after its page.
- Closing the waiting sheet, the connecting sheet or an error sheet sends `deviceflow_aborted` or `deviceflow_failed`, with the error when one shows. The sheets also close when the screen loses focus. The `Close` button of an error sheet is sent only when the user presses it. "Add a Ledger device" in the waiting hint sends no outcome: the attempt goes on in the Add mode.
- A sheet renders its content through a portal, outside the `DeviceIntentTrackingProvider` of the component, so each sheet provides the tracking context again inside.
- The view model sends `device_connected` for a new connection, before it saves the device. A tap on a connected device reuses its session and sends none.
- In the Add mode, `ConnectNewDeviceView` sends the events of the connectivity screen (see the [ConnectNewDevice README](../ConnectNewDevice/README.md#analytics)), but not the outcome. `useConnectKnownOrNewDeviceTracking` sends it when the Add mode ends before a connection, with Close, Android Back or an unmount of the list: `deviceflow_aborted`, or `deviceflow_failed` with the error that shows. After a fatal error, the unknown error sheet over the list sends it.

## Try it

Settings > Debug > Features > Device Intent Executor > Connect Known Or New Device renders the component with an `isPaused` switch and an "Auto pauses on connect" switch (off by default: when it is on, `onConnected` sets `isPaused` to `true`), and logs each callback call. With the mock server, it lists the BLE and USB mock devices.

## Links

- [ADR: Connect Known Or New Device component](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7721091204)
