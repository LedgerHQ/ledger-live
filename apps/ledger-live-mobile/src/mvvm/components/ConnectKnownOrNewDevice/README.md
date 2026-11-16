# ConnectKnownOrNewDevice

The device section of My Wallet. It lists the known, connected and discovered devices, connects to one, and pairs a new device in its Add mode.

The component runs `connectKnownOrNewDevice` from `@ledgerhq/live-dmk-mobile`. The rules of the list and of each state are in the [state machine spec](../../../../../../libs/live-dmk-shared/src/connectKnownOrNewDevice/ConnectKnownOrNewDeviceStateMachine.spec.md). The component has no end and does no navigation: it stays on screen, and the caller reacts to its callbacks.

## Props

| Prop                                | What it does                                                                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onConnected(result, { isNewDevice })` | Called each time the user connects a device, also a device that was already connected. The device is already saved. `isNewDevice` is `true` when the device was not known before this connection. |
| `onAddModeChange(isAdding)`         | Called when the Add mode starts and stops. The caller hides the rest of its screen during the Add mode.                                                                             |
| `isPaused`                          | Stops discovery while the caller uses the device.                                                                                                                                   |
| `onDeviceNotFound()`                | Optional. Called by the "I don't see my device" button of the Add mode. This button shows only when the caller gives this prop. The component stays in the Add mode.                 |
| `delays`                            | Optional. The delay of the waiting hint (`deviceNotFound`) and the delays of the Add mode (`connectNewDevice`), in ms. The component reads them on mount only.                      |
| `children`                          | Optional. Shown under the list, for example the Explore row of My Wallet.                                                                                                            |

## Discovery

Discovery stops while `isPaused` is `true`, while the screen is not focused, and while the app is in the background. After each `onConnected`, discovery stays stopped until one of these values changes back: `isPaused` becomes `false`, or the screen is focused again, or the app comes back to the foreground.

## Saving and removing a device

Each `onConnected` saves the device with `useSaveConnectedDevice`: it becomes the last connected device and a known device, with its last use time. It also turns off the read-only mode.

Removing a known device removes it from the known devices and from the legacy BLE devices, and clears the last connected device when it is the removed device.

## Add mode

The Add mode shows the `ConnectNewDevice` views with the UI state of the embedded flow, under a close bar. The close button and the Android back button go back to the list.

## Errors

Discovery, connection and unknown errors show in a bottom sheet over the list, with the shared error components in [`../DeviceConnection/`](../DeviceConnection/). Closing a discovery or connection error goes back to the list. Closing the unknown error starts the component again, with a new state machine.

## Links

- [ADR: Connect Known Or New Device component](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7721091204)
