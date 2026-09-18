# @support/jest-features-flow

## 0.5.0-next.0

### Minor Changes

- [#21722](https://github.com/LedgerHQ/ledger-live/pull/21722) [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Card Details container with native artwork, Details sheet, and web composition

- [#21754](https://github.com/LedgerHQ/ledger-live/pull/21754) [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the native card details overview, freeze confirmation and More menu as scenes inside a single bottom sheet

- [#21958](https://github.com/LedgerHQ/ledger-live/pull/21958) [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the desktop Pay Card transaction detail dialog.

- [#21848](https://github.com/LedgerHQ/ledger-live/pull/21848) [`0caf4f9`](https://github.com/LedgerHQ/ledger-live/commit/0caf4f998525a28ed5a918923c3575183b9e3e81) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix unstable Proxy component references and enable userEvent.press on Lumen natives

- [#21663](https://github.com/LedgerHQ/ledger-live/pull/21663) [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mark a frozen pay card on the card visual: the card face fades out behind a centered snow `Spot`, read from the same card status the freeze tile uses. The features/flow jest projects now compile `@ledgerhq/lumen-utils-shared` instead of leaving its ESM untransformed, so views can use `cn`.

- [#21947](https://github.com/LedgerHQ/ledger-live/pull/21947) [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay Card transaction detail sheet with tracking and copyable transaction IDs.

## 0.4.0

### Minor Changes

- [#21408](https://github.com/LedgerHQ/ledger-live/pull/21408) [`c270975`](https://github.com/LedgerHQ/ledger-live/commit/c2709750e007b758fa13f0f717efa897fcc6235d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a first-time Popover on desktop Pay Request Verify.

- [#21397](https://github.com/LedgerHQ/ledger-live/pull/21397) [`2fe4ef6`](https://github.com/LedgerHQ/ledger-live/commit/2fe4ef6fabb69dbbb38f4bf8517e7d52f9b35b43) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire Pay contact tile press to send (prefill a single-address contact), add a desktop View contact overflow action, and render Lumen `MenuTrigger` `render` props in the shared web passthrough stub.

- [#21577](https://github.com/LedgerHQ/ledger-live/pull/21577) [`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Ship a QueuedBottomSheet test double from `@shared/ui-queued-bottom-sheet/testing` and map it by default in the features/flow native jest project, so sheet-hosting views no longer hand-roll a mock per test.

## 0.4.0-next.0

### Minor Changes

- [#21408](https://github.com/LedgerHQ/ledger-live/pull/21408) [`c270975`](https://github.com/LedgerHQ/ledger-live/commit/c2709750e007b758fa13f0f717efa897fcc6235d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a first-time Popover on desktop Pay Request Verify.

- [#21397](https://github.com/LedgerHQ/ledger-live/pull/21397) [`2fe4ef6`](https://github.com/LedgerHQ/ledger-live/commit/2fe4ef6fabb69dbbb38f4bf8517e7d52f9b35b43) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire Pay contact tile press to send (prefill a single-address contact), add a desktop View contact overflow action, and render Lumen `MenuTrigger` `render` props in the shared web passthrough stub.

- [#21577](https://github.com/LedgerHQ/ledger-live/pull/21577) [`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Ship a QueuedBottomSheet test double from `@shared/ui-queued-bottom-sheet/testing` and map it by default in the features/flow native jest project, so sheet-hosting views no longer hand-roll a mock per test.

## 0.3.0

### Minor Changes

- [#21209](https://github.com/LedgerHQ/ledger-live/pull/21209) [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay contacts empty state to the shared Add contact dialog, Ledger Sync gate, and a host-injected `createContactCreationPort`.

- [#21141](https://github.com/LedgerHQ/ledger-live/pull/21141) [`e2f2cfa`](https://github.com/LedgerHQ/ledger-live/commit/e2f2cfa372605742ff6ef29f4e56d9a77fdb86be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Migrate the DeviceActionContent component into a new `@features/platform-device-action-content` package so DDD flows can render it, decoupling it from the `DeviceModelId` enum. Also render Lumen `Tag` labels and `Banner` titles as text in the shared web/native passthrough test stubs.

  The package now exposes `getDeviceActionAnimation`, and both apps resolve their pin/continue device animations through it instead of keeping byte-identical copies of the same 20 Lottie files each. This drops ~2.5 MB of duplicated animation JSON from the desktop and mobile bundles.

  `@features/platform-style` gains `useThemeVariant()`, returning the active `"light" | "dark"` variant from the style provider both apps already mount, plus a `./hooks` entry point so reading it doesn't pull the providers into a consumer's bundle. DeviceActionContent picks its animation through that hook, so neither app injects a theme any more and the component can be used from deeply nested `features/` trees. It reads the styled-components context directly rather than `useTheme`, which throws when no provider is mounted.

## 0.3.0-next.0

### Minor Changes

- [#21209](https://github.com/LedgerHQ/ledger-live/pull/21209) [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay contacts empty state to the shared Add contact dialog, Ledger Sync gate, and a host-injected `createContactCreationPort`.

- [#21141](https://github.com/LedgerHQ/ledger-live/pull/21141) [`e2f2cfa`](https://github.com/LedgerHQ/ledger-live/commit/e2f2cfa372605742ff6ef29f4e56d9a77fdb86be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Migrate the DeviceActionContent component into a new `@features/platform-device-action-content` package so DDD flows can render it, decoupling it from the `DeviceModelId` enum. Also render Lumen `Tag` labels and `Banner` titles as text in the shared web/native passthrough test stubs.

  The package now exposes `getDeviceActionAnimation`, and both apps resolve their pin/continue device animations through it instead of keeping byte-identical copies of the same 20 Lottie files each. This drops ~2.5 MB of duplicated animation JSON from the desktop and mobile bundles.

  `@features/platform-style` gains `useThemeVariant()`, returning the active `"light" | "dark"` variant from the style provider both apps already mount, plus a `./hooks` entry point so reading it doesn't pull the providers into a consumer's bundle. DeviceActionContent picks its animation through that hook, so neither app injects a theme any more and the component can be used from deeply nested `features/` trees. It reads the styled-components context directly rather than `useTheme`, which throws when no provider is mounted.

## 0.2.0

### Minor Changes

- [#20500](https://github.com/LedgerHQ/ledger-live/pull/20500) [`71b1069`](https://github.com/LedgerHQ/ledger-live/commit/71b1069ae8358b4d3fa3a6a5d4fb2d49f1c1c7d7) Thanks [@deepyjr](https://github.com/deepyjr)! - Use shared Lumen test primitives across Contacts tests.

## 0.2.0-next.0

### Minor Changes

- [#20500](https://github.com/LedgerHQ/ledger-live/pull/20500) [`71b1069`](https://github.com/LedgerHQ/ledger-live/commit/71b1069ae8358b4d3fa3a6a5d4fb2d49f1c1c7d7) Thanks [@deepyjr](https://github.com/deepyjr)! - Use shared Lumen test primitives across Contacts tests.
