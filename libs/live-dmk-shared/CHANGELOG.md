# @ledgerhq/live-dmk

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

## 0.25.0

### Minor Changes

- [#17583](https://github.com/LedgerHQ/ledger-live/pull/17583) [`157ec37`](https://github.com/LedgerHQ/ledger-live/commit/157ec37d05d79cfe30fcc8e85c228418643c6f84) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix sticky user interaction state in EnsureAppReady pending mapping: when ConnectApp reports `UserInteractionRequired.None` without an install plan, emit a generic loading state instead of returning null so the UI no longer remains stuck on the previous interaction prompt.

- [#17617](https://github.com/LedgerHQ/ledger-live/pull/17617) [`6cbcbdd`](https://github.com/LedgerHQ/ledger-live/commit/6cbcbdda1489face530378a12bfcfc2a60b4c0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Improve console log readability when debugging via Chrome / React Native DevTools: mobile's `ConsoleLogger` now uses `console.groupCollapsed` with raw objects instead of stringifying everything to JSON, and the DMK logger emits a clearer `DMK[tag]` log type (with backward-compatible filtering in the logs viewer) instead of the generic `live-dmk-logger`.

- [#17436](https://github.com/LedgerHQ/ledger-live/pull/17436) [`74e82f8`](https://github.com/LedgerHQ/ledger-live/commit/74e82f86ca04fa499207a9f80ea8b13a1c088e00) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Reduce `EnsureAppReadyState` installing-app variant to `{ type }` only so consecutive emissions during installation dedupe via deep-equality and render at most once

- [#17578](https://github.com/LedgerHQ/ledger-live/pull/17578) [`75b3b3c`](https://github.com/LedgerHQ/ledger-live/commit/75b3b3cf569a9fe99774cf6e8dffdd18643b5d66) Thanks [@qperrot](https://github.com/qperrot)! - fix(live-dmk-shared): handle Node.js 22 ESM/CJS interop for hw-transport default import

  When loaded via require() in Node.js 22, @ledgerhq/hw-transport resolves to its
  CJS build where the class is exposed as `module.exports.default`. Unwrap the
  default export with a fallback so DmkCompatTransport can correctly extend Transport
  in both ESM and CJS environments.

## 0.25.0-next.0

### Minor Changes

- [#17583](https://github.com/LedgerHQ/ledger-live/pull/17583) [`157ec37`](https://github.com/LedgerHQ/ledger-live/commit/157ec37d05d79cfe30fcc8e85c228418643c6f84) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix sticky user interaction state in EnsureAppReady pending mapping: when ConnectApp reports `UserInteractionRequired.None` without an install plan, emit a generic loading state instead of returning null so the UI no longer remains stuck on the previous interaction prompt.

- [#17617](https://github.com/LedgerHQ/ledger-live/pull/17617) [`6cbcbdd`](https://github.com/LedgerHQ/ledger-live/commit/6cbcbdda1489face530378a12bfcfc2a60b4c0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Improve console log readability when debugging via Chrome / React Native DevTools: mobile's `ConsoleLogger` now uses `console.groupCollapsed` with raw objects instead of stringifying everything to JSON, and the DMK logger emits a clearer `DMK[tag]` log type (with backward-compatible filtering in the logs viewer) instead of the generic `live-dmk-logger`.

- [#17436](https://github.com/LedgerHQ/ledger-live/pull/17436) [`74e82f8`](https://github.com/LedgerHQ/ledger-live/commit/74e82f86ca04fa499207a9f80ea8b13a1c088e00) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Reduce `EnsureAppReadyState` installing-app variant to `{ type }` only so consecutive emissions during installation dedupe via deep-equality and render at most once

- [#17578](https://github.com/LedgerHQ/ledger-live/pull/17578) [`75b3b3c`](https://github.com/LedgerHQ/ledger-live/commit/75b3b3cf569a9fe99774cf6e8dffdd18643b5d66) Thanks [@qperrot](https://github.com/qperrot)! - fix(live-dmk-shared): handle Node.js 22 ESM/CJS interop for hw-transport default import

  When loaded via require() in Node.js 22, @ledgerhq/hw-transport resolves to its
  CJS build where the class is exposed as `module.exports.default`. Unwrap the
  default export with a fallback so DmkCompatTransport can correctly extend Transport
  in both ESM and CJS environments.

## 0.24.0

### Minor Changes

- [#17020](https://github.com/LedgerHQ/ledger-live/pull/17020) [`4625078`](https://github.com/LedgerHQ/ledger-live/commit/462507883d8bb586d243ed7815081830a1de3b4c) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add DmkCompatTransport: LedgerJS-like Transport wrapper around a DMK session

- [#17020](https://github.com/LedgerHQ/ledger-live/pull/17020) [`d285678`](https://github.com/LedgerHQ/ledger-live/commit/d28567854ca5ebf7c02c66403d8b2c7406c7abff) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add DMK-native ensure-app-ready initialization with UI-ready device action states

- [#17277](https://github.com/LedgerHQ/ledger-live/pull/17277) [`1c92446`](https://github.com/LedgerHQ/ledger-live/commit/1c92446d0b82e8b239d1739dd046cfbf6360f5c4) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add a persisted all-transport known devices slice for Ledger Live Mobile.

- [#17360](https://github.com/LedgerHQ/ledger-live/pull/17360) [`fffc4a3`](https://github.com/LedgerHQ/ledger-live/commit/fffc4a37b4a1ef2a2bc6c77e706bf22bed574329) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove unused useDeviceSessionState

## 0.24.0-next.0

### Minor Changes

- [#17020](https://github.com/LedgerHQ/ledger-live/pull/17020) [`4625078`](https://github.com/LedgerHQ/ledger-live/commit/462507883d8bb586d243ed7815081830a1de3b4c) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add DmkCompatTransport: LedgerJS-like Transport wrapper around a DMK session

- [#17020](https://github.com/LedgerHQ/ledger-live/pull/17020) [`d285678`](https://github.com/LedgerHQ/ledger-live/commit/d28567854ca5ebf7c02c66403d8b2c7406c7abff) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add DMK-native ensure-app-ready initialization with UI-ready device action states

- [#17277](https://github.com/LedgerHQ/ledger-live/pull/17277) [`1c92446`](https://github.com/LedgerHQ/ledger-live/commit/1c92446d0b82e8b239d1739dd046cfbf6360f5c4) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add a persisted all-transport known devices slice for Ledger Live Mobile.

- [#17360](https://github.com/LedgerHQ/ledger-live/pull/17360) [`fffc4a3`](https://github.com/LedgerHQ/ledger-live/commit/fffc4a37b4a1ef2a2bc6c77e706bf22bed574329) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove unused useDeviceSessionState

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
