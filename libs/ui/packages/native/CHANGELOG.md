# @ledgerhq/native-ui

## 0.17.0

### Minor Changes

- [#2843](https://github.com/LedgerHQ/ledger-live/pull/2843) [`61848df7ef`](https://github.com/LedgerHQ/ledger-live/commit/61848df7eff1abfef330585ca96b1688c858c637) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Fix metro config (forced dependencies)
  ContinueOnDevice: new UI item to indicate the user to continue on the device
  Divider: add a `text` prop to display some text in the middle of the divider
  VerticalTimeline: new appearance (colors, fonts, dashed lines, icon sizes)
  VerticalTimeline: make it scrollable (no need to wrap it in a ScrollView)
  VerticalTimeline: add auto scrolling to active item
  VerticalTimeline: add `header?: React.ReactNode | null` prop
  VerticalTimeline: expose `BodyText` and `SubtitleText` components
  Storybook - VerticalTimeline: more exhaustive examples

## 0.17.0-next.0

### Minor Changes

- [#2843](https://github.com/LedgerHQ/ledger-live/pull/2843) [`61848df7ef`](https://github.com/LedgerHQ/ledger-live/commit/61848df7eff1abfef330585ca96b1688c858c637) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Fix metro config (forced dependencies)
  ContinueOnDevice: new UI item to indicate the user to continue on the device
  Divider: add a `text` prop to display some text in the middle of the divider
  VerticalTimeline: new appearance (colors, fonts, dashed lines, icon sizes)
  VerticalTimeline: make it scrollable (no need to wrap it in a ScrollView)
  VerticalTimeline: add auto scrolling to active item
  VerticalTimeline: add `header?: React.ReactNode | null` prop
  VerticalTimeline: expose `BodyText` and `SubtitleText` components
  Storybook - VerticalTimeline: more exhaustive examples

## 0.16.0

### Minor Changes

- [#2713](https://github.com/LedgerHQ/ledger-live/pull/2713) [`0840cfeab8`](https://github.com/LedgerHQ/ledger-live/commit/0840cfeab8d7d3a75def5de22285b913ad049d5a) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a new VerticalStepper component to Natie UI, similar to the VerticalTimeline but featuring a new design and nesting capabilities

### Patch Changes

- [#2733](https://github.com/LedgerHQ/ledger-live/pull/2733) [`0272d44dff`](https://github.com/LedgerHQ/ledger-live/commit/0272d44dff11e356858f666b962b65025d2029eb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Remove cycle dependencies

- Updated dependencies [[`13a71f1cb2`](https://github.com/LedgerHQ/ledger-live/commit/13a71f1cb24fa254a2ed0b2db7f0d7b8f32465b5)]:
  - @ledgerhq/icons-ui@0.3.5

## 0.16.0-next.0

### Minor Changes

- [#2713](https://github.com/LedgerHQ/ledger-live/pull/2713) [`0840cfeab8`](https://github.com/LedgerHQ/ledger-live/commit/0840cfeab8d7d3a75def5de22285b913ad049d5a) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a new VerticalStepper component to Natie UI, similar to the VerticalTimeline but featuring a new design and nesting capabilities

### Patch Changes

- [#2733](https://github.com/LedgerHQ/ledger-live/pull/2733) [`0272d44dff`](https://github.com/LedgerHQ/ledger-live/commit/0272d44dff11e356858f666b962b65025d2029eb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Remove cycle dependencies

- Updated dependencies [[`13a71f1cb2`](https://github.com/LedgerHQ/ledger-live/commit/13a71f1cb24fa254a2ed0b2db7f0d7b8f32465b5)]:
  - @ledgerhq/icons-ui@0.3.5-next.0

## 0.15.1

### Patch Changes

- [#2503](https://github.com/LedgerHQ/ledger-live/pull/2503) [`aed44f43b2`](https://github.com/LedgerHQ/ledger-live/commit/aed44f43b26fa9b60822c0754ba384412b9b236a) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Minor ui modifications to Link, FullBackgroundCard and SideImageCard components

- [#2519](https://github.com/LedgerHQ/ledger-live/pull/2519) [`68c0a2a2ac`](https://github.com/LedgerHQ/ledger-live/commit/68c0a2a2ac2080ec7de069ceb2053737f44f2a4b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: onModalHide passed down to ReactNativeModal

  `BaseModal` was not passing down `onModalHide` to `ReactNativeModal`. Until this, `onModalHide={onClose}`, making `onClose` being called twice (once when the user closes the modal, once when the modal is hidden) and `onModalHide` being never called.

  The fix is a workaround so we don't break legacy components that use `BaseModal`. The long-term fix would be to have `onModalHide={onModalHide}` and make sure every usage on `onClose` in the consumers of this component expect the correct behavior.

## 0.15.1-next.0

### Patch Changes

- [#2503](https://github.com/LedgerHQ/ledger-live/pull/2503) [`aed44f43b2`](https://github.com/LedgerHQ/ledger-live/commit/aed44f43b26fa9b60822c0754ba384412b9b236a) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Minor ui modifications to Link, FullBackgroundCard and SideImageCard components

- [#2519](https://github.com/LedgerHQ/ledger-live/pull/2519) [`68c0a2a2ac`](https://github.com/LedgerHQ/ledger-live/commit/68c0a2a2ac2080ec7de069ceb2053737f44f2a4b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: onModalHide passed down to ReactNativeModal

  `BaseModal` was not passing down `onModalHide` to `ReactNativeModal`. Until this, `onModalHide={onClose}`, making `onClose` being called twice (once when the user closes the modal, once when the modal is hidden) and `onModalHide` being never called.

  The fix is a workaround so we don't break legacy components that use `BaseModal`. The long-term fix would be to have `onModalHide={onModalHide}` and make sure every usage on `onClose` in the consumers of this component expect the correct behavior.

## 0.15.0

### Minor Changes

- [#2081](https://github.com/LedgerHQ/ledger-live/pull/2081) [`87826dce62`](https://github.com/LedgerHQ/ledger-live/commit/87826dce627602cef94cf4831c17251069b92076) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Native UI - NotificationCard component added to the ui library

### Patch Changes

- [#2071](https://github.com/LedgerHQ/ledger-live/pull/2071) [`cc3c591bdc`](https://github.com/LedgerHQ/ledger-live/commit/cc3c591bdcb31df5882210fa43928603c2bcb200) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - fix ratings modal close behavior

- Updated dependencies [[`5266518d0b`](https://github.com/LedgerHQ/ledger-live/commit/5266518d0baf26258f95a08d7f0a127f1848b38f)]:
  - @ledgerhq/icons-ui@0.3.4

## 0.15.0-next.0

### Minor Changes

- [#2081](https://github.com/LedgerHQ/ledger-live/pull/2081) [`87826dce62`](https://github.com/LedgerHQ/ledger-live/commit/87826dce627602cef94cf4831c17251069b92076) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Native UI - NotificationCard component added to the ui library

### Patch Changes

- [#2071](https://github.com/LedgerHQ/ledger-live/pull/2071) [`cc3c591bdc`](https://github.com/LedgerHQ/ledger-live/commit/cc3c591bdcb31df5882210fa43928603c2bcb200) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - fix ratings modal close behavior

- Updated dependencies [[`5266518d0b`](https://github.com/LedgerHQ/ledger-live/commit/5266518d0baf26258f95a08d7f0a127f1848b38f)]:
  - @ledgerhq/icons-ui@0.3.4-next.0

## 0.14.0

### Minor Changes

- [#1802](https://github.com/LedgerHQ/ledger-live/pull/1802) [`b01f9f5c02`](https://github.com/LedgerHQ/ledger-live/commit/b01f9f5c02ef255738b557daba38c1d9f13ee8fe) Thanks [@LFBarreto](https://github.com/LFBarreto)! - NativeUI - add colo and text Color to tag component

### Patch Changes

- Updated dependencies [[`32993aea9a`](https://github.com/LedgerHQ/ledger-live/commit/32993aea9af5dfb7f2519263e5f2a22a88320cdc)]:
  - @ledgerhq/icons-ui@0.3.3

## 0.14.0-next.0

### Minor Changes

- [#1802](https://github.com/LedgerHQ/ledger-live/pull/1802) [`b01f9f5c02`](https://github.com/LedgerHQ/ledger-live/commit/b01f9f5c02ef255738b557daba38c1d9f13ee8fe) Thanks [@LFBarreto](https://github.com/LFBarreto)! - NativeUI - add colo and text Color to tag component

### Patch Changes

- Updated dependencies [[`32993aea9a`](https://github.com/LedgerHQ/ledger-live/commit/32993aea9af5dfb7f2519263e5f2a22a88320cdc)]:
  - @ledgerhq/icons-ui@0.3.3-next.0

## 0.13.0

### Minor Changes

- [#1831](https://github.com/LedgerHQ/ledger-live/pull/1831) [`8ac70e5cca`](https://github.com/LedgerHQ/ledger-live/commit/8ac70e5ccab58159c646f23694c1da13ebc00248) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Two Cards components (FullBackgroundCard and SideImageCard) added to the native-ui lib

### Patch Changes

- Updated dependencies [[`e3222832ba`](https://github.com/LedgerHQ/ledger-live/commit/e3222832ba1fc7f90940fe637bf4a29361a72d94), [`1269f149ae`](https://github.com/LedgerHQ/ledger-live/commit/1269f149aef5d842eddd83beb64ae65240c3dc0f)]:
  - @ledgerhq/icons-ui@0.3.2

## 0.13.0-next.0

### Minor Changes

- [#1831](https://github.com/LedgerHQ/ledger-live/pull/1831) [`8ac70e5cca`](https://github.com/LedgerHQ/ledger-live/commit/8ac70e5ccab58159c646f23694c1da13ebc00248) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Two Cards components (FullBackgroundCard and SideImageCard) added to the native-ui lib

### Patch Changes

- Updated dependencies [[`e3222832ba`](https://github.com/LedgerHQ/ledger-live/commit/e3222832ba1fc7f90940fe637bf4a29361a72d94), [`1269f149ae`](https://github.com/LedgerHQ/ledger-live/commit/1269f149aef5d842eddd83beb64ae65240c3dc0f)]:
  - @ledgerhq/icons-ui@0.3.2-next.0

## 0.12.2

### Patch Changes

- [#1936](https://github.com/LedgerHQ/ledger-live/pull/1936) [`7aa0e616b3`](https://github.com/LedgerHQ/ledger-live/commit/7aa0e616b3dab8e218fea8631c3aa8b894dfc8f1) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed PNG icons for boxed ProviderIcons and replaced them with svg(r)

* [#1759](https://github.com/LedgerHQ/ledger-live/pull/1759) [`77622be003`](https://github.com/LedgerHQ/ledger-live/commit/77622be0033cb7af6ac1284b302ac62e4825652b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - VerticalTimeline: fix item title long text layout & remove item vertical scroll indicator

* Updated dependencies [[`7aa0e616b3`](https://github.com/LedgerHQ/ledger-live/commit/7aa0e616b3dab8e218fea8631c3aa8b894dfc8f1), [`828af17431`](https://github.com/LedgerHQ/ledger-live/commit/828af1743180ccf0f21a7de143cb910ef7258407)]:
  - @ledgerhq/icons-ui@0.3.1

## 0.12.2-next.0

### Patch Changes

- [#1936](https://github.com/LedgerHQ/ledger-live/pull/1936) [`7aa0e616b3`](https://github.com/LedgerHQ/ledger-live/commit/7aa0e616b3dab8e218fea8631c3aa8b894dfc8f1) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed PNG icons for boxed ProviderIcons and replaced them with svg(r)

* [#1759](https://github.com/LedgerHQ/ledger-live/pull/1759) [`77622be003`](https://github.com/LedgerHQ/ledger-live/commit/77622be0033cb7af6ac1284b302ac62e4825652b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - VerticalTimeline: fix item title long text layout & remove item vertical scroll indicator

* Updated dependencies [[`7aa0e616b3`](https://github.com/LedgerHQ/ledger-live/commit/7aa0e616b3dab8e218fea8631c3aa8b894dfc8f1), [`828af17431`](https://github.com/LedgerHQ/ledger-live/commit/828af1743180ccf0f21a7de143cb910ef7258407)]:
  - @ledgerhq/icons-ui@0.3.1-next.0

## 0.12.1

### Patch Changes

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

- Updated dependencies [[`7495373f8b`](https://github.com/LedgerHQ/ledger-live/commit/7495373f8b4690ce5b7b48410f3e4e47bf2555f4), [`f7a162c356`](https://github.com/LedgerHQ/ledger-live/commit/f7a162c356a0cd84b6eb635493ee56af06e306e5), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/icons-ui@0.3.0
  - @ledgerhq/crypto-icons-ui@0.2.1
  - @ledgerhq/ui-shared@0.1.10

## 0.12.1-next.0

### Patch Changes

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

- Updated dependencies [[`7495373f8b`](https://github.com/LedgerHQ/ledger-live/commit/7495373f8b4690ce5b7b48410f3e4e47bf2555f4), [`f7a162c356`](https://github.com/LedgerHQ/ledger-live/commit/f7a162c356a0cd84b6eb635493ee56af06e306e5), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/icons-ui@0.3.0-next.0
  - @ledgerhq/crypto-icons-ui@0.2.1-next.0
  - @ledgerhq/ui-shared@0.1.10-next.0

## 0.12.0

### Minor Changes

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add a vertical timeline component to Native UI

### Patch Changes

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Sync onboarding software checks UI

  - handling unlock device during genuine check

## 0.12.0-next.0

### Minor Changes

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add a vertical timeline component to Native UI

### Patch Changes

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Sync onboarding software checks UI

  - handling unlock device during genuine check

## 0.11.0

### Minor Changes

- [#1457](https://github.com/LedgerHQ/ledger-live/pull/1457) [`4ec8df33ea`](https://github.com/LedgerHQ/ledger-live/commit/4ec8df33ea223c412cb81892bf0380d456e19b54) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a new vertical timeline component

### Patch Changes

- [#1480](https://github.com/LedgerHQ/ledger-live/pull/1480) [`22725d35e5`](https://github.com/LedgerHQ/ledger-live/commit/22725d35e59c79759e7cdd295ac5b7ebbb774ee2) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - VerticalTimeline: add dynamic height capability (with animation)

## 0.11.0-next.0

### Minor Changes

- [#1457](https://github.com/LedgerHQ/ledger-live/pull/1457) [`4ec8df33ea`](https://github.com/LedgerHQ/ledger-live/commit/4ec8df33ea223c412cb81892bf0380d456e19b54) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a new vertical timeline component

### Patch Changes

- [#1480](https://github.com/LedgerHQ/ledger-live/pull/1480) [`22725d35e5`](https://github.com/LedgerHQ/ledger-live/commit/22725d35e59c79759e7cdd295ac5b7ebbb774ee2) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - VerticalTimeline: add dynamic height capability (with animation)

## 0.10.0

### Minor Changes

- [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Add a Divider component to the UI lib

### Patch Changes

- [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add "delay" prop to Transitions.Fade

* [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add largeLineHeight text variant

- [#1293](https://github.com/LedgerHQ/ledger-live/pull/1293) [`b0a7e35a0f`](https://github.com/LedgerHQ/ledger-live/commit/b0a7e35a0f7a85732d1f7bef6ae3144fdf0b8b24) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Improvements for the crypto icons library

## 0.10.0-next.0

### Minor Changes

- [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Add a Divider component to the UI lib

### Patch Changes

- [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add "delay" prop to Transitions.Fade

* [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add largeLineHeight text variant

- [#1293](https://github.com/LedgerHQ/ledger-live/pull/1293) [`b0a7e35a0f`](https://github.com/LedgerHQ/ledger-live/commit/b0a7e35a0f7a85732d1f7bef6ae3144fdf0b8b24) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Improvements for the crypto icons library

## 0.9.0

### Minor Changes

- [#968](https://github.com/LedgerHQ/ledger-live/pull/968) [`2fd6f6244c`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Tag component: change appearance (new design)

* [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Add a Divider component to the UI lib

- [#935](https://github.com/LedgerHQ/ledger-live/pull/935) [`432cfa8994`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb) Thanks [@LFBarreto](https://github.com/LFBarreto)! - UI - Crypto icons added as a standalone package + added helper components to integrate them and ensure color contrast

* [#976](https://github.com/LedgerHQ/ledger-live/pull/976) [`f28d403542`](https://github.com/LedgerHQ/ledger-live/commit/f28d4035426e741822108daf172f4509ce030751) Thanks [@grsoares21](https://github.com/grsoares21)! - Add Divider component to the native ui

- [#968](https://github.com/LedgerHQ/ledger-live/pull/968) [`2fd6f6244c`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Tag component: remove "active" prop

### Patch Changes

- [#891](https://github.com/LedgerHQ/ledger-live/pull/891) [`092a887af5`](https://github.com/LedgerHQ/ledger-live/commit/092a887af5a1405a1de3704bc5954c761cd53457) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add h1Inter text variant (h1 with Inter font)

- Updated dependencies [[`432cfa8994`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb)]:
  - @ledgerhq/crypto-icons-ui@0.2.0

## 0.9.0-next.1

### Minor Changes

- [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Add a Divider component to the UI lib

## 0.9.0-next.0

### Minor Changes

- [#968](https://github.com/LedgerHQ/ledger-live/pull/968) [`2fd6f6244`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Tag component: change appearance (new design)

* [#935](https://github.com/LedgerHQ/ledger-live/pull/935) [`432cfa899`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb) Thanks [@LFBarreto](https://github.com/LFBarreto)! - UI - Crypto icons added as a standalone package + added helper components to integrate them and ensure color contrast

- [#976](https://github.com/LedgerHQ/ledger-live/pull/976) [`f28d40354`](https://github.com/LedgerHQ/ledger-live/commit/f28d4035426e741822108daf172f4509ce030751) Thanks [@grsoares21](https://github.com/grsoares21)! - Add Divider component to the native ui

* [#968](https://github.com/LedgerHQ/ledger-live/pull/968) [`2fd6f6244`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Tag component: remove "active" prop

### Patch Changes

- [#891](https://github.com/LedgerHQ/ledger-live/pull/891) [`092a887af`](https://github.com/LedgerHQ/ledger-live/commit/092a887af5a1405a1de3704bc5954c761cd53457) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add h1Inter text variant (h1 with Inter font)

- Updated dependencies [[`432cfa899`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb)]:
  - @ledgerhq/crypto-icons-ui@0.2.0-next.0

## 0.8.3

### Patch Changes

- [#834](https://github.com/LedgerHQ/ledger-live/pull/834) [`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86) Thanks [@LFBarreto](https://github.com/LFBarreto)! - Button component uses correct TouchableOpacity instead of Highlight

* [#440](https://github.com/LedgerHQ/ledger-live/pull/440) [`858898d63`](https://github.com/LedgerHQ/ledger-live/commit/858898d63b3d70dc0be4cefbeaba5770c389660b) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - UI - native - notifications component styles extended

## 0.8.3-next.1

### Patch Changes

- [#834](https://github.com/LedgerHQ/ledger-live/pull/834) [`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86) Thanks [@LFBarreto](https://github.com/LFBarreto)! - Button component uses correct TouchableOpacity instead of Highlight

## 0.8.3-next.0

### Patch Changes

- [#440](https://github.com/LedgerHQ/ledger-live/pull/440) [`858898d63`](https://github.com/LedgerHQ/ledger-live/commit/858898d63b3d70dc0be4cefbeaba5770c389660b) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - UI - native - notifications component styles extended

## 0.8.2

### Patch Changes

- Updated dependencies [[`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/icons-ui@0.2.7

## 0.8.2-next.0

### Patch Changes

- Updated dependencies [[`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/icons-ui@0.2.7-next.0

## 0.8.1

### Patch Changes

- Updated dependencies [[`429df1cff`](https://github.com/LedgerHQ/ledger-live/commit/429df1cff3cf204ff57200553a808d25c8ff413f)]:
  - @ledgerhq/icons-ui@0.2.6

## 0.8.1-next.0

### Patch Changes

- Updated dependencies [429df1cff]
  - @ledgerhq/icons-ui@0.2.6-next.0

## 0.8.0

### Minor Changes

- 592ad2f7b: Update design on upsell modal in mobile app. Also add new variants and shape to IconBoxList and BoxedIcon components in native UI.

### Patch Changes

- dd6a12c9b: Fix ScrollListContainer ref not being forwarded to FlatList
- 0c2c6682b: ui packages - release
- Updated dependencies [0c2c6682b]
  - @ledgerhq/ui-shared@0.1.9
  - @ledgerhq/icons-ui@0.2.5

## 0.8.0-next.2

### Patch Changes

- 0c2c6682b: ui packages - release
- Updated dependencies [0c2c6682b]
  - @ledgerhq/ui-shared@0.1.9-next.0
  - @ledgerhq/icons-ui@0.2.5-next.0

## 0.8.0-next.1

### Minor Changes

- 592ad2f7b: Update design on upsell modal in mobile app. Also add new variants and shape to IconBoxList and BoxedIcon components in native UI.

## 0.7.19-next.0

### Patch Changes

- dd6a12c9b: Fix ScrollListContainer ref not being forwarded to FlatList

## 0.7.18

### Patch Changes

- f686ec781: UI - shared colors - added new colors to shared themes
- Updated dependencies [f686ec781]
  - @ledgerhq/ui-shared@0.1.8

## 0.7.18-next.0

### Patch Changes

- f686ec781: UI - shared colors - added new colors to shared themes
- Updated dependencies [f686ec781]
  - @ledgerhq/ui-shared@0.1.8-next.0
