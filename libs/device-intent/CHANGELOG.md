# @ledgerhq/device-intent

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

## 2.0.0

### Minor Changes

- [#16513](https://github.com/LedgerHQ/ledger-live/pull/16513) [`c89ccf0`](https://github.com/LedgerHQ/ledger-live/commit/c89ccf0c5ca3861ee84c8086eadd87d590906139) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Adapt the device intent initialization contract and the mobile integration

### Patch Changes

- Updated dependencies [[`1b794cd`](https://github.com/LedgerHQ/ledger-live/commit/1b794cd3ba353c0f36339c445a785ff0addcdaad)]:
  - @ledgerhq/client-ids@0.9.0

## 2.0.0-next.0

### Minor Changes

- [#16513](https://github.com/LedgerHQ/ledger-live/pull/16513) [`c89ccf0`](https://github.com/LedgerHQ/ledger-live/commit/c89ccf0c5ca3861ee84c8086eadd87d590906139) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Adapt the device intent initialization contract and the mobile integration

### Patch Changes

- Updated dependencies [[`1b794cd`](https://github.com/LedgerHQ/ledger-live/commit/1b794cd3ba353c0f36339c445a785ff0addcdaad)]:
  - @ledgerhq/client-ids@0.9.0-next.0

## 1.1.0

### Minor Changes

- [#15952](https://github.com/LedgerHQ/ledger-live/pull/15952) [`9569bdc`](https://github.com/LedgerHQ/ledger-live/commit/9569bdc8f6987f77e4d68118a69536544de2845a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add a mobile Device Intent Executor debug playground and improve intent lifecycle handling

- [#16023](https://github.com/LedgerHQ/ledger-live/pull/16023) [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: remove eslint and prettier, replace with with oxlint and oxfmt

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.8.3

## 1.1.0-next.0

### Minor Changes

- [#15952](https://github.com/LedgerHQ/ledger-live/pull/15952) [`9569bdc`](https://github.com/LedgerHQ/ledger-live/commit/9569bdc8f6987f77e4d68118a69536544de2845a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add a mobile Device Intent Executor debug playground and improve intent lifecycle handling

- [#16023](https://github.com/LedgerHQ/ledger-live/pull/16023) [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: remove eslint and prettier, replace with with oxlint and oxfmt

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.8.3-next.0

## 1.0.0

### Patch Changes

- Updated dependencies [[`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/types-devices@6.31.0
  - @ledgerhq/client-ids@0.8.2

## 1.0.0-next.0

### Patch Changes

- Updated dependencies [[`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/types-devices@6.31.0-next.0
  - @ledgerhq/client-ids@0.8.2-next.0

## 0.2.0

### Minor Changes

- [#15628](https://github.com/LedgerHQ/ledger-live/pull/15628) [`12bae8f`](https://github.com/LedgerHQ/ledger-live/commit/12bae8fd0170872954430165291a5fd101ab7905) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add Device Intent Executor: xstate state machine, React hook, and component for platform-agnostic device intent execution

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.8.1

## 0.2.0-next.0

### Minor Changes

- [#15628](https://github.com/LedgerHQ/ledger-live/pull/15628) [`12bae8f`](https://github.com/LedgerHQ/ledger-live/commit/12bae8fd0170872954430165291a5fd101ab7905) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add Device Intent Executor: xstate state machine, React hook, and component for platform-agnostic device intent execution

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.8.1-next.0
