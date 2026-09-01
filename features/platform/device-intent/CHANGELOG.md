# @features/platform-device-intent

## 5.2.0-next.0

### Minor Changes

- [#21017](https://github.com/LedgerHQ/ledger-live/pull/21017) [`9d5a6d9`](https://github.com/LedgerHQ/ledger-live/commit/9d5a6d980442ac78bcc1c3c12fbfee389aa8e0c9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add a typed result callback contract to device intent jobs

## 5.1.0

### Minor Changes

- [#20769](https://github.com/LedgerHQ/ledger-live/pull/20769) [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Export the DeviceIntentExecutor component from the package public API.

- [#20769](https://github.com/LedgerHQ/ledger-live/pull/20769) [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Move the Device Intent Executor to the platform layer and use DMK device model IDs throughout its connection contract.

- [#21002](https://github.com/LedgerHQ/ledger-live/pull/21002) [`582f422`](https://github.com/LedgerHQ/ledger-live/commit/582f422ec2fbe8bb852c7a847c3ee0ff0a01ab32) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Make DeviceIntentExecutor job lifecycle callbacks optional

## 5.1.0-next.0

### Minor Changes

- [#20769](https://github.com/LedgerHQ/ledger-live/pull/20769) [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Export the DeviceIntentExecutor component from the package public API.

- [#20769](https://github.com/LedgerHQ/ledger-live/pull/20769) [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Move the Device Intent Executor to the platform layer and use DMK device model IDs throughout its connection contract.

- [#21002](https://github.com/LedgerHQ/ledger-live/pull/21002) [`582f422`](https://github.com/LedgerHQ/ledger-live/commit/582f422ec2fbe8bb852c7a847c3ee0ff0a01ab32) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Make DeviceIntentExecutor job lifecycle callbacks optional

## 6.0.0

### Patch Changes

- Updated dependencies [[`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68)]:
  - @ledgerhq/types-devices@7.0.0

## 6.0.0-next.0

### Patch Changes

- Updated dependencies [[`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68)]:
  - @ledgerhq/types-devices@7.0.0-next.0

## 5.0.0

### Patch Changes

- Updated dependencies [[`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b)]:
  - @ledgerhq/types-devices@6.32.0

## 5.0.0-next.0

### Patch Changes

- Updated dependencies [[`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b)]:
  - @ledgerhq/types-devices@6.32.0-next.0

## 4.0.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.11.1

## 4.0.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.11.1-next.0

## 4.0.0

### Minor Changes

- [#18627](https://github.com/LedgerHQ/ledger-live/pull/18627) [`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump Device Management Kit to 1.7.1

### Patch Changes

- Updated dependencies [[`7817aff`](https://github.com/LedgerHQ/ledger-live/commit/7817aff12e1a26fbfbe70176afa6811d7020087d)]:
  - @ledgerhq/client-ids@0.11.0

## 4.0.0-next.0

### Minor Changes

- [#18627](https://github.com/LedgerHQ/ledger-live/pull/18627) [`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump Device Management Kit to 1.7.1

### Patch Changes

- Updated dependencies [[`7817aff`](https://github.com/LedgerHQ/ledger-live/commit/7817aff12e1a26fbfbe70176afa6811d7020087d)]:
  - @ledgerhq/client-ids@0.11.0-next.0

## 3.3.0

### Minor Changes

- [#18302](https://github.com/LedgerHQ/ledger-live/pull/18302) [`3cf8c3f`](https://github.com/LedgerHQ/ledger-live/commit/3cf8c3fc7a3e4143576e50ec953b995982ea86a6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Replace the DeviceIntentExecutor `cancellableUI` prop with the `ModalLock` pattern to control bottom sheet dismissability. The drawer is now locked (no close button, backdrop and pan-down disabled) while a device action is pending or in progress (unlock, allow secure connection, confirm open app, installing app, loading), and dismissable otherwise.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.10.3

## 3.3.0-next.0

### Minor Changes

- [#18302](https://github.com/LedgerHQ/ledger-live/pull/18302) [`3cf8c3f`](https://github.com/LedgerHQ/ledger-live/commit/3cf8c3fc7a3e4143576e50ec953b995982ea86a6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Replace the DeviceIntentExecutor `cancellableUI` prop with the `ModalLock` pattern to control bottom sheet dismissability. The drawer is now locked (no close button, backdrop and pan-down disabled) while a device action is pending or in progress (unlock, allow secure connection, confirm open app, installing app, loading), and dismissable otherwise.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.10.3-next.0

## 3.2.0

### Minor Changes

- [#18226](https://github.com/LedgerHQ/ledger-live/pull/18226) [`1b89031`](https://github.com/LedgerHQ/ledger-live/commit/1b89031653104c70b563dc0a11d4586e1dafd82f) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix Device Intent Executor state machine startup race.

- [#18046](https://github.com/LedgerHQ/ledger-live/pull/18046) [`473d990`](https://github.com/LedgerHQ/ledger-live/commit/473d990664a3fbd0082e2c00a737eecccd9822b7) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add generic Device UX V2 error page tracking and surface disconnected device data from the device intent executor.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.10.2

## 3.2.0-next.0

### Minor Changes

- [#18226](https://github.com/LedgerHQ/ledger-live/pull/18226) [`1b89031`](https://github.com/LedgerHQ/ledger-live/commit/1b89031653104c70b563dc0a11d4586e1dafd82f) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix Device Intent Executor state machine startup race.

- [#18046](https://github.com/LedgerHQ/ledger-live/pull/18046) [`473d990`](https://github.com/LedgerHQ/ledger-live/commit/473d990664a3fbd0082e2c00a737eecccd9822b7) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add generic Device UX V2 error page tracking and surface disconnected device data from the device intent executor.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.10.2-next.0

## 3.1.0

### Minor Changes

- [#17929](https://github.com/LedgerHQ/ledger-live/pull/17929) [`583803d`](https://github.com/LedgerHQ/ledger-live/commit/583803d266ceef53aa97e0d678045326926031ad) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Enrich `ExecutorState` with the data the state machine has accumulated up to each transition: `initializingDeviceContext` now carries `connectionResult`, while `executingIntent` and `executingIntentError` carry both `connectionResult` and `extractedContext`. This is purely additive and lets host apps drive analytics or post-connection logic without keeping their own out-of-band copy of the connection / extraction results.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.10.1

## 3.1.0-next.0

### Minor Changes

- [#17929](https://github.com/LedgerHQ/ledger-live/pull/17929) [`583803d`](https://github.com/LedgerHQ/ledger-live/commit/583803d266ceef53aa97e0d678045326926031ad) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Enrich `ExecutorState` with the data the state machine has accumulated up to each transition: `initializingDeviceContext` now carries `connectionResult`, while `executingIntent` and `executingIntentError` carry both `connectionResult` and `extractedContext`. This is purely additive and lets host apps drive analytics or post-connection logic without keeping their own out-of-band copy of the connection / extraction results.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.10.1-next.0

## 3.0.0

### Minor Changes

- [#17592](https://github.com/LedgerHQ/ledger-live/pull/17592) [`efbc7ee`](https://github.com/LedgerHQ/ledger-live/commit/efbc7ee371c74253fa78f8b7c5518dd79bb0bc4d) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Tighten the Device Intent Executor error model:

  - Replace the catch-all `connectionError` executor state with a focused `deviceDisconnected` state entered only via the `DEVICE_DISCONNECTED` event. The `DeviceConnectionComponent` no longer receives `onError`, and `ExecutorPlatformConfiguration` requires a `DeviceDisconnectedComponent` in place of the previous `ConnectionErrorComponent`.
  - Funnel any unexpected error escaping the inner connect-device state machine into a new terminal `UnknownError` `ConnectDeviceUIState` via a `catchError` wrapper in `connectDeviceUseCase`, so the observable's error channel is never reached in normal operation.
  - Add a `UnknownErrorState` component in the LWM connection view that renders the shared `intentError` wording for this terminal state.

- [#17557](https://github.com/LedgerHQ/ledger-live/pull/17557) [`3603d91`](https://github.com/LedgerHQ/ledger-live/commit/3603d9192f9c29bb056443afea889cf35b247c9d) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add generic error UI for the DeviceIntentExecutor (LWM) covering connection, intent and invalid-operation failures, and wire the executor's `onUserCancel` callback to every phase as a uniform `onClose` prop so platform and intent components can offer a close action.

### Patch Changes

- Updated dependencies [[`e278291`](https://github.com/LedgerHQ/ledger-live/commit/e2782919681ec2619e2433a18eef954b8ca9eddb)]:
  - @ledgerhq/client-ids@0.10.0

## 3.0.0-next.0

### Minor Changes

- [#17592](https://github.com/LedgerHQ/ledger-live/pull/17592) [`efbc7ee`](https://github.com/LedgerHQ/ledger-live/commit/efbc7ee371c74253fa78f8b7c5518dd79bb0bc4d) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Tighten the Device Intent Executor error model:

  - Replace the catch-all `connectionError` executor state with a focused `deviceDisconnected` state entered only via the `DEVICE_DISCONNECTED` event. The `DeviceConnectionComponent` no longer receives `onError`, and `ExecutorPlatformConfiguration` requires a `DeviceDisconnectedComponent` in place of the previous `ConnectionErrorComponent`.
  - Funnel any unexpected error escaping the inner connect-device state machine into a new terminal `UnknownError` `ConnectDeviceUIState` via a `catchError` wrapper in `connectDeviceUseCase`, so the observable's error channel is never reached in normal operation.
  - Add a `UnknownErrorState` component in the LWM connection view that renders the shared `intentError` wording for this terminal state.

- [#17557](https://github.com/LedgerHQ/ledger-live/pull/17557) [`3603d91`](https://github.com/LedgerHQ/ledger-live/commit/3603d9192f9c29bb056443afea889cf35b247c9d) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add generic error UI for the DeviceIntentExecutor (LWM) covering connection, intent and invalid-operation failures, and wire the executor's `onUserCancel` callback to every phase as a uniform `onClose` prop so platform and intent components can offer a close action.

### Patch Changes

- Updated dependencies [[`e278291`](https://github.com/LedgerHQ/ledger-live/commit/e2782919681ec2619e2433a18eef954b8ca9eddb)]:
  - @ledgerhq/client-ids@0.10.0-next.0

## 2.1.0

### Minor Changes

- [#17020](https://github.com/LedgerHQ/ledger-live/pull/17020) [`d285678`](https://github.com/LedgerHQ/ledger-live/commit/d28567854ca5ebf7c02c66403d8b2c7406c7abff) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Wire configurable device context initialization into the mobile Device Intent Executor

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.9.1

## 2.1.0-next.0

### Minor Changes

- [#17020](https://github.com/LedgerHQ/ledger-live/pull/17020) [`d285678`](https://github.com/LedgerHQ/ledger-live/commit/d28567854ca5ebf7c02c66403d8b2c7406c7abff) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Wire configurable device context initialization into the mobile Device Intent Executor

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.9.1-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
