# live-mobile

## 3.8.0-next.6

### Patch Changes

- [#756](https://github.com/LedgerHQ/ledger-live/pull/756) [`708f647d88`](https://github.com/LedgerHQ/ledger-live/commit/708f647d88ae484b5f1829fcab64139561bbd21f) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent navigation without user confirmation with ongoing installs/uninstalls
- Updated dependencies [[`3849ee3f30`](https://github.com/LedmgerHQ/ledger-live/commit/3849ee3f30987b51d648ce29bfee4721f4ddff5f)]:
  - @ledgerhq/live-common@27.1.0-next.6

## 3.8.0-next.5

### Patch Changes

- [#1097](https://github.com/LedgerHQ/ledger-live/pull/1097) [`936b6dc545`](https://github.com/LedgerHQ/ledger-live/commit/936b6dc5450fcd69a31e03fa2040346d512c0912) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New BLE pairing flow

  Not yet used in production. Accessible from the debug menu.

  Features:

  - scanning and pairing: one screen to go to from anywhere
  - navigate to after pairing success: configuration of the screen (and its associated navigator) with params and name of the route param that will have newly paired device info
  - scanning: filtering on device models
  - scanning: filtering out or displaying already known devices
  - pairing: new animation for pairing (lotties placeholders for now)
  - pairing: possibility to add (or not) the newly paired device to the "known devices" of the app (redux store)

- Updated dependencies [[`936b6dc545`](https://github.com/LedgerHQ/ledger-live/commit/936b6dc5450fcd69a31e03fa2040346d512c0912)]:
  - @ledgerhq/live-common@27.1.0-next.5

## 3.8.0-next.4

### Patch Changes

- Updated dependencies [[`0ebdec50bf`](https://github.com/LedgerHQ/ledger-live/commit/0ebdec50bfca81b2d814726f8f9a82237ad42ffc)]:
  - @ledgerhq/live-common@27.1.0-next.4

## 3.8.0-next.3

### Minor Changes

- [#961](https://github.com/LedgerHQ/ledger-live/pull/961) [`b06c9fdf5c`](https://github.com/LedgerHQ/ledger-live/commit/b06c9fdf5ccbbc68283dd73ea4c3ea0e380c1539) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Minor wording changes
- [#963](https://github.com/LedgerHQ/ledger-live/pull/963) [`80aa008719`](https://github.com/LedgerHQ/ledger-live/commit/80aa00871943788d730cc8bb95a6d57ea2e9be96) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Enable Filecoin integration on LLM

### Patch Changes

- Updated dependencies [[`685348dd35`](https://github.com/LedgerHQ/ledger-live/commit/685348dd351181a9ed7f23cedb3e3d289b16fe9e), [`dd538c3723`](https://github.com/LedgerHQ/ledger-live/commit/dd538c3723853334ce19a89353f20766432d12fd), [`0601b6541f`](https://github.com/LedgerHQ/ledger-live/commit/0601b6541f10635aea72f916626432a334aa49fa)]:
  - @ledgerhq/live-common@27.1.0-next.3

## 3.8.0-next.2

### Minor Changes

- [#1017](https://github.com/LedgerHQ/ledger-live/pull/1017) [`21ed0bd521`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300) Thanks [@sarneijim](https://github.com/sarneijim)! - Add cosmos account banner in LLM

### Patch Changes

- Updated dependencies [[`8fe44e12d7`](https://github.com/LedgerHQ/ledger-live/commit/8fe44e12d73fe96636282666dd8f3b02ef96d0e6), [`21ed0bd521`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300)]:
  - @ledgerhq/live-common@27.1.0-next.2

## 3.8.0-next.1

### Minor Changes

- [#669](https://github.com/LedgerHQ/ledger-live/pull/669) [`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754) Thanks [@andyhass](https://github.com/andyhass)! - Add Celo Staking

### Patch Changes

- Updated dependencies [[`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754), [`336eb879a8`](https://github.com/LedgerHQ/ledger-live/commit/336eb879a80573fd81027232c4c6c9b383bd2a97), [`3615a06f19`](https://github.com/LedgerHQ/ledger-live/commit/3615a06f19ef659480d50a1a1a28f6df952b117a)]:
  - @ledgerhq/live-common@27.1.0-next.1

## 3.7.1-next.0

### Patch Changes

- [#1112](https://github.com/LedgerHQ/ledger-live/pull/1112) [`44516bce9f`](https://github.com/LedgerHQ/ledger-live/commit/44516bce9f2faae54989e508371785b50189399e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Support: LLM eslint rule no-unused-vars only from TS

* [#1000](https://github.com/LedgerHQ/ledger-live/pull/1000) [`dc3fd1841e`](https://github.com/LedgerHQ/ledger-live/commit/dc3fd1841e3e8b164f047fe84efd3776e16f8ff1) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Migration from JavaScript to TypeScript for LLM

- [#1070](https://github.com/LedgerHQ/ledger-live/pull/1070) [`533e658dcd`](https://github.com/LedgerHQ/ledger-live/commit/533e658dcd7862d4e6c9cb1b55c400652c68ae26) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix crash when scanning for bluetooth devices

- Updated dependencies [[`7e812a738d`](https://github.com/LedgerHQ/ledger-live/commit/7e812a738db718200138dcb9b7bcc2f6dd0ddd6f), [`058a1af7ff`](https://github.com/LedgerHQ/ledger-live/commit/058a1af7ff463d21afe85d03563b61e1d543c95b), [`d6634bc0b7`](https://github.com/LedgerHQ/ledger-live/commit/d6634bc0b720d8a13f3681caf33e2f23d5c64968), [`5da717c523`](https://github.com/LedgerHQ/ledger-live/commit/5da717c523db7678edeb0f86bdfa88256dfe96c4), [`533e658dcd`](https://github.com/LedgerHQ/ledger-live/commit/533e658dcd7862d4e6c9cb1b55c400652c68ae26)]:
  - @ledgerhq/live-common@27.0.1-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.5-next.0

## 3.7.0

### Minor Changes

- [#921](https://github.com/LedgerHQ/ledger-live/pull/921) [`cce2e7a4e7`](https://github.com/LedgerHQ/ledger-live/commit/cce2e7a4e76445921066593a07964ed7d0875f54) Thanks [@github-actions](https://github.com/apps/github-actions)! - Type libraries usage in LLC, LLD, LLM, CLI

* [#921](https://github.com/LedgerHQ/ledger-live/pull/921) [`cce2e7a4e7`](https://github.com/LedgerHQ/ledger-live/commit/cce2e7a4e76445921066593a07964ed7d0875f54) Thanks [@github-actions](https://github.com/apps/github-actions)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

- [#921](https://github.com/LedgerHQ/ledger-live/pull/921) [`cce2e7a4e7`](https://github.com/LedgerHQ/ledger-live/commit/cce2e7a4e76445921066593a07964ed7d0875f54) Thanks [@github-actions](https://github.com/apps/github-actions)! - Add banner to external integrations

### Patch Changes

- [#798](https://github.com/LedgerHQ/ledger-live/pull/798) [`222335854d`](https://github.com/LedgerHQ/ledger-live/commit/222335854d412cd748c0add73b5f0bb93e02ba42) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - bug fix issue on storyly package version

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb94`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#921](https://github.com/LedgerHQ/ledger-live/pull/921) [`cce2e7a4e7`](https://github.com/LedgerHQ/ledger-live/commit/cce2e7a4e76445921066593a07964ed7d0875f54) Thanks [@github-actions](https://github.com/apps/github-actions)! - Add Analytics 'reason' field in context of sync events

* [#815](https://github.com/LedgerHQ/ledger-live/pull/815) [`152339dcee`](https://github.com/LedgerHQ/ledger-live/commit/152339dceeaca4b4b7656aad1c690589189900a8) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add generics lotties animations

## 3.7.0-hotfix.0

### Minor Changes

- [#921](https://github.com/LedgerHQ/ledger-live/pull/921) [`cce2e7a4e7`](https://github.com/LedgerHQ/ledger-live/commit/cce2e7a4e76445921066593a07964ed7d0875f54) Thanks [@github-actions](https://github.com/apps/github-actions)! - Type libraries usage in LLC, LLD, LLM, CLI

* [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

- [#855](https://github.com/LedgerHQ/ledger-live/pull/855) [`2258f1ae8e`](https://github.com/LedgerHQ/ledger-live/commit/2258f1ae8e052761003d2c92efd2e5d00198439e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add banner to external integrations

### Patch Changes

- Updated dependencies [[`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100), [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1)]:
  - @ledgerhq/live-common@27.0.0-next.2

## 3.7.0-next.2

### Patch Changes

- [#1013](https://github.com/LedgerHQ/ledger-live/pull/1013) [`7d7b38fa6c`](https://github.com/LedgerHQ/ledger-live/commit/7d7b38fa6c6089e60194b536131777d2035ef892) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix rendering of last app item in manager

## 3.7.0-next.1

### Minor Changes

- [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds a device language change feature under feature flag

### Patch Changes

- Updated dependencies [[`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2), [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2)]:
  - @ledgerhq/native-ui@0.9.0-next.1
  - @ledgerhq/live-common@26.1.0-next.1

## 3.7.0-next.0

### Minor Changes

- [#756](https://github.com/LedgerHQ/ledger-live/pull/756) [`708f647d8`](https://github.com/LedgerHQ/ledger-live/commit/708f647d88ae484b5f1829fcab64139561bbd21f) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent navigation without user confirmation with ongoing installs/uninstalls

* [`2a3013359`](https://github.com/LedgerHQ/ledger-live/commit/2a301335985cadf937a7acfc661d55572eb73301) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Type libraries usage in LLC, LLD, LLM, CLI

- [#814](https://github.com/LedgerHQ/ledger-live/pull/814) [`23c9bf994`](https://github.com/LedgerHQ/ledger-live/commit/23c9bf9949169d31d534f12dca48e21e35df05b2) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added development/QA tool for feature flags [mobile]

* [`2a3013359`](https://github.com/LedgerHQ/ledger-live/commit/2a301335985cadf937a7acfc661d55572eb73301) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

- [#961](https://github.com/LedgerHQ/ledger-live/pull/961) [`b06c9fdf5`](https://github.com/LedgerHQ/ledger-live/commit/b06c9fdf5ccbbc68283dd73ea4c3ea0e380c1539) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Minor wording changes

* [#730](https://github.com/LedgerHQ/ledger-live/pull/730) [`e1173f5f4`](https://github.com/LedgerHQ/ledger-live/commit/e1173f5f4c521bdf50c9c1be431f63ae17aa2793) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Redirect buy sell in app links to live app implementation if feature flag is activated

- [`2a3013359`](https://github.com/LedgerHQ/ledger-live/commit/2a301335985cadf937a7acfc661d55572eb73301) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add banner to external integrations

### Patch Changes

- [#958](https://github.com/LedgerHQ/ledger-live/pull/958) [`68c50cd94`](https://github.com/LedgerHQ/ledger-live/commit/68c50cd94bbe50a1bf284a2e9e5aed3781788754) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix getFeature being a hook and getting called outside of React

* [#798](https://github.com/LedgerHQ/ledger-live/pull/798) [`222335854d`](https://github.com/LedgerHQ/ledger-live/commit/222335854d412cd748c0add73b5f0bb93e02ba42) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - bug fix issue on storyly package version

- [#808](https://github.com/LedgerHQ/ledger-live/pull/808) [`706081054`](https://github.com/LedgerHQ/ledger-live/commit/70608105451e29cbb543ee98d2a8a4cf5ada38df) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Fix redirection to stories from device selection screen

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#965](https://github.com/LedgerHQ/ledger-live/pull/965) [`186256aba`](https://github.com/LedgerHQ/ledger-live/commit/186256abac2ff3992a37ce15424bd1a3251e0c89) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Display more of the essential information in Feature Flags debugging screen

* [#751](https://github.com/LedgerHQ/ledger-live/pull/751) [`be4ad4860`](https://github.com/LedgerHQ/ledger-live/commit/be4ad4860c3954549c8ac955e1971f52cdb99679) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Fix redirection from upsell screen

- [`2a3013359`](https://github.com/LedgerHQ/ledger-live/commit/2a301335985cadf937a7acfc661d55572eb73301) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add Analytics 'reason' field in context of sync events

* [#815](https://github.com/LedgerHQ/ledger-live/pull/815) [`152339dcee`](https://github.com/LedgerHQ/ledger-live/commit/152339dceeaca4b4b7656aad1c690589189900a8) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add generics lotties animations

- [#730](https://github.com/LedgerHQ/ledger-live/pull/730) [`6e057f716`](https://github.com/LedgerHQ/ledger-live/commit/6e057f7163dc53658604429e3e6c8057ae9988f4) Thanks [@LFBarreto](https://github.com/LFBarreto)! - update ptx smart routing feature flag and live app web player undefined uri params

- Updated dependencies [[`2fd6f6244`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418), [`68c50cd94`](https://github.com/LedgerHQ/ledger-live/commit/68c50cd94bbe50a1bf284a2e9e5aed3781788754), [`092a887af`](https://github.com/LedgerHQ/ledger-live/commit/092a887af5a1405a1de3704bc5954c761cd53457), [`432cfa899`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb), [`23c9bf994`](https://github.com/LedgerHQ/ledger-live/commit/23c9bf9949169d31d534f12dca48e21e35df05b2), [`6e057f716`](https://github.com/LedgerHQ/ledger-live/commit/6e057f7163dc53658604429e3e6c8057ae9988f4), [`f28d40354`](https://github.com/LedgerHQ/ledger-live/commit/f28d4035426e741822108daf172f4509ce030751), [`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311), [`2fd6f6244`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418)]:
  - @ledgerhq/native-ui@0.9.0-next.0
  - @ledgerhq/types-live@6.24.0-next.0
  - @ledgerhq/live-common@26.1.0-next.0
  - @ledgerhq/hw-transport@6.27.3-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.4-next.0
  - @ledgerhq/hw-transport-http@6.27.3-next.0
  - @ledgerhq/react-native-hid@6.28.5-next.0

## 3.6.0-next.3

### Minor Changes

- [#855](https://github.com/LedgerHQ/ledger-live/pull/855) [`2258f1ae8`](https://github.com/LedgerHQ/ledger-live/commit/2258f1ae8e052761003d2c92efd2e5d00198439e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add banner to external integrations

## 3.6.0-next.2

### Patch Changes

- Updated dependencies [[`a36d1de86`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100)]:
  - @ledgerhq/live-common@26.0.0-next.2

## 3.6.0-next.1

### Minor Changes

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e89`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

### Patch Changes

- Updated dependencies [[`0c12f3e89`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1)]:
  - @ledgerhq/live-common@25.2.0-next.1

## 3.6.0-next.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

### Patch Changes

- [#798](https://github.com/LedgerHQ/ledger-live/pull/798) [`222335854`](https://github.com/LedgerHQ/ledger-live/commit/222335854d412cd748c0add73b5f0bb93e02ba42) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - bug fix issue on storyly package version

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#859](https://github.com/LedgerHQ/ledger-live/pull/859) [`f66e547cb`](https://github.com/LedgerHQ/ledger-live/commit/f66e547cb9f9c6403f3046c08c8c14789fc47bfd) Thanks [@gre](https://github.com/gre)! - Add Analytics 'reason' field in context of sync events

* [#815](https://github.com/LedgerHQ/ledger-live/pull/815) [`152339dce`](https://github.com/LedgerHQ/ledger-live/commit/152339dceeaca4b4b7656aad1c690589189900a8) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add generics lotties animations

* Updated dependencies [[`37159cbb9`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e), [`ebe1adfb7`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6), [`3dbd4d078`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f), [`1a33d8641`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5), [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8), [`3cc45438a`](https://github.com/LedgerHQ/ledger-live/commit/3cc45438a8aced1922742ff077946d1216f63525), [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`f4b789442`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466), [`97eab434d`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9)]:
  - @ledgerhq/live-common@25.2.0-next.0
  - @ledgerhq/types-live@6.23.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.3-next.0
  - @ledgerhq/types-cryptoassets@6.23.0-next.0

## 3.5.1

### Patch Changes

- [#972](https://github.com/LedgerHQ/ledger-live/pull/972) [`d39efbb170`](https://github.com/LedgerHQ/ledger-live/commit/d39efbb170d78d8d0289ba3972532d0c5a9fa75b) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix issue during receive flow causing crash

* [#972](https://github.com/LedgerHQ/ledger-live/pull/972) [`bbb229a824`](https://github.com/LedgerHQ/ledger-live/commit/bbb229a824f1006f4d0eaebd4363c01cb60cdbf3) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - analytics reborn issue

- [#972](https://github.com/LedgerHQ/ledger-live/pull/972) [`d7e8766dbd`](https://github.com/LedgerHQ/ledger-live/commit/d7e8766dbdbe2172ff1004fcbeb9724c5e76ec38) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix undefined issue on some accounts during receive flow

## 3.5.0

### Minor Changes

- [#740](https://github.com/LedgerHQ/ledger-live/pull/740) [`709020dd7`](https://github.com/LedgerHQ/ledger-live/commit/709020dd74a228afca1d592264d42cfb7469e746) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fixed incorrect value for used space in Manager

* [#389](https://github.com/LedgerHQ/ledger-live/pull/389) [`d4a71a6d8`](https://github.com/LedgerHQ/ledger-live/commit/d4a71a6d890d85f1ff36641949e3a8396d0a8eb9) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Fix wrong gas Price Polygon

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of memo for Hedera on LLM

* [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - feat: add ERC20 token support to the Platform API

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - LIVE-1004 Hedera integration on LLM

* [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Add Searching bar for validators list of ATOM and SOL

- [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Add support of Stellar assets (tokens)

* [#703](https://github.com/LedgerHQ/ledger-live/pull/703) [`aabfe4950`](https://github.com/LedgerHQ/ledger-live/commit/aabfe495061dbf7169945e77c7adb5fdccef6114) Thanks [@mehulcs](https://github.com/mehulcs)! - Rewards balance info banner for Cardanno currency

- [#731](https://github.com/LedgerHQ/ledger-live/pull/731) [`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update UI for manager app install/uninstall buttons

* [#507](https://github.com/LedgerHQ/ledger-live/pull/507) [`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Push notifications support added to ledger live mobile, new 'notifications' section added to the settings to enable or disable them, new modal added to ask the user if he wants to allow the notifications

- [#728](https://github.com/LedgerHQ/ledger-live/pull/728) [`b0053cced`](https://github.com/LedgerHQ/ledger-live/commit/b0053cced9accefe8ecbf0983934e18fcc75bad6) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Learn page add a close button to allow back navigation

### Patch Changes

- [#718](https://github.com/LedgerHQ/ledger-live/pull/718) [`14245392b`](https://github.com/LedgerHQ/ledger-live/commit/14245392b30d6ece427bdcbe5bce3aab6ec80dd4) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix the error wording for users trying to update the firmware via bluetooth

* [#374](https://github.com/LedgerHQ/ledger-live/pull/374) [`111160df7`](https://github.com/LedgerHQ/ledger-live/commit/111160df73e426a4a659f0717fcd976dea8f2e94) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix 2 firmware update banners being displayed on the wallet screen

- [#767](https://github.com/LedgerHQ/ledger-live/pull/767) [`b80857e94`](https://github.com/LedgerHQ/ledger-live/commit/b80857e94c8050be2443d2d53525a920fa74b74e) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Disable ftx ftxus temporary as a swap provider before official mobile release

* [#811](https://github.com/LedgerHQ/ledger-live/pull/811) [`0872e6688`](https://github.com/LedgerHQ/ledger-live/commit/0872e6688d34b6711a7043b24dfb765f72fe9e5d) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - add microphone permission to LLM for live apps

- [#792](https://github.com/LedgerHQ/ledger-live/pull/792) [`555c334eb`](https://github.com/LedgerHQ/ledger-live/commit/555c334ebf9f25271a810bc487abce03acf30fc5) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix issue related to navigation on receive flow

* [#897](https://github.com/LedgerHQ/ledger-live/pull/897) [`bb92400cf`](https://github.com/LedgerHQ/ledger-live/commit/bb92400cf8243ec1df89a08810bd5b6788e25575) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow fix issue on receive token accounts from market page

- [#435](https://github.com/LedgerHQ/ledger-live/pull/435) [`8319ff45a`](https://github.com/LedgerHQ/ledger-live/commit/8319ff45a8dbcdac691097d2ad2039430d18ab87) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Upgraded `react-native` to `0.68.2`, following [this guide](https://react-native-community.github.io/upgrade-helper/?from=0.67.3&to=0.68.2) and picked what works for us:
  - we don't upgrade Flipper as it crashes on runtime
  - we don't upgrade gradle as it builds fine like this and v7 didn't work out of the box
  - we don't keep `react-native-gradle-plugin` as it's only necessary for the new architecture..
  - we don't change `AppDelegate.m` to the new `AppDelegate.mm` as it's only useful for the new RN arch which we aren't using yet + it was a pain to migrate the existing config (Firebase, Flipper, splash screen)
  - Upgraded `react-native-reanimated` to `2.8.0`
  - Upgraded `lottie-react-native` to `5.1.3` as it was not building on iOS without upgrading -> I tested the device lotties in the "Debug Lottie" menu and it seems to work fine.
  - Upgraded `react-native-gesture-handler` to `2.5.0` & [Migrating off RNGHEnabledRootView](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/migrating-off-rnghenabledroot) as its setup on Android (in `MainActivity.java`) might conflict with react-native stuff later on
  - Fixed an issue in the portfolio where if there was no assets, scrolling was crashing the app on iOS. This is a mysterious issue and the logs are similar to this issue https://github.com/software-mansion/react-native-reanimated/issues/2285, for now it has been solved by removing the animation of a border width (border which anyway was invisible so the animation was pointless).

* [#586](https://github.com/LedgerHQ/ledger-live/pull/586) [`37598e481`](https://github.com/LedgerHQ/ledger-live/commit/37598e4816139a280236437e3b8c001c05fcbcd3) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

- [#821](https://github.com/LedgerHQ/ledger-live/pull/821) [`7e46d2828`](https://github.com/LedgerHQ/ledger-live/commit/7e46d28284b6d1700a36bb776dbd3708233cfc61) Thanks [@LFBarreto](https://github.com/LFBarreto)! - revert storyly

* [#711](https://github.com/LedgerHQ/ledger-live/pull/711) [`afa1ca628`](https://github.com/LedgerHQ/ledger-live/commit/afa1ca628003b6df3f922b6cc9bdb0293e0fffd5) Thanks [@Justkant](https://github.com/Justkant)! - fix: requestAccount to show all accounts

- [#699](https://github.com/LedgerHQ/ledger-live/pull/699) [`957d942a4`](https://github.com/LedgerHQ/ledger-live/commit/957d942a48e98a4f834a2d566cf75e658d6f8c29) Thanks [@LFBarreto](https://github.com/LFBarreto)! - Reborn analytics

* [#804](https://github.com/LedgerHQ/ledger-live/pull/804) [`10aba54ba`](https://github.com/LedgerHQ/ledger-live/commit/10aba54ba8a14853a5d50d0cebf1e2af965b6320) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Keyboard avoiding view fixed on Send Coin Amount page

- [#794](https://github.com/LedgerHQ/ledger-live/pull/794) [`661719e15`](https://github.com/LedgerHQ/ledger-live/commit/661719e159666b140246079107e8cf09d452268f) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fic issue on redirection after account deletion

* [#823](https://github.com/LedgerHQ/ledger-live/pull/823) [`4df8aed2e`](https://github.com/LedgerHQ/ledger-live/commit/4df8aed2e865f1e7ef15f45780673cf5c26fbfec) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - market receive flow redirection issue

- [#796](https://github.com/LedgerHQ/ledger-live/pull/796) [`078665b95`](https://github.com/LedgerHQ/ledger-live/commit/078665b952d7d8b26e98687e5d6275466353e31d) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Send Flow navigation issue

* [#847](https://github.com/LedgerHQ/ledger-live/pull/847) [`03c90eebe`](https://github.com/LedgerHQ/ledger-live/commit/03c90eebebd87cb58c796fd422657b8a0ace8ab3) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow prevent creation of multiple accounts at the same time

- [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Log experimental and feature flags in Sentry error reports.

* [#833](https://github.com/LedgerHQ/ledger-live/pull/833) [`91cfea6e2`](https://github.com/LedgerHQ/ledger-live/commit/91cfea6e250574b6e21982509b4630066c7816bf) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow copy address button overflow issue

- [#883](https://github.com/LedgerHQ/ledger-live/pull/883) [`7101ca25c`](https://github.com/LedgerHQ/ledger-live/commit/7101ca25cb38490ae9697be2122aa2a42e734d21) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow - prevent double modal to pop during verification of address

* [#834](https://github.com/LedgerHQ/ledger-live/pull/834) [`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fixes issue on market header button touch highlight color

- [#797](https://github.com/LedgerHQ/ledger-live/pull/797) [`b2eb19311`](https://github.com/LedgerHQ/ledger-live/commit/b2eb19311711bf3a1cc4ca095af495da0988caca) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow - fix issue on token account creation name

* [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

- [#737](https://github.com/LedgerHQ/ledger-live/pull/737) [`8ee5ab993`](https://github.com/LedgerHQ/ledger-live/commit/8ee5ab9937b2abba6837684933dde266a09811cd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix missing import in NFTViewer

- Updated dependencies [[`f10d01171`](https://github.com/LedgerHQ/ledger-live/commit/f10d01171f4c0869d1d82e6cc5402da9ca80990b), [`aa2794813`](https://github.com/LedgerHQ/ledger-live/commit/aa2794813c05b1b39272814cc803cd662662584c), [`8afb69530`](https://github.com/LedgerHQ/ledger-live/commit/8afb69530292fa1f41f2fc78b38639134b1fe16f), [`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86), [`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed), [`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c), [`858898d63`](https://github.com/LedgerHQ/ledger-live/commit/858898d63b3d70dc0be4cefbeaba5770c389660b), [`331794cfb`](https://github.com/LedgerHQ/ledger-live/commit/331794cfbdb901f9224fed759c57f419861ec364)]:
  - @ledgerhq/live-common@25.1.0
  - @ledgerhq/native-ui@0.8.3

## 3.5.0-next.28

### Patch Changes

- [#897](https://github.com/LedgerHQ/ledger-live/pull/897) [`bb92400cf`](https://github.com/LedgerHQ/ledger-live/commit/bb92400cf8243ec1df89a08810bd5b6788e25575) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow fix issue on receive token accounts from market page

## 3.5.0-next.27

### Patch Changes

- [#883](https://github.com/LedgerHQ/ledger-live/pull/883) [`7101ca25c`](https://github.com/LedgerHQ/ledger-live/commit/7101ca25cb38490ae9697be2122aa2a42e734d21) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow - prevent double modal to pop during verification of address

## 3.5.0-next.26

### Patch Changes

- [#847](https://github.com/LedgerHQ/ledger-live/pull/847) [`03c90eebe`](https://github.com/LedgerHQ/ledger-live/commit/03c90eebebd87cb58c796fd422657b8a0ace8ab3) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow prevent creation of multiple accounts at the same time

## 3.5.0-next.25

### Patch Changes

- [#834](https://github.com/LedgerHQ/ledger-live/pull/834) [`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fixes issue on market header button touch highlight color

- Updated dependencies [[`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86)]:
  - @ledgerhq/native-ui@0.8.3-next.1

## 3.5.0-next.24

### Patch Changes

- [#833](https://github.com/LedgerHQ/ledger-live/pull/833) [`91cfea6e2`](https://github.com/LedgerHQ/ledger-live/commit/91cfea6e250574b6e21982509b4630066c7816bf) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow copy address button overflow issue

## 3.5.0-next.23

### Patch Changes

- [#823](https://github.com/LedgerHQ/ledger-live/pull/823) [`4df8aed2e`](https://github.com/LedgerHQ/ledger-live/commit/4df8aed2e865f1e7ef15f45780673cf5c26fbfec) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - market receive flow redirection issue

## 3.5.0-next.22

### Patch Changes

- [#821](https://github.com/LedgerHQ/ledger-live/pull/821) [`7e46d2828`](https://github.com/LedgerHQ/ledger-live/commit/7e46d28284b6d1700a36bb776dbd3708233cfc61) Thanks [@LFBarreto](https://github.com/LFBarreto)! - revert storyly

## 3.5.0-next.21

### Patch Changes

- [#811](https://github.com/LedgerHQ/ledger-live/pull/811) [`0872e6688`](https://github.com/LedgerHQ/ledger-live/commit/0872e6688d34b6711a7043b24dfb765f72fe9e5d) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - add microphone permission to LLM for live apps

## 3.5.0-next.20

### Patch Changes

- [#804](https://github.com/LedgerHQ/ledger-live/pull/804) [`10aba54ba`](https://github.com/LedgerHQ/ledger-live/commit/10aba54ba8a14853a5d50d0cebf1e2af965b6320) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Keyboard avoiding view fixed on Send Coin Amount page

## 3.5.0-next.19

### Patch Changes

- [#797](https://github.com/LedgerHQ/ledger-live/pull/797) [`b2eb19311`](https://github.com/LedgerHQ/ledger-live/commit/b2eb19311711bf3a1cc4ca095af495da0988caca) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow - fix issue on token account creation name

## 3.5.0-next.18

### Patch Changes

- [#794](https://github.com/LedgerHQ/ledger-live/pull/794) [`661719e15`](https://github.com/LedgerHQ/ledger-live/commit/661719e159666b140246079107e8cf09d452268f) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fic issue on redirection after account deletion

## 3.5.0-next.17

### Patch Changes

- [#792](https://github.com/LedgerHQ/ledger-live/pull/792) [`555c334eb`](https://github.com/LedgerHQ/ledger-live/commit/555c334ebf9f25271a810bc487abce03acf30fc5) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix issue related to navigation on receive flow

## 3.5.0-next.16

### Patch Changes

- [#796](https://github.com/LedgerHQ/ledger-live/pull/796) [`078665b95`](https://github.com/LedgerHQ/ledger-live/commit/078665b952d7d8b26e98687e5d6275466353e31d) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Send Flow navigation issue

## 3.5.0-next.15

### Minor Changes

- [#507](https://github.com/LedgerHQ/ledger-live/pull/507) [`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Push notifications support added to ledger live mobile, new 'notifications' section added to the settings to enable or disable them, new modal added to ask the user if he wants to allow the notifications

### Patch Changes

- Updated dependencies [[`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c)]:
  - @ledgerhq/live-common@25.1.0-next.2

## 3.5.0-next.14

### Patch Changes

- Updated dependencies [[`858898d63`](https://github.com/LedgerHQ/ledger-live/commit/858898d63b3d70dc0be4cefbeaba5770c389660b)]:
  - @ledgerhq/native-ui@0.8.3-next.0

## 3.5.0-next.13

### Patch Changes

- [#699](https://github.com/LedgerHQ/ledger-live/pull/699) [`957d942a4`](https://github.com/LedgerHQ/ledger-live/commit/957d942a48e98a4f834a2d566cf75e658d6f8c29) Thanks [@LFBarreto](https://github.com/LFBarreto)! - Reborn analytics

## 3.5.0-next.12

### Minor Changes

- [#728](https://github.com/LedgerHQ/ledger-live/pull/728) [`b0053cced`](https://github.com/LedgerHQ/ledger-live/commit/b0053cced9accefe8ecbf0983934e18fcc75bad6) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Learn page add a close button to allow back navigation

## 3.5.0-next.11

### Minor Changes

- [#731](https://github.com/LedgerHQ/ledger-live/pull/731) [`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update UI for manager app install/uninstall buttons

### Patch Changes

- Updated dependencies [[`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed)]:
  - @ledgerhq/live-common@25.1.0-next.1

## 3.5.0-next.10

### Patch Changes

- [#767](https://github.com/LedgerHQ/ledger-live/pull/767) [`b80857e94`](https://github.com/LedgerHQ/ledger-live/commit/b80857e94c8050be2443d2d53525a920fa74b74e) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Disable ftx ftxus temporary as a swap provider before official mobile release

## 3.5.0-next.9

### Minor Changes

- [#740](https://github.com/LedgerHQ/ledger-live/pull/740) [`709020dd7`](https://github.com/LedgerHQ/ledger-live/commit/709020dd74a228afca1d592264d42cfb7469e746) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fixed incorrect value for used space in Manager

## 3.5.0-next.8

### Minor Changes

- [#389](https://github.com/LedgerHQ/ledger-live/pull/389) [`d4a71a6d8`](https://github.com/LedgerHQ/ledger-live/commit/d4a71a6d890d85f1ff36641949e3a8396d0a8eb9) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Fix wrong gas Price Polygon

* [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of memo for Hedera on LLM

- [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - feat: add ERC20 token support to the Platform API

* [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - LIVE-1004 Hedera integration on LLM

- [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Add Searching bar for validators list of ATOM and SOL

* [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Add support of Stellar assets (tokens)

- [#703](https://github.com/LedgerHQ/ledger-live/pull/703) [`aabfe4950`](https://github.com/LedgerHQ/ledger-live/commit/aabfe495061dbf7169945e77c7adb5fdccef6114) Thanks [@mehulcs](https://github.com/mehulcs)! - Rewards balance info banner for Cardanno currency

### Patch Changes

- [#633](https://github.com/LedgerHQ/ledger-live/pull/633) [`50fd2243e`](https://github.com/LedgerHQ/ledger-live/commit/50fd2243e0c867c71da2b51387de2f9dc0b32f18) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Integration of storyly-react-native (Storyly SDK)

* [#718](https://github.com/LedgerHQ/ledger-live/pull/718) [`14245392b`](https://github.com/LedgerHQ/ledger-live/commit/14245392b30d6ece427bdcbe5bce3aab6ec80dd4) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix the error wording for users trying to update the firmware via bluetooth

- [#374](https://github.com/LedgerHQ/ledger-live/pull/374) [`111160df7`](https://github.com/LedgerHQ/ledger-live/commit/111160df73e426a4a659f0717fcd976dea8f2e94) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix 2 firmware update banners being displayed on the wallet screen

* [#435](https://github.com/LedgerHQ/ledger-live/pull/435) [`8319ff45a`](https://github.com/LedgerHQ/ledger-live/commit/8319ff45a8dbcdac691097d2ad2039430d18ab87) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Upgraded `react-native` to `0.68.2`, following [this guide](https://react-native-community.github.io/upgrade-helper/?from=0.67.3&to=0.68.2) and picked what works for us:
  - we don't upgrade Flipper as it crashes on runtime
  - we don't upgrade gradle as it builds fine like this and v7 didn't work out of the box
  - we don't keep `react-native-gradle-plugin` as it's only necessary for the new architecture..
  - we don't change `AppDelegate.m` to the new `AppDelegate.mm` as it's only useful for the new RN arch which we aren't using yet + it was a pain to migrate the existing config (Firebase, Flipper, splash screen)
  - Upgraded `react-native-reanimated` to `2.8.0`
  - Upgraded `lottie-react-native` to `5.1.3` as it was not building on iOS without upgrading -> I tested the device lotties in the "Debug Lottie" menu and it seems to work fine.
  - Upgraded `react-native-gesture-handler` to `2.5.0` & [Migrating off RNGHEnabledRootView](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/migrating-off-rnghenabledroot) as its setup on Android (in `MainActivity.java`) might conflict with react-native stuff later on
  - Fixed an issue in the portfolio where if there was no assets, scrolling was crashing the app on iOS. This is a mysterious issue and the logs are similar to this issue https://github.com/software-mansion/react-native-reanimated/issues/2285, for now it has been solved by removing the animation of a border width (border which anyway was invisible so the animation was pointless).

- [#586](https://github.com/LedgerHQ/ledger-live/pull/586) [`37598e481`](https://github.com/LedgerHQ/ledger-live/commit/37598e4816139a280236437e3b8c001c05fcbcd3) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

* [#711](https://github.com/LedgerHQ/ledger-live/pull/711) [`afa1ca628`](https://github.com/LedgerHQ/ledger-live/commit/afa1ca628003b6df3f922b6cc9bdb0293e0fffd5) Thanks [@Justkant](https://github.com/Justkant)! - fix: requestAccount to show all accounts

- [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Log experimental and feature flags in Sentry error reports.

* [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

- [#737](https://github.com/LedgerHQ/ledger-live/pull/737) [`8ee5ab993`](https://github.com/LedgerHQ/ledger-live/commit/8ee5ab9937b2abba6837684933dde266a09811cd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix missing import in NFTViewer

- Updated dependencies [[`f10d01171`](https://github.com/LedgerHQ/ledger-live/commit/f10d01171f4c0869d1d82e6cc5402da9ca80990b), [`aa2794813`](https://github.com/LedgerHQ/ledger-live/commit/aa2794813c05b1b39272814cc803cd662662584c), [`8afb69530`](https://github.com/LedgerHQ/ledger-live/commit/8afb69530292fa1f41f2fc78b38639134b1fe16f), [`331794cfb`](https://github.com/LedgerHQ/ledger-live/commit/331794cfbdb901f9224fed759c57f419861ec364)]:
  - @ledgerhq/live-common@25.0.1-next.0

## 3.5.0-next.7

### Patch Changes

- [#711](https://github.com/LedgerHQ/ledger-live/pull/711) [`afa1ca628`](https://github.com/LedgerHQ/ledger-live/commit/afa1ca628003b6df3f922b6cc9bdb0293e0fffd5) Thanks [@Justkant](https://github.com/Justkant)! - fix: requestAccount to show all accounts

## 3.5.0-next.6

### Minor Changes

- [#624](https://github.com/LedgerHQ/ledger-live/pull/624) [`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add Searching bar for validators list of ATOM and SOL

### Patch Changes

- Updated dependencies [[`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67)]:
  - @ledgerhq/live-common@25.0.0-next.6

## 3.5.0-next.5

### Patch Changes

- Updated dependencies [[`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01)]:
  - @ledgerhq/live-common@25.0.0-next.5

## 3.5.0-next.4

### Minor Changes

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of memo for Hedera on LLM

* [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - LIVE-1004 Hedera integration on LLM

### Patch Changes

- Updated dependencies [[`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf)]:
  - @ledgerhq/live-common@25.0.0-next.4

## 3.5.0-next.3

### Minor Changes

- [#81](https://github.com/LedgerHQ/ledger-live/pull/81) [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - feat: add ERC20 token support to the Platform API

### Patch Changes

- Updated dependencies [[`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db)]:
  - @ledgerhq/live-common@25.0.0-next.3

## 3.5.0-next.2

### Patch Changes

- Updated dependencies [[`345706e24`](https://github.com/LedgerHQ/ledger-live/commit/345706e24e91ba4c397d4a6ffc1b2b174a0ddc84)]:
  - @ledgerhq/live-common@25.0.0-next.2

## 3.5.0-next.1

### Minor Changes

- [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

### Patch Changes

- Updated dependencies [[`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0)]:
  - @ledgerhq/live-common@25.0.0-next.1

## 3.5.0-next.0

### Minor Changes

- [#389](https://github.com/LedgerHQ/ledger-live/pull/389) [`d4a71a6d8`](https://github.com/LedgerHQ/ledger-live/commit/d4a71a6d890d85f1ff36641949e3a8396d0a8eb9) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Fix wrong gas Price Polygon

### Patch Changes

- [#633](https://github.com/LedgerHQ/ledger-live/pull/633) [`50fd2243e`](https://github.com/LedgerHQ/ledger-live/commit/50fd2243e0c867c71da2b51387de2f9dc0b32f18) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Integration of storyly-react-native (Storyly SDK)

* [#374](https://github.com/LedgerHQ/ledger-live/pull/374) [`111160df7`](https://github.com/LedgerHQ/ledger-live/commit/111160df73e426a4a659f0717fcd976dea8f2e94) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix 2 firmware update banners being displayed on the wallet screen

- [#435](https://github.com/LedgerHQ/ledger-live/pull/435) [`8319ff45a`](https://github.com/LedgerHQ/ledger-live/commit/8319ff45a8dbcdac691097d2ad2039430d18ab87) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Upgraded `react-native` to `0.68.2`, following [this guide](https://react-native-community.github.io/upgrade-helper/?from=0.67.3&to=0.68.2) and picked what works for us:
  - we don't upgrade Flipper as it crashes on runtime
  - we don't upgrade gradle as it builds fine like this and v7 didn't work out of the box
  - we don't keep `react-native-gradle-plugin` as it's only necessary for the new architecture..
  - we don't change `AppDelegate.m` to the new `AppDelegate.mm` as it's only useful for the new RN arch which we aren't using yet + it was a pain to migrate the existing config (Firebase, Flipper, splash screen)
  - Upgraded `react-native-reanimated` to `2.8.0`
  - Upgraded `lottie-react-native` to `5.1.3` as it was not building on iOS without upgrading -> I tested the device lotties in the "Debug Lottie" menu and it seems to work fine.
  - Upgraded `react-native-gesture-handler` to `2.5.0` & [Migrating off RNGHEnabledRootView](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/migrating-off-rnghenabledroot) as its setup on Android (in `MainActivity.java`) might conflict with react-native stuff later on
  - Fixed an issue in the portfolio where if there was no assets, scrolling was crashing the app on iOS. This is a mysterious issue and the logs are similar to this issue https://github.com/software-mansion/react-native-reanimated/issues/2285, for now it has been solved by removing the animation of a border width (border which anyway was invisible so the animation was pointless).

* [#586](https://github.com/LedgerHQ/ledger-live/pull/586) [`37598e481`](https://github.com/LedgerHQ/ledger-live/commit/37598e4816139a280236437e3b8c001c05fcbcd3) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

- [#386](https://github.com/LedgerHQ/ledger-live/pull/386) [`8917ca143`](https://github.com/LedgerHQ/ledger-live/commit/8917ca1436e780e3a52f66f968f8224ad35362b4) Thanks [@gre](https://github.com/gre)! - Log experimental and feature flags in Sentry error reports.

* [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

* Updated dependencies [[`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905), [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a), [`e4b7dc326`](https://github.com/LedgerHQ/ledger-live/commit/e4b7dc32664d32b43dfae2821c29715ae94a6ab4), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/live-common@25.0.0-next.0
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/devices@7.0.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.2-next.0
  - @ledgerhq/hw-transport@6.27.2-next.0
  - @ledgerhq/hw-transport-http@6.27.2-next.0
  - @ledgerhq/react-native-hid@6.28.4-next.0
  - @ledgerhq/native-ui@0.8.2-next.0

## 3.4.1

### Patch Changes

- [#642](https://github.com/LedgerHQ/ledger-live/pull/642) [`fbb61657d`](https://github.com/LedgerHQ/ledger-live/commit/fbb61657d1204174c31dc37c716e5c837617b60f) Thanks [@porenes](https://github.com/porenes)! - Adding [ L ] Market to the Mobile Discover Landing

## 3.4.1-hotfix.0

### Patch Changes

- [#642](https://github.com/LedgerHQ/ledger-live/pull/642) [`fbb61657d`](https://github.com/LedgerHQ/ledger-live/commit/fbb61657d1204174c31dc37c716e5c837617b60f) Thanks [@porenes](https://github.com/porenes)! - Adding [ L ] Market to the Mobile Discover Landing

## 3.4.0

### Minor Changes

- [#582](https://github.com/LedgerHQ/ledger-live/pull/582) [`8aefbac63`](https://github.com/LedgerHQ/ledger-live/commit/8aefbac63188f72e8c3f6655b2f91fc45bf16004) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Refresh segment identify to take in account satisfaction user property change

### Patch Changes

- [#574](https://github.com/LedgerHQ/ledger-live/pull/574) [`6a5c9caf4`](https://github.com/LedgerHQ/ledger-live/commit/6a5c9caf4ff5b16830fff254be2b01e427073375) Thanks [@github-actions](https://github.com/apps/github-actions)! - Merge hotfix - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

* [#562](https://github.com/LedgerHQ/ledger-live/pull/562) [`41aa44fde`](https://github.com/LedgerHQ/ledger-live/commit/41aa44fde2ca4e0d127f82e622c4cdb3e96cfa90) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Empty analytics overlay when activating it

- [#592](https://github.com/LedgerHQ/ledger-live/pull/592) [`593cd6bc1`](https://github.com/LedgerHQ/ledger-live/commit/593cd6bc1dd146e99c7966aa03a9a20cac5af46a) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

* [#391](https://github.com/LedgerHQ/ledger-live/pull/391) [`d9689451e`](https://github.com/LedgerHQ/ledger-live/commit/d9689451efe39fd7333aafb9aff12df1702e88db) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix bug when navigating to the Manager screen without params

- [#568](https://github.com/LedgerHQ/ledger-live/pull/568) [`2f0f22075`](https://github.com/LedgerHQ/ledger-live/commit/2f0f220756e1c014cb8a8ecf1d62f1a4ddccb1b0) Thanks [@Justkant](https://github.com/Justkant)! - fix: imports should use /lib and not /src

* [#466](https://github.com/LedgerHQ/ledger-live/pull/466) [`026d923ee`](https://github.com/LedgerHQ/ledger-live/commit/026d923ee078169845026a9ab8abbf7cf235599d) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Update on Ledger Card CTA's (removed some, created one in the portfolio header)

- [#315](https://github.com/LedgerHQ/ledger-live/pull/315) [`093792ebb`](https://github.com/LedgerHQ/ledger-live/commit/093792ebb70704cfcba7f12f1511930d0cd33a05) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Reborn analytics

* [#373](https://github.com/LedgerHQ/ledger-live/pull/373) [`da3320c0a`](https://github.com/LedgerHQ/ledger-live/commit/da3320c0a65d6c5479eacf14e3a93ce85a42766c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Changing the architecture of NftMedia component

* Updated dependencies [[`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860), [`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/live-common@24.1.0

## 3.4.0-next.7

### Patch Changes

- [#574](https://github.com/LedgerHQ/ledger-live/pull/574) [`6a5c9caf4`](https://github.com/LedgerHQ/ledger-live/commit/6a5c9caf4ff5b16830fff254be2b01e427073375) Thanks [@github-actions](https://github.com/apps/github-actions)! - Merge hotfix - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

## 3.4.0-next.6

### Patch Changes

- [#315](https://github.com/LedgerHQ/ledger-live/pull/315) [`093792ebb`](https://github.com/LedgerHQ/ledger-live/commit/093792ebb70704cfcba7f12f1511930d0cd33a05) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Reborn analytics

## 3.5.0-next.5

### Patch Changes

- [#592](https://github.com/LedgerHQ/ledger-live/pull/592) [`593cd6bc1`](https://github.com/LedgerHQ/ledger-live/commit/593cd6bc1dd146e99c7966aa03a9a20cac5af46a) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

## 3.5.0-next.4

### Patch Changes

- [#562](https://github.com/LedgerHQ/ledger-live/pull/562) [`41aa44fde`](https://github.com/LedgerHQ/ledger-live/commit/41aa44fde2ca4e0d127f82e622c4cdb3e96cfa90) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Empty analytics overlay when activating it

## 3.5.0-next.3

### Patch Changes

- Updated dependencies [[`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/live-common@24.1.0-next.1

## 3.5.0-next.2

### Patch Changes

- [#373](https://github.com/LedgerHQ/ledger-live/pull/373) [`da3320c0a`](https://github.com/LedgerHQ/ledger-live/commit/da3320c0a65d6c5479eacf14e3a93ce85a42766c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Changing the architecture of NftMedia component

## 3.5.0-next.1

### Minor Changes

- [#582](https://github.com/LedgerHQ/ledger-live/pull/582) [`8aefbac63`](https://github.com/LedgerHQ/ledger-live/commit/8aefbac63188f72e8c3f6655b2f91fc45bf16004) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Refresh segment identify to take in account satisfaction user property change

## 3.4.1-next.0

### Patch Changes

- [#391](https://github.com/LedgerHQ/ledger-live/pull/391) [`d9689451e`](https://github.com/LedgerHQ/ledger-live/commit/d9689451efe39fd7333aafb9aff12df1702e88db) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix bug when navigating to the Manager screen without params

* [#568](https://github.com/LedgerHQ/ledger-live/pull/568) [`2f0f22075`](https://github.com/LedgerHQ/ledger-live/commit/2f0f220756e1c014cb8a8ecf1d62f1a4ddccb1b0) Thanks [@Justkant](https://github.com/Justkant)! - fix: imports should use /lib and not /src

- [#466](https://github.com/LedgerHQ/ledger-live/pull/466) [`026d923ee`](https://github.com/LedgerHQ/ledger-live/commit/026d923ee078169845026a9ab8abbf7cf235599d) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Update on Ledger Card CTA's (removed some, created one in the portfolio header)

- Updated dependencies [[`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860)]:
  - @ledgerhq/live-common@24.1.0-next.0

## 3.3.2

### Patch Changes

- [#609](https://github.com/LedgerHQ/ledger-live/pull/609) [`0139d05ab`](https://github.com/LedgerHQ/ledger-live/commit/0139d05ab2adf83f49690e3b6cd93e87707f82d7) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

## 3.3.2-hotfix.0

### Patch Changes

- [#609](https://github.com/LedgerHQ/ledger-live/pull/609) [`0139d05ab`](https://github.com/LedgerHQ/ledger-live/commit/0139d05ab2adf83f49690e3b6cd93e87707f82d7) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

## 3.4.0

### Minor Changes

- [#385](https://github.com/LedgerHQ/ledger-live/pull/385) [`5145781e5`](https://github.com/LedgerHQ/ledger-live/commit/5145781e599fcb64be13695620988951bb805a3e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - NFT counter value added on LLM and LLD with feature flagging

### Patch Changes

- [#73](https://github.com/LedgerHQ/ledger-live/pull/73) [`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2) Thanks [@chabroA](https://github.com/chabroA)! - Handle all non final (i.e: non OK nor KO) status as pending

* [#412](https://github.com/LedgerHQ/ledger-live/pull/412) [`fbc32d3e2`](https://github.com/LedgerHQ/ledger-live/commit/fbc32d3e2e229e7a3dbe71bbd8c36ed203c61e34) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - AccountGraphCard : Add rounding when using counter value (to prevent too many decimals in crypto-value)

- [#371](https://github.com/LedgerHQ/ledger-live/pull/371) [`4f43ac0e5`](https://github.com/LedgerHQ/ledger-live/commit/4f43ac0e53e090239dcdc11ae3840cf5abbf401b) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Add back navigation to NftViewer and fixed style issues on the view

* [#336](https://github.com/LedgerHQ/ledger-live/pull/336) [`6bf75fa20`](https://github.com/LedgerHQ/ledger-live/commit/6bf75fa20e1991964948bf48c01a530a43ba03e1) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Updated naming for last operations to last transactions

- [#337](https://github.com/LedgerHQ/ledger-live/pull/337) [`7bdf0091f`](https://github.com/LedgerHQ/ledger-live/commit/7bdf0091fef18d6b10e54a74a765f76798640100) Thanks [@gre](https://github.com/gre)! - (internal) Filtering more errors to NOT be reported to Sentry – typically to ignore users-specific cases

- Updated dependencies [[`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2), [`22531f3c3`](https://github.com/LedgerHQ/ledger-live/commit/22531f3c377191d56bc5d5635f1174fb32b01957), [`c5714333b`](https://github.com/LedgerHQ/ledger-live/commit/c5714333bdb1c90a29c20c7e5793184d89967142), [`d22452817`](https://github.com/LedgerHQ/ledger-live/commit/d224528174313bc4975e62d015adf928d4315620), [`5145781e5`](https://github.com/LedgerHQ/ledger-live/commit/5145781e599fcb64be13695620988951bb805a3e), [`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062), [`2012b5477`](https://github.com/LedgerHQ/ledger-live/commit/2012b54773b6391f353903564a247ad02be1a296), [`10440ec3c`](https://github.com/LedgerHQ/ledger-live/commit/10440ec3c2bffa7ce8636a7838680bb3501ffe0d), [`e1f2f07a2`](https://github.com/LedgerHQ/ledger-live/commit/e1f2f07a2ba1de5eab6fa10c4c800b7097c8037d), [`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2), [`1e4a5647b`](https://github.com/LedgerHQ/ledger-live/commit/1e4a5647b39c0f806bc311383b49a246fbe453eb), [`508e4c23b`](https://github.com/LedgerHQ/ledger-live/commit/508e4c23babd04c48e7b626ef4004fb55f3c1ba9), [`b1e396dd8`](https://github.com/LedgerHQ/ledger-live/commit/b1e396dd89ca2787978dc7e53b7ca865133a1961), [`e9decc277`](https://github.com/LedgerHQ/ledger-live/commit/e9decc27785fb07972460494c8ef39e92b0127a1)]:
  - @ledgerhq/live-common@24.0.0
  - @ledgerhq/native-ui@0.8.1

## 3.4.0-next.4

### Patch Changes

- Updated dependencies [[`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062)]:
  - @ledgerhq/live-common@24.0.0-next.4

## 3.4.0-next.3

### Minor Changes

- 5145781e5: NFT counter value added on LLM and LLD with feature flagging

### Patch Changes

- Updated dependencies [5145781e5]
  - @ledgerhq/live-common@24.0.0-next.3

## 3.3.1

### Patch Changes

- c3079243d: Exit readonly mode in multiple places where the user interacts with a device and therefore should have exited readonly mode. Fix a bug where user in "old" readonly mode would crash when pressing an account in MarketPage.
- bda266fc4: Fix an edge case where the readonly example portfolio would show up instead of the real one

## 3.3.1-hotfix.1

### Patch Changes

- bb592ab1d: Exit readonly mode in multiple places where the user interacts with a device and therefore should have exited readonly mode. Fix a bug where user in "old" readonly mode would crash when pressing an account in MarketPage.

## 3.3.1-hotfix.0

### Patch Changes

- b8dad7183: Fix an edge case where the readonly example portfolio would show up instead of the real one

## 3.3.1-next.2

### Patch Changes

- Updated dependencies [c5714333b]
  - @ledgerhq/live-common@24.0.0-next.2

## 3.3.1-next.1

### Patch Changes

- 99cc5bbc1: Handle all non final (i.e: non OK nor KO) status as pending
- Updated dependencies [99cc5bbc1]
- Updated dependencies [99cc5bbc1]
  - @ledgerhq/live-common@24.0.0-next.1

## 3.3.1-next.0

### Patch Changes

- fbc32d3e2: AccountGraphCard : Add rounding when using counter value (to prevent too many decimals in crypto-value)
- 4f43ac0e5: Add back navigation to NftViewer and fixed style issues on the view
- 6bf75fa20: Updated naming for last operations to last transactions
- 7bdf0091f: (internal) Filtering more errors to NOT be reported to Sentry – typically to ignore users-specific cases
- Updated dependencies [22531f3c3]
- Updated dependencies [d22452817]
- Updated dependencies [2012b5477]
- Updated dependencies [10440ec3c]
- Updated dependencies [e1f2f07a2]
- Updated dependencies [1e4a5647b]
- Updated dependencies [508e4c23b]
- Updated dependencies [b1e396dd8]
- Updated dependencies [e9decc277]
  - @ledgerhq/live-common@24.0.0-next.0
  - @ledgerhq/native-ui@0.8.1-next.0

## 3.3.0

### Minor Changes

- 09f79c7b4: Add Cardano to mobile
- 7ba2346a5: feat(LLM): multibuy 1.5 [LIVE-1710]
- 4db0f58ca: Updated learn feature url to be remote configurable
- bf12e0f65: feat: sell and fund flow [LIVE-784]
- d2576ef46: feat(swap): Add Changelly's Terms of Use in the confirmation screen [LIVE-1196]
- 592ad2f7b: Update design on upsell modal in mobile app. Also add new variants and shape to IconBoxList and BoxedIcon components in native UI.
- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.
- fe3c7a39c: Add Earn Rewards btn on Solana

### Patch Changes

- 3d71946fb: Fix deep linking logic for platform apps
- 27c947ba4: fix(multibuy): remove fiat filter
- 35737e057: fix(LLM): can't open custom loaded manifest on iOS [LIVE-2481]
- 95b4c2854: Fix hasOrderedNano state with Buy Nano screen
- 3d1ab8511: Behavior fixed when clicking on the "My Ledger" button on the tab bar when on read only mode
- 46994ebfd: Wording - small typos fixed
- 8a973ad0e: fix(LLM): platform manifest can be undefined when no network [LIVE-2571]
- 5bae58815: bugfix - webview reload crash issue related to ui rendering layout shift bugs
- Updated dependencies [8323d2eaa]
- Updated dependencies [bf12e0f65]
- Updated dependencies [8861c4fe0]
- Updated dependencies [592ad2f7b]
- Updated dependencies [ec5c4fa3d]
- Updated dependencies [dd6a12c9b]
- Updated dependencies [608010c9d]
- Updated dependencies [78a64769d]
- Updated dependencies [0c2c6682b]
  - @ledgerhq/live-common@23.1.0
  - @ledgerhq/native-ui@0.8.0

## 3.3.0-next.14

### Patch Changes

- 95b4c2854: Fix hasOrderedNano state with Buy Nano screen

## 3.3.0-next.13

### Patch Changes

- Updated dependencies [78a64769d]
  - @ledgerhq/live-common@23.1.0-next.4

## 3.3.0-next.12

### Patch Changes

- 5bae58815: bugfix - webview reload crash issue related to ui rendering layout shift bugs
- Updated dependencies [0c2c6682b]
  - @ledgerhq/native-ui@0.8.0-next.2

## 3.3.0-next.11

### Patch Changes

- 46994ebfd: Wording - small typos fixed

## 3.3.0-next.10

### Patch Changes

- 3d1ab8511: Behavior fixed when clicking on the "My Ledger" button on the tab bar when on read only mode

## 3.3.0-next.9

### Patch Changes

- Updated dependencies [ec5c4fa3d]
  - @ledgerhq/live-common@23.1.0-next.3

## 3.3.0-next.8

### Patch Changes

- 27c947ba4: fix(multibuy): remove fiat filter

## 3.3.0-next.7

### Minor Changes

- 7ba2346a5: feat(LLM): multibuy 1.5 [LIVE-1710]

## 3.3.0-next.6

### Minor Changes

- bf12e0f65: feat: sell and fund flow [LIVE-784]
- d2576ef46: feat(swap): Add Changelly's Terms of Use in the confirmation screen [LIVE-1196]

## 3.2.1

### Patch Changes

- fea7a4aa1: Fix bug of a conditionally called hook in the firmware retrieval

## 3.2.1-hotfix.0

### Patch Changes

- Updated dependencies [bf12e0f65]
  - @ledgerhq/live-common@23.1.0-next.2

## 3.3.0-next.5

### Patch Changes

- 3d71946fb: Fix deep linking logic for platform apps

## 3.3.0-next.4

### Minor Changes

- 4db0f58ca: Updated learn feature url to be remote configurable

## 3.3.0-next.3

### Minor Changes

- fe3c7a39c: Add Earn Rewards btn on Solana

## 3.3.0-next.2

### Minor Changes

- 09f79c7b4: Add Cardano to mobile

## 3.3.0-next.1

### Minor Changes

- 592ad2f7b: Update design on upsell modal in mobile app. Also add new variants and shape to IconBoxList and BoxedIcon components in native UI.
- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.

### Patch Changes

- Updated dependencies [592ad2f7b]
- Updated dependencies [608010c9d]
  - @ledgerhq/native-ui@0.8.0-next.1
  - @ledgerhq/live-common@23.1.0-next.1

## 3.2.1-next.0

### Patch Changes

- 35737e057: fix(LLM): can't open custom loaded manifest on iOS [LIVE-2481]
- 8a973ad0e: fix(LLM): platform manifest can be undefined when no network [LIVE-2571]
- Updated dependencies [8323d2eaa]
- Updated dependencies [8861c4fe0]
- Updated dependencies [dd6a12c9b]
  - @ledgerhq/live-common@23.1.0-next.0
  - @ledgerhq/native-ui@0.7.19-next.0

## 3.2.0

### Minor Changes

- becfc06f9: LIVE-1751 Solana staking on LLM
- d63570a38: Rework Cosmos delegation flow
- c6c127630: We now prompt a modal to ask the user what he thinks of the app at key moments (for example when receiving crypto or claiming rewards) based on some conditions (installed the app for at least x days, has at least x accounts, ...) The purpose of this feature is to increase the ratings of the app on the stores
- 8ea9c2deb: LLM: increase to iOS 13 minimum
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- 54dbab04f: Fix Ledger logo glitch
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- 61116f39f: Disable React Navigation Sentry integration
- a26ee3f54: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- cb5814f38: Temporarily remove some device action error tracking due to it causing a crash on iOS while offline
- 3cd734f86: Add firmware update feature for Android via OTG USB
- 54dbab04f: Fix Ledger logo glitch
- Updated dependencies [09648db7f]
- Updated dependencies [a66fbe852]
- Updated dependencies [0f59cfc10]
- Updated dependencies [8ee9c5568]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [98ecc6272]
- Updated dependencies [9a86fe231]
- Updated dependencies [8b2e24b6c]
- Updated dependencies [64c2fdb06]
- Updated dependencies [f686ec781]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0
  - @ledgerhq/native-ui@0.7.18
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [3cd734f86]
- Updated dependencies [16be6e5c0]
- Updated dependencies [a26ee3f54]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]

  - @ledgerhq/live-common@22.2.0
  - @ledgerhq/react-native-hid@6.28.3

## 3.2.0-llmnext.6

### Patch Changes

- Updated dependencies [16be6e5c0]
  - @ledgerhq/live-common@22.2.0-llmnext.2

## 3.2.0-llmnext.5

### Patch Changes

- a26ee3f54: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- Updated dependencies [a26ee3f54]
  - @ledgerhq/live-common@22.2.0-llmnext.1

## 3.2.0-llmnext.4

### Patch Changes

- cb5814f3: Temporarily remove some device action error tracking due to it causing a crash on iOS while offline

## 3.2.0-llmnext.3

### Minor Changes

- c6c12763: We now prompt a modal to ask the user what he thinks of the app at key moments (for example when receiving crypto or claiming rewards) based on some conditions (installed the app for at least x days, has at least x accounts, ...) The purpose of this feature is to increase the ratings of the app on the stores

## 3.2.0-llmnext.2

### Minor Changes

- becfc06f: LIVE-1751 Solana staking on LLM
- d63570a3: Rework Cosmos delegation flow

## 3.1.3

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1

## 3.1.3-hotfix.0

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1-hotfix.0

## 3.2.0-next.4

### Patch Changes

- Updated dependencies [8b2e24b6c]
  - @ledgerhq/live-common@23.0.0-next.4

## 3.2.0-next.3

### Patch Changes

- Updated dependencies [a66fbe852]
  - @ledgerhq/live-common@23.0.0-next.3

## 3.2.0-next.2

### Patch Changes

- Updated dependencies [8ee9c5568]
  - @ledgerhq/live-common@23.0.0-next.2

## 3.2.0-next.1

### Patch Changes

- Updated dependencies [98ecc6272]
  - @ledgerhq/live-common@23.0.0-next.1

## 3.2.0-next.0

### Minor Changes

- 8ea9c2deb: LLM: increase to iOS 13 minimum
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- 54dbab04f: Fix Ledger logo glitch
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- 61116f39f: Disable React Navigation Sentry integration
- Updated dependencies [09648db7f]
- Updated dependencies [0f59cfc10]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
- Updated dependencies [64c2fdb06]
- Updated dependencies [f686ec781]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0-next.0
  - @ledgerhq/native-ui@0.7.18-next.0

## 3.1.3

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1

## 3.1.3-hotfix.0

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1-hotfix.0

## 3.1.2

### Patch Changes

- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [9dadffa88]
- Updated dependencies [04ad3813d]
  - @ledgerhq/live-common@22.2.0

## 3.1.2-next.2

### Patch Changes

- Updated dependencies [9dadffa88]
  - @ledgerhq/live-common@22.2.0-next.2

## 3.1.2-next.1

### Patch Changes

- Updated dependencies [04ad3813d]
  - @ledgerhq/live-common@22.2.0-next.1

## 3.1.2-next.0

### Patch Changes

- Updated dependencies [e0c18707]
- Updated dependencies [ee44ffb1]
- Updated dependencies [0252fab7]
- Updated dependencies [3f816efb]
- Updated dependencies [f2574d25]
- Updated dependencies [f913f6fd]
  - @ledgerhq/live-common@22.2.0-next.0

## 3.1.2-llmnext.1

### Patch Changes

- 3cd734f8: Add firmware update feature for Android via OTG USB
- Updated dependencies [3cd734f8]
  - @ledgerhq/react-native-hid@6.28.3-llmnext.0

## 3.1.2-llmnext.0

### Patch Changes

- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- 54dbab04f: Fix Ledger logo glitch
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
  - @ledgerhq/live-common@22.2.0-llmnext.0
