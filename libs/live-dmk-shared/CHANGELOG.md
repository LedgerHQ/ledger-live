# @ledgerhq/live-dmk

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

## 0.27.0

### Minor Changes

- [#18627](https://github.com/LedgerHQ/ledger-live/pull/18627) [`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump Device Management Kit to 1.7.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.5

## 0.27.0-next.0

### Minor Changes

- [#18627](https://github.com/LedgerHQ/ledger-live/pull/18627) [`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump Device Management Kit to 1.7.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.5-next.0

## 0.26.0

### Minor Changes

- [#17834](https://github.com/LedgerHQ/ledger-live/pull/17834) [`8269fe2`](https://github.com/LedgerHQ/ledger-live/commit/8269fe21f252be75cd5d07623bba9701098b812d) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Applied new Context-Module breaking changes

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.4

## 0.26.0-next.0

### Minor Changes

- [#17834](https://github.com/LedgerHQ/ledger-live/pull/17834) [`8269fe2`](https://github.com/LedgerHQ/ledger-live/commit/8269fe21f252be75cd5d07623bba9701098b812d) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Applied new Context-Module breaking changes

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.4-next.0

## 0.25.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.3

## 0.25.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.3-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
