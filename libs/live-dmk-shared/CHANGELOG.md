# @ledgerhq/live-dmk

## 0.37.0-next.0

### Minor Changes

- [#22763](https://github.com/LedgerHQ/ledger-live/pull/22763) [`6b445da`](https://github.com/LedgerHQ/ledger-live/commit/6b445da2f92d7c630424faa7cc31a01bc67db0b9) Thanks [@michalmisiejuk-ext-collab](https://github.com/michalmisiejuk-ext-collab)! - Run device commands against Speculos when `SPECULOS_API_PORT` is set, with stable exit codes when the emulator is unreachable. `live-dmk-shared` now owns the Speculos target parsing and transport factory shared with `live-dmk-desktop`

- [#23693](https://github.com/LedgerHQ/ledger-live/pull/23693) [`bfaac14`](https://github.com/LedgerHQ/ledger-live/commit/bfaac14201bb12b1f4b6e6a6d68ab4a0daa55b5c) Thanks [@sarneijim](https://github.com/sarneijim)! - Close a device session that connects after the connection attempt is cancelled

- [#23288](https://github.com/LedgerHQ/ledger-live/pull/23288) [`6ea7918`](https://github.com/LedgerHQ/ledger-live/commit/6ea791860eef5b92cc6041ba171e8846e88ef2c8) Thanks [@benruseau](https://github.com/benruseau)! - Plug the OS Update Orchestrator into My Ledger on mobile, behind the `ldmkOsUpdates` feature flag.

  - Connecting to My Ledger resolves the OS update path and stores the updates in a new `osUpdate` slice, while the connect bottom sheet stays in its loading state. A resolve failure still lands on My Ledger.
  - The OS update banner (portfolio and My Ledger) is driven by that slice and gated by device model, firmware version and USB/BLE connection. From the portfolio, it redirects to My Ledger, which reconnects the device and opens the What's new page through the `firmwareUpdate` param.
  - Confirming What's new starts the orchestrator. Once the updates are applied the slice is cleared, and a cancel or a crash reconnects through My Ledger, which resolves the path again.
  - `@ledgerhq/live-dmk-mobile` adds `getActiveConnectedDevice`, which returns the connected device of the session the transports are using, as the DMK can hold several sessions at once.
  - `@ledgerhq/live-dmk-shared` exports the `OsUpdate` type.
  - `@ledgerhq/live-common` adds an optional `onCompleted` callback to `OsUpdatesOrchestratorComponent`.

- [#23313](https://github.com/LedgerHQ/ledger-live/pull/23313) [`b977dbb`](https://github.com/LedgerHQ/ledger-live/commit/b977dbb2d8d6459295210b491b33af6e8bace1da) Thanks [@benruseau](https://github.com/benruseau)! - OS updates on mobile (`ldmkOsUpdates`): run the orchestrator from the bootloader sheet in My Ledger, and show a "Backup found" banner to restore or delete the backup left by an interrupted update. `live-dmk-shared` now exports `hasAnythingToRestore`.

- [#23375](https://github.com/LedgerHQ/ledger-live/pull/23375) [`77bc92f`](https://github.com/LedgerHQ/ledger-live/commit/77bc92ff77d029d570f7b2553919222ee0e598ca) Thanks [@benruseau](https://github.com/benruseau)! - Add logs to the OS updates state machines

### Patch Changes

- Updated dependencies [[`6ba7d71`](https://github.com/LedgerHQ/ledger-live/commit/6ba7d7194f8f8e3c96303537ccdf944ac7bf53a7), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359)]:
  - @domain/entity-client-identity@0.4.0-next.0
  - @ledgerhq/types-devices@7.2.0-next.0

## 0.36.0

### Minor Changes

- [#23220](https://github.com/LedgerHQ/ledger-live/pull/23220) [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Support protected Speculinho sessions in E2E. Speculos transports take the session's `bearerToken` (`SpeculosHttpTransportOpts`, `SpeculosSessionTarget`, the mobile `SpeculosTarget`; `DeviceManagementKitTransportSpeculos` and the desktop transport default to `SPECULOS_SESSION_TOKEN`) and keep a separate DMK per token. E2E acquires sessions with `protected: true` and authenticates every operator and Speculos request; the mobile e2e bridge passes the token to the app and now requires a per-run connection token. Bumps `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

## 0.36.0-next.0

### Minor Changes

- [#23220](https://github.com/LedgerHQ/ledger-live/pull/23220) [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Support protected Speculinho sessions in E2E. Speculos transports take the session's `bearerToken` (`SpeculosHttpTransportOpts`, `SpeculosSessionTarget`, the mobile `SpeculosTarget`; `DeviceManagementKitTransportSpeculos` and the desktop transport default to `SPECULOS_SESSION_TOKEN`) and keep a separate DMK per token. E2E acquires sessions with `protected: true` and authenticates every operator and Speculos request; the mobile e2e bridge passes the token to the app and now requires a per-run connection token. Bumps `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

## 0.35.0

### Minor Changes

- [#22776](https://github.com/LedgerHQ/ledger-live/pull/22776) [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add the connectNewDevice state machine. It discovers devices, lets the user select one, connects to it, and reports the result, with a device not found delay and a success delay. `DeviceDiscoveryService` now exposes the `transportIds` it discovers on.

- [#22599](https://github.com/LedgerHQ/ledger-live/pull/22599) [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add failureType and subError properties to Device Intent Executor deviceflow_failed and deviceflow_aborted events

- [#23178](https://github.com/LedgerHQ/ledger-live/pull/23178) [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb) Thanks [@benruseau](https://github.com/benruseau)! - Add the OS updates orchestrator React layer: a generic `OsUpdatesOrchestratorComponent` and `useOsUpdatesOrchestrator` hook in live-common that render platform-injected components for each step

  Add the mobile pre-checks, create backup, apply updates and restore backup components, and persist the device backup in the app storage

  Use the real components in the OS updates orchestrator debug screen

  Fix the OS updates apply step after a bootloader recovery: when the device comes back on an OS, install the first update of the resolved path from its OSU firmware instead of its final firmware, which skipped an update

- [#23121](https://github.com/LedgerHQ/ledger-live/pull/23121) [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add the optional `filterListedDevices` input to the connectNewDevice state machine. It selects the listed devices that `Discovering` shows, and a hidden device keeps its position in the list.

- [#22995](https://github.com/LedgerHQ/ledger-live/pull/22995) [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The connectNewDevice `Connected` and `Done` UI states now carry the connected `device`, so that the UI can show the transport that was used.

- [#22765](https://github.com/LedgerHQ/ledger-live/pull/22765) [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract the device discovery service and the connectivity types shared by device connection flows into a `deviceConnectivity` folder. The discovery, connection and unknown error UI states now use the shared `ConnectivityUIStateTypes` enum. `ConnectDeviceUIStateTypes` becomes a const object that includes these shared members, so type positions use `typeof ConnectDeviceUIStateTypes.X` or the new `ConnectDeviceUIStateType` type. The device type moves to the shared part as `Device`, and connectDevice keeps `KnownDevice` as an alias of it. connectDevice behaviour is unchanged.

- [#22847](https://github.com/LedgerHQ/ledger-live/pull/22847) [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add `connectNewDeviceUseCase`, which exposes the connectNewDevice state machine as an `Observable` of UI states, and the mobile `connectNewDevice`, which discovers on RN_BLE and Speculos on iOS and also on RN_HID on Android.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Keep the DMK firmware distribution salt in sync with the user ID of the identities store, so DMK flows follow the progressive OS rollout on desktop and mobile

- [#22846](https://github.com/LedgerHQ/ledger-live/pull/22846) [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b) Thanks [@benruseau](https://github.com/benruseau)! - Add the apply updates sub-step to the OS updates orchestrator, covering the OSU install, the MCU flash loop and the final firmware install

  Wait out the device reboots each install and flash leaves behind, reconnecting under the same session id

  Add the restore backup step, which runs as the last tenth of the bar when it follows an update and on its own when there is nothing left to update

  Sync `BASE_SOCKET_URL` to the DMK secure channel WebSocket URL

- [#23056](https://github.com/LedgerHQ/ledger-live/pull/23056) [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The connectNewDevice `Discovering` UI state now keeps the devices in the order in which they were first discovered. A device that discovery no longer reports stays at its position with `isAvailable: false` and no `onSelect`. It becomes available again at the same position when discovery reports it again. The state machine takes a new `getDiscoveredDeviceKey` input to identify a device from one discovery update to the next: on mobile, a Bluetooth device by its id and a USB device by its model. Each device of the list has this `key`, to use as its row key.

### Patch Changes

- Updated dependencies [[`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be)]:
  - @domain/entity-client-identity@0.3.0
  - @ledgerhq/types-devices@7.1.0

## 0.35.0-next.0

### Minor Changes

- [#22776](https://github.com/LedgerHQ/ledger-live/pull/22776) [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add the connectNewDevice state machine. It discovers devices, lets the user select one, connects to it, and reports the result, with a device not found delay and a success delay. `DeviceDiscoveryService` now exposes the `transportIds` it discovers on.

- [#22599](https://github.com/LedgerHQ/ledger-live/pull/22599) [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add failureType and subError properties to Device Intent Executor deviceflow_failed and deviceflow_aborted events

- [#23178](https://github.com/LedgerHQ/ledger-live/pull/23178) [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb) Thanks [@benruseau](https://github.com/benruseau)! - Add the OS updates orchestrator React layer: a generic `OsUpdatesOrchestratorComponent` and `useOsUpdatesOrchestrator` hook in live-common that render platform-injected components for each step

  Add the mobile pre-checks, create backup, apply updates and restore backup components, and persist the device backup in the app storage

  Use the real components in the OS updates orchestrator debug screen

  Fix the OS updates apply step after a bootloader recovery: when the device comes back on an OS, install the first update of the resolved path from its OSU firmware instead of its final firmware, which skipped an update

- [#23121](https://github.com/LedgerHQ/ledger-live/pull/23121) [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add the optional `filterListedDevices` input to the connectNewDevice state machine. It selects the listed devices that `Discovering` shows, and a hidden device keeps its position in the list.

- [#22995](https://github.com/LedgerHQ/ledger-live/pull/22995) [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The connectNewDevice `Connected` and `Done` UI states now carry the connected `device`, so that the UI can show the transport that was used.

- [#22765](https://github.com/LedgerHQ/ledger-live/pull/22765) [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract the device discovery service and the connectivity types shared by device connection flows into a `deviceConnectivity` folder. The discovery, connection and unknown error UI states now use the shared `ConnectivityUIStateTypes` enum. `ConnectDeviceUIStateTypes` becomes a const object that includes these shared members, so type positions use `typeof ConnectDeviceUIStateTypes.X` or the new `ConnectDeviceUIStateType` type. The device type moves to the shared part as `Device`, and connectDevice keeps `KnownDevice` as an alias of it. connectDevice behaviour is unchanged.

- [#22847](https://github.com/LedgerHQ/ledger-live/pull/22847) [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add `connectNewDeviceUseCase`, which exposes the connectNewDevice state machine as an `Observable` of UI states, and the mobile `connectNewDevice`, which discovers on RN_BLE and Speculos on iOS and also on RN_HID on Android.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Keep the DMK firmware distribution salt in sync with the user ID of the identities store, so DMK flows follow the progressive OS rollout on desktop and mobile

- [#22846](https://github.com/LedgerHQ/ledger-live/pull/22846) [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b) Thanks [@benruseau](https://github.com/benruseau)! - Add the apply updates sub-step to the OS updates orchestrator, covering the OSU install, the MCU flash loop and the final firmware install

  Wait out the device reboots each install and flash leaves behind, reconnecting under the same session id

  Add the restore backup step, which runs as the last tenth of the bar when it follows an update and on its own when there is nothing left to update

  Sync `BASE_SOCKET_URL` to the DMK secure channel WebSocket URL

- [#23056](https://github.com/LedgerHQ/ledger-live/pull/23056) [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The connectNewDevice `Discovering` UI state now keeps the devices in the order in which they were first discovered. A device that discovery no longer reports stays at its position with `isAvailable: false` and no `onSelect`. It becomes available again at the same position when discovery reports it again. The state machine takes a new `getDiscoveredDeviceKey` input to identify a device from one discovery update to the next: on mobile, a Bluetooth device by its id and a USB device by its model. Each device of the list has this `key`, to use as its row key.

### Patch Changes

- Updated dependencies [[`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be)]:
  - @domain/entity-client-identity@0.3.0-next.0
  - @ledgerhq/types-devices@7.1.0

## 0.34.0

### Minor Changes

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#22503](https://github.com/LedgerHQ/ledger-live/pull/22503) [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e) Thanks [@daniel-choinski-ledger](https://github.com/daniel-choinski-ledger)! - Inject the Tron address book into the DMK Tron signer so Tron transactions can clear-sign saved contact names.

  Adds a generic `AddressBookProvider<T>` in `live-dmk-shared` (the EVM provider is refactored onto it), a `tronAddressBookProvider` instance, a pure `toTronAddressBook` mapper (`Contact[] -> TronAddressBook`, Tron-family only, no chain id, `ledgerAccounts` always empty), and registers the source at each app's composition root. An absent or empty book leaves signing behavior unchanged.

## 0.34.0-next.0

### Minor Changes

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#22503](https://github.com/LedgerHQ/ledger-live/pull/22503) [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e) Thanks [@daniel-choinski-ledger](https://github.com/daniel-choinski-ledger)! - Inject the Tron address book into the DMK Tron signer so Tron transactions can clear-sign saved contact names.

  Adds a generic `AddressBookProvider<T>` in `live-dmk-shared` (the EVM provider is refactored onto it), a `tronAddressBookProvider` instance, a pure `toTronAddressBook` mapper (`Contact[] -> TronAddressBook`, Tron-family only, no chain id, `ledgerAccounts` always empty), and registers the source at each app's composition root. An absent or empty book leaves signing behavior unchanged.

## 0.33.0

### Minor Changes

- [#22089](https://github.com/LedgerHQ/ledger-live/pull/22089) [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756) Thanks [@benruseau](https://github.com/benruseau)! - Add the create backup sub-step to the OS updates orchestrator

  Extract the device error cause recovery into a state machine shared by all sub-steps

  Refactor the OS updates debug screen

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68)]:
  - @ledgerhq/types-devices@7.1.0

## 0.33.0-next.0

### Minor Changes

- [#22089](https://github.com/LedgerHQ/ledger-live/pull/22089) [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756) Thanks [@benruseau](https://github.com/benruseau)! - Add the create backup sub-step to the OS updates orchestrator

  Extract the device error cause recovery into a state machine shared by all sub-steps

  Refactor the OS updates debug screen

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68)]:
  - @ledgerhq/types-devices@7.1.0-next.0

## 0.32.0

### Minor Changes

- [#21284](https://github.com/LedgerHQ/ledger-live/pull/21284) [`6cef6b5`](https://github.com/LedgerHQ/ledger-live/commit/6cef6b5341c30850aa74159bdbdea0a18f89de4c) Thanks [@benruseau](https://github.com/benruseau)! - Add the OS update orchestrator and its pre-checks, taking a connected device and recovering from device lock and disconnection

- [#21270](https://github.com/LedgerHQ/ledger-live/pull/21270) [`5b9df59`](https://github.com/LedgerHQ/ledger-live/commit/5b9df5970cb628dbfe592227231b66ff498f480c) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Map the DMK invalid firmware metadata error to a dedicated InvalidProvider blocking state, so the Device Intent Executor shows a clear "Invalid Provider" screen with a "Go to settings" action instead of a raw error

## 0.32.0-next.0

### Minor Changes

- [#21284](https://github.com/LedgerHQ/ledger-live/pull/21284) [`6cef6b5`](https://github.com/LedgerHQ/ledger-live/commit/6cef6b5341c30850aa74159bdbdea0a18f89de4c) Thanks [@benruseau](https://github.com/benruseau)! - Add the OS update orchestrator and its pre-checks, taking a connected device and recovering from device lock and disconnection

- [#21270](https://github.com/LedgerHQ/ledger-live/pull/21270) [`5b9df59`](https://github.com/LedgerHQ/ledger-live/commit/5b9df5970cb628dbfe592227231b66ff498f480c) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Map the DMK invalid firmware metadata error to a dedicated InvalidProvider blocking state, so the Device Intent Executor shows a clear "Invalid Provider" screen with a "Go to settings" action instead of a raw error

## 0.31.0

### Minor Changes

- [#20616](https://github.com/LedgerHQ/ledger-live/pull/20616) [`1a2df41`](https://github.com/LedgerHQ/ledger-live/commit/1a2df41eed302864ec2e0b58dc9eef75e8b90eec) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Export shared Device Intent Executor header override helpers.

### Patch Changes

- Updated dependencies [[`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68)]:
  - @ledgerhq/types-devices@7.0.0

## 0.31.0-next.0

### Minor Changes

- [#20616](https://github.com/LedgerHQ/ledger-live/pull/20616) [`1a2df41`](https://github.com/LedgerHQ/ledger-live/commit/1a2df41eed302864ec2e0b58dc9eef75e8b90eec) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Export shared Device Intent Executor header override helpers.

### Patch Changes

- Updated dependencies [[`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68)]:
  - @ledgerhq/types-devices@7.0.0-next.0

## 0.30.0

### Minor Changes

- [#20503](https://github.com/LedgerHQ/ledger-live/pull/20503) [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Export the shared Device Intent Executor tracking context.

### Patch Changes

- Updated dependencies [[`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b)]:
  - @ledgerhq/types-devices@6.32.0

## 0.30.0-next.0

### Minor Changes

- [#20503](https://github.com/LedgerHQ/ledger-live/pull/20503) [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Export the shared Device Intent Executor tracking context.

### Patch Changes

- Updated dependencies [[`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b)]:
  - @ledgerhq/types-devices@6.32.0-next.0

## 0.29.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.7

## 0.29.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.7-next.0

## 0.29.0

### Minor Changes

- [#19794](https://github.com/LedgerHQ/ledger-live/pull/19794) [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Handle non-onboarded devices according to the requirements of each Connect App flow

- [#19681](https://github.com/LedgerHQ/ledger-live/pull/19681) [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix USB transport routing for Device Intent Executor legacy `withDevice` intents.

## 0.29.0-next.0

### Minor Changes

- [#19794](https://github.com/LedgerHQ/ledger-live/pull/19794) [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Handle non-onboarded devices according to the requirements of each Connect App flow

- [#19681](https://github.com/LedgerHQ/ledger-live/pull/19681) [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix USB transport routing for Device Intent Executor legacy `withDevice` intents.

## 0.28.0

### Minor Changes

- [#19226](https://github.com/LedgerHQ/ledger-live/pull/19226) [`d91f849`](https://github.com/LedgerHQ/ledger-live/commit/d91f849185c7a30514349be655bba69dd77bb8c8) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Match device deprecation configs against Ledger Live device model ids.

- [#18978](https://github.com/LedgerHQ/ledger-live/pull/18978) [`0225804`](https://github.com/LedgerHQ/ledger-live/commit/0225804cd0f39b90050f52b14e1b159340f0530e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract connectDevice shared core from live-dmk-mobile to live-dmk-shared

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.6

## 0.28.0-next.0

### Minor Changes

- [#19226](https://github.com/LedgerHQ/ledger-live/pull/19226) [`d91f849`](https://github.com/LedgerHQ/ledger-live/commit/d91f849185c7a30514349be655bba69dd77bb8c8) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Match device deprecation configs against Ledger Live device model ids.

- [#18978](https://github.com/LedgerHQ/ledger-live/pull/18978) [`0225804`](https://github.com/LedgerHQ/ledger-live/commit/0225804cd0f39b90050f52b14e1b159340f0530e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract connectDevice shared core from live-dmk-mobile to live-dmk-shared

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.6-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
