# @ledgerhq/live-dmk-mobile

## 0.32.0

### Minor Changes

- [#23210](https://github.com/LedgerHQ/ledger-live/pull/23210) [`a2ef1bf`](https://github.com/LedgerHQ/ledger-live/commit/a2ef1bf1a96b8f59795897fcd9dcd0f0e6fd3295) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The Bluetooth discovery preflight now waits up to 3 s for the Bluetooth state to leave `Unknown` or `Resetting` before it reports an error. Before, turning off Bluetooth during a scan on Android could report `BluetoothStateUnknownCheckOnly` while the adapter was still turning off. The connect new device sheet then showed "Checking Bluetooth..." with no action.

- [#23220](https://github.com/LedgerHQ/ledger-live/pull/23220) [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Support protected Speculinho sessions in E2E. Speculos transports take the session's `bearerToken` (`SpeculosHttpTransportOpts`, `SpeculosSessionTarget`, the mobile `SpeculosTarget`; `DeviceManagementKitTransportSpeculos` and the desktop transport default to `SPECULOS_SESSION_TOKEN`) and keep a separate DMK per token. E2E acquires sessions with `protected: true` and authenticates every operator and Speculos request; the mobile e2e bridge passes the token to the app and now requires a per-run connection token. Bumps `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

### Patch Changes

- Updated dependencies [[`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0)]:
  - @shared/env@0.11.0
  - @ledgerhq/live-dmk-shared@0.36.0

## 0.32.0-next.0

### Minor Changes

- [#23210](https://github.com/LedgerHQ/ledger-live/pull/23210) [`a2ef1bf`](https://github.com/LedgerHQ/ledger-live/commit/a2ef1bf1a96b8f59795897fcd9dcd0f0e6fd3295) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The Bluetooth discovery preflight now waits up to 3 s for the Bluetooth state to leave `Unknown` or `Resetting` before it reports an error. Before, turning off Bluetooth during a scan on Android could report `BluetoothStateUnknownCheckOnly` while the adapter was still turning off. The connect new device sheet then showed "Checking Bluetooth..." with no action.

- [#23220](https://github.com/LedgerHQ/ledger-live/pull/23220) [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Support protected Speculinho sessions in E2E. Speculos transports take the session's `bearerToken` (`SpeculosHttpTransportOpts`, `SpeculosSessionTarget`, the mobile `SpeculosTarget`; `DeviceManagementKitTransportSpeculos` and the desktop transport default to `SPECULOS_SESSION_TOKEN`) and keep a separate DMK per token. E2E acquires sessions with `protected: true` and authenticates every operator and Speculos request; the mobile e2e bridge passes the token to the app and now requires a per-run connection token. Bumps `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

### Patch Changes

- Updated dependencies [[`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0)]:
  - @shared/env@0.11.0-next.0
  - @ledgerhq/live-dmk-shared@0.36.0-next.0

## 0.31.0

### Minor Changes

- [#22995](https://github.com/LedgerHQ/ledger-live/pull/22995) [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The connectNewDevice `Connected` and `Done` UI states now carry the connected `device`, so that the UI can show the transport that was used.

- [#22765](https://github.com/LedgerHQ/ledger-live/pull/22765) [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract the device discovery service and the connectivity types shared by device connection flows into a `deviceConnectivity` folder. The discovery, connection and unknown error UI states now use the shared `ConnectivityUIStateTypes` enum. `ConnectDeviceUIStateTypes` becomes a const object that includes these shared members, so type positions use `typeof ConnectDeviceUIStateTypes.X` or the new `ConnectDeviceUIStateType` type. The device type moves to the shared part as `Device`, and connectDevice keeps `KnownDevice` as an alias of it. connectDevice behaviour is unchanged.

- [#22847](https://github.com/LedgerHQ/ledger-live/pull/22847) [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add `connectNewDeviceUseCase`, which exposes the connectNewDevice state machine as an `Observable` of UI states, and the mobile `connectNewDevice`, which discovers on RN_BLE and Speculos on iOS and also on RN_HID on Android.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Keep the DMK firmware distribution salt in sync with the user ID of the identities store, so DMK flows follow the progressive OS rollout on desktop and mobile

- [#23056](https://github.com/LedgerHQ/ledger-live/pull/23056) [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The connectNewDevice `Discovering` UI state now keeps the devices in the order in which they were first discovered. A device that discovery no longer reports stays at its position with `isAvailable: false` and no `onSelect`. It becomes available again at the same position when discovery reports it again. The state machine takes a new `getDiscoveredDeviceKey` input to identify a device from one discovery update to the next: on mobile, a Bluetooth device by its id and a USB device by its model. Each device of the list has this `key`, to use as its row key.

- [#23121](https://github.com/LedgerHQ/ledger-live/pull/23121) [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - `connectNewDevice` lists only the available USB devices when a USB device is available, and only the devices on the other transports otherwise.

### Patch Changes

- Updated dependencies [[`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a)]:
  - @shared/env@0.10.0
  - @ledgerhq/live-dmk-shared@0.35.0
  - @ledgerhq/types-devices@7.1.0

## 0.31.0-next.0

### Minor Changes

- [#22995](https://github.com/LedgerHQ/ledger-live/pull/22995) [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The connectNewDevice `Connected` and `Done` UI states now carry the connected `device`, so that the UI can show the transport that was used.

- [#22765](https://github.com/LedgerHQ/ledger-live/pull/22765) [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract the device discovery service and the connectivity types shared by device connection flows into a `deviceConnectivity` folder. The discovery, connection and unknown error UI states now use the shared `ConnectivityUIStateTypes` enum. `ConnectDeviceUIStateTypes` becomes a const object that includes these shared members, so type positions use `typeof ConnectDeviceUIStateTypes.X` or the new `ConnectDeviceUIStateType` type. The device type moves to the shared part as `Device`, and connectDevice keeps `KnownDevice` as an alias of it. connectDevice behaviour is unchanged.

- [#22847](https://github.com/LedgerHQ/ledger-live/pull/22847) [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add `connectNewDeviceUseCase`, which exposes the connectNewDevice state machine as an `Observable` of UI states, and the mobile `connectNewDevice`, which discovers on RN_BLE and Speculos on iOS and also on RN_HID on Android.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Keep the DMK firmware distribution salt in sync with the user ID of the identities store, so DMK flows follow the progressive OS rollout on desktop and mobile

- [#23056](https://github.com/LedgerHQ/ledger-live/pull/23056) [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The connectNewDevice `Discovering` UI state now keeps the devices in the order in which they were first discovered. A device that discovery no longer reports stays at its position with `isAvailable: false` and no `onSelect`. It becomes available again at the same position when discovery reports it again. The state machine takes a new `getDiscoveredDeviceKey` input to identify a device from one discovery update to the next: on mobile, a Bluetooth device by its id and a USB device by its model. Each device of the list has this `key`, to use as its row key.

- [#23121](https://github.com/LedgerHQ/ledger-live/pull/23121) [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - `connectNewDevice` lists only the available USB devices when a USB device is available, and only the devices on the other transports otherwise.

### Patch Changes

- Updated dependencies [[`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a)]:
  - @shared/env@0.10.0-next.0
  - @ledgerhq/live-dmk-shared@0.35.0-next.0
  - @ledgerhq/types-devices@7.1.0

## 0.30.0

### Minor Changes

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#21976](https://github.com/LedgerHQ/ledger-live/pull/21976) [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add mobile E2E coverage for creating a contact, registering EVM addresses on the device and deleting both, and let device intents run against Speculos by registering it as a discoverable transport. Speculos specs can now pin an OS version so the run uses the Ethereum build the contacts intents require, which the app catalog does not serve yet.

### Patch Changes

- Updated dependencies [[`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e)]:
  - @ledgerhq/live-dmk-shared@0.34.0
  - @shared/env@0.9.0

## 0.30.0-next.0

### Minor Changes

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#21976](https://github.com/LedgerHQ/ledger-live/pull/21976) [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add mobile E2E coverage for creating a contact, registering EVM addresses on the device and deleting both, and let device intents run against Speculos by registering it as a discoverable transport. Speculos specs can now pin an OS version so the run uses the Ethereum build the contacts intents require, which the app catalog does not serve yet.

### Patch Changes

- Updated dependencies [[`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e)]:
  - @ledgerhq/live-dmk-shared@0.34.0-next.0
  - @shared/env@0.9.0-next.0

## 0.29.9

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7)]:
  - @shared/env@0.8.0
  - @ledgerhq/types-devices@7.1.0
  - @ledgerhq/live-dmk-shared@0.33.0

## 0.29.9-next.0

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7)]:
  - @shared/env@0.8.0-next.0
  - @ledgerhq/types-devices@7.1.0-next.0
  - @ledgerhq/live-dmk-shared@0.33.0-next.0

## 0.29.8

### Patch Changes

- Updated dependencies [[`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4)]:
  - @shared/env@0.7.0

## 0.29.8-next.0

### Patch Changes

- Updated dependencies [[`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4)]:
  - @shared/env@0.7.0-next.0

## 0.29.7

### Patch Changes

- Updated dependencies [[`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6)]:
  - @shared/env@0.6.0

## 0.29.7-next.0

### Patch Changes

- Updated dependencies [[`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6)]:
  - @shared/env@0.6.0-next.0

## 0.29.6

### Patch Changes

- Updated dependencies [[`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`6cef6b5`](https://github.com/LedgerHQ/ledger-live/commit/6cef6b5341c30850aa74159bdbdea0a18f89de4c), [`5b9df59`](https://github.com/LedgerHQ/ledger-live/commit/5b9df5970cb628dbfe592227231b66ff498f480c)]:
  - @shared/env@0.5.0
  - @ledgerhq/live-dmk-shared@0.32.0

## 0.29.6-next.0

### Patch Changes

- Updated dependencies [[`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`6cef6b5`](https://github.com/LedgerHQ/ledger-live/commit/6cef6b5341c30850aa74159bdbdea0a18f89de4c), [`5b9df59`](https://github.com/LedgerHQ/ledger-live/commit/5b9df5970cb628dbfe592227231b66ff498f480c)]:
  - @shared/env@0.5.0-next.0
  - @ledgerhq/live-dmk-shared@0.32.0-next.0

## 0.29.5

### Patch Changes

- Updated dependencies [[`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1), [`cad4f63`](https://github.com/LedgerHQ/ledger-live/commit/cad4f63be4a3b16880ab490195af1f17921e03c2), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @shared/env@0.4.0

## 0.29.5-next.0

### Patch Changes

- Updated dependencies [[`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1), [`cad4f63`](https://github.com/LedgerHQ/ledger-live/commit/cad4f63be4a3b16880ab490195af1f17921e03c2), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @shared/env@0.4.0-next.0

## 0.29.4

### Patch Changes

- Updated dependencies [[`1a2df41`](https://github.com/LedgerHQ/ledger-live/commit/1a2df41eed302864ec2e0b58dc9eef75e8b90eec), [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68), [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3)]:
  - @ledgerhq/live-dmk-shared@0.31.0
  - @shared/env@0.3.0
  - @ledgerhq/types-devices@7.0.0

## 0.29.4-next.0

### Patch Changes

- Updated dependencies [[`1a2df41`](https://github.com/LedgerHQ/ledger-live/commit/1a2df41eed302864ec2e0b58dc9eef75e8b90eec), [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68), [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3)]:
  - @ledgerhq/live-dmk-shared@0.31.0-next.0
  - @shared/env@0.3.0-next.0
  - @ledgerhq/types-devices@7.0.0-next.0

## 0.29.3

### Patch Changes

- Updated dependencies [[`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57)]:
  - @ledgerhq/types-devices@6.32.0
  - @ledgerhq/live-dmk-shared@0.30.0

## 0.29.3-next.0

### Patch Changes

- Updated dependencies [[`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57)]:
  - @ledgerhq/types-devices@6.32.0-next.0
  - @ledgerhq/live-dmk-shared@0.30.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
