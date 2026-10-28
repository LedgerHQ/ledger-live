# @features/platform-device-action-content

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`6f774fb`](https://github.com/LedgerHQ/ledger-live/commit/6f774fb511e4190d4d0cf51bad655e707f3d0eb9), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`675d1ca`](https://github.com/LedgerHQ/ledger-live/commit/675d1ca015c7d75a9ec3404c72a86896db7c1d06), [`cc576e8`](https://github.com/LedgerHQ/ledger-live/commit/cc576e8bd942a354cc428053b2b1da54489d1ff0)]:
  - @shared/lottie@0.1.0-next.0
  - @features/platform-style@0.5.0-next.0

## 0.4.0

### Minor Changes

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

- [#23140](https://github.com/LedgerHQ/ledger-live/pull/23140) [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Play Lottie animations through the new `@shared/lottie` package: dotlottie on web (replacing the unmaintained `react-lottie` / `lottie-web`), `lottie-react-native` on mobile.

### Patch Changes

- Updated dependencies []:
  - @shared/lottie@0.0.0
  - @features/platform-style@0.4.0

## 0.4.0-next.0

### Minor Changes

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

- [#23140](https://github.com/LedgerHQ/ledger-live/pull/23140) [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Play Lottie animations through the new `@shared/lottie` package: dotlottie on web (replacing the unmaintained `react-lottie` / `lottie-web`), `lottie-react-native` on mobile.

### Patch Changes

- Updated dependencies []:
  - @shared/lottie@0.0.0
  - @features/platform-style@0.4.0

## 0.3.0

### Minor Changes

- [#22563](https://github.com/LedgerHQ/ledger-live/pull/22563) [`3e7af98`](https://github.com/LedgerHQ/ledger-live/commit/3e7af98196476c04a97522109fded33cc17dc868) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump react-native-config to 1.7.2 and drop its pnpmfile peer patch

## 0.3.0-next.0

### Minor Changes

- [#22563](https://github.com/LedgerHQ/ledger-live/pull/22563) [`3e7af98`](https://github.com/LedgerHQ/ledger-live/commit/3e7af98196476c04a97522109fded33cc17dc868) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump react-native-config to 1.7.2 and drop its pnpmfile peer patch

## 0.2.1

### Patch Changes

- Updated dependencies [[`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141)]:
  - @features/platform-style@0.4.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141)]:
  - @features/platform-style@0.4.0-next.0

## 0.2.0

### Minor Changes

- [#21141](https://github.com/LedgerHQ/ledger-live/pull/21141) [`e2f2cfa`](https://github.com/LedgerHQ/ledger-live/commit/e2f2cfa372605742ff6ef29f4e56d9a77fdb86be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Migrate the DeviceActionContent component into a new `@features/platform-device-action-content` package so DDD flows can render it, decoupling it from the `DeviceModelId` enum. Also render Lumen `Tag` labels and `Banner` titles as text in the shared web/native passthrough test stubs.

  The package now exposes `getDeviceActionAnimation`, and both apps resolve their pin/continue device animations through it instead of keeping byte-identical copies of the same 20 Lottie files each. This drops ~2.5 MB of duplicated animation JSON from the desktop and mobile bundles.

  `@features/platform-style` gains `useThemeVariant()`, returning the active `"light" | "dark"` variant from the style provider both apps already mount, plus a `./hooks` entry point so reading it doesn't pull the providers into a consumer's bundle. DeviceActionContent picks its animation through that hook, so neither app injects a theme any more and the component can be used from deeply nested `features/` trees. It reads the styled-components context directly rather than `useTheme`, which throws when no provider is mounted.

### Patch Changes

- Updated dependencies [[`e2f2cfa`](https://github.com/LedgerHQ/ledger-live/commit/e2f2cfa372605742ff6ef29f4e56d9a77fdb86be)]:
  - @features/platform-style@0.3.0

## 0.2.0-next.0

### Minor Changes

- [#21141](https://github.com/LedgerHQ/ledger-live/pull/21141) [`e2f2cfa`](https://github.com/LedgerHQ/ledger-live/commit/e2f2cfa372605742ff6ef29f4e56d9a77fdb86be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Migrate the DeviceActionContent component into a new `@features/platform-device-action-content` package so DDD flows can render it, decoupling it from the `DeviceModelId` enum. Also render Lumen `Tag` labels and `Banner` titles as text in the shared web/native passthrough test stubs.

  The package now exposes `getDeviceActionAnimation`, and both apps resolve their pin/continue device animations through it instead of keeping byte-identical copies of the same 20 Lottie files each. This drops ~2.5 MB of duplicated animation JSON from the desktop and mobile bundles.

  `@features/platform-style` gains `useThemeVariant()`, returning the active `"light" | "dark"` variant from the style provider both apps already mount, plus a `./hooks` entry point so reading it doesn't pull the providers into a consumer's bundle. DeviceActionContent picks its animation through that hook, so neither app injects a theme any more and the component can be used from deeply nested `features/` trees. It reads the styled-components context directly rather than `useTheme`, which throws when no provider is mounted.

### Patch Changes

- Updated dependencies [[`e2f2cfa`](https://github.com/LedgerHQ/ledger-live/commit/e2f2cfa372605742ff6ef29f4e56d9a77fdb86be)]:
  - @features/platform-style@0.3.0-next.0
