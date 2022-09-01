# ledger-live-desktop

## 2.47.0-next.5

### Patch Changes

- [#998](https://github.com/LedgerHQ/ledger-live/pull/998) [`274d8a751e`](https://github.com/LedgerHQ/ledger-live/commit/274d8a751ebf79d401c7d123355705aff7f9480e) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fixes analytics support

## 2.47.0-next.4

### Patch Changes

- [#998](https://github.com/LedgerHQ/ledger-live/pull/998) [`fdf009e526`](https://github.com/LedgerHQ/ledger-live/commit/fdf009e526beb5d6413ebc95666a9df58749336a) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix handle new-window event in WebPlatformPlayer

## 2.47.0-next.3

### Patch Changes

- Updated dependencies [[`f47b2b1f47`](https://github.com/LedgerHQ/ledger-live/commit/f47b2b1f47c2256ad006ed35db9a0935e87cd503)]:
  - @ledgerhq/live-common@27.0.0-next.3

## 2.47.0-next.2

### Minor Changes

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

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

* [#625](https://github.com/LedgerHQ/ledger-live/pull/625) [`2589194215`](https://github.com/LedgerHQ/ledger-live/commit/25891942151e4fefbdf6de8cdcf4264c0317f90a) Thanks [@chabroA](https://github.com/chabroA)! - Add navigation option to WebPlatformPlayer

- [#855](https://github.com/LedgerHQ/ledger-live/pull/855) [`2258f1ae8e`](https://github.com/LedgerHQ/ledger-live/commit/2258f1ae8e052761003d2c92efd2e5d00198439e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add banner to external integrations

### Patch Changes

- Updated dependencies [[`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100), [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1)]:
  - @ledgerhq/live-common@27.0.0-next.2

## 2.47.0-next.1

### Patch Changes

- Updated dependencies [[`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2)]:
  - @ledgerhq/live-common@26.1.0-next.1

## 2.47.0-next.0

### Minor Changes

- [#814](https://github.com/LedgerHQ/ledger-live/pull/814) [`23c9bf994`](https://github.com/LedgerHQ/ledger-live/commit/23c9bf9949169d31d534f12dca48e21e35df05b2) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added development/QA tool for feature flags [Desktop]

* [#961](https://github.com/LedgerHQ/ledger-live/pull/961) [`b06c9fdf5`](https://github.com/LedgerHQ/ledger-live/commit/b06c9fdf5ccbbc68283dd73ea4c3ea0e380c1539) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Minor wording changes

### Patch Changes

- Updated dependencies [[`68c50cd94`](https://github.com/LedgerHQ/ledger-live/commit/68c50cd94bbe50a1bf284a2e9e5aed3781788754), [`432cfa899`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb), [`23c9bf994`](https://github.com/LedgerHQ/ledger-live/commit/23c9bf9949169d31d534f12dca48e21e35df05b2), [`6e057f716`](https://github.com/LedgerHQ/ledger-live/commit/6e057f7163dc53658604429e3e6c8057ae9988f4), [`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/types-live@6.24.0-next.0
  - @ledgerhq/react-ui@0.9.0-next.0
  - @ledgerhq/live-common@26.1.0-next.0
  - @ledgerhq/hw-transport@6.27.3-next.0
  - @ledgerhq/hw-transport-http@6.27.3-next.0
  - @ledgerhq/hw-transport-node-hid-singleton@6.27.4-next.0
  
## 2.46.1

### Patch Changes

- [#1082](https://github.com/LedgerHQ/ledger-live/pull/1082) [`7b3026ba25`](https://github.com/LedgerHQ/ledger-live/commit/7b3026ba25a30d0733defe5459a37f9c6b6b1772) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fixes analytics support

* [#1078](https://github.com/LedgerHQ/ledger-live/pull/1078) [`3aafec3d8b`](https://github.com/LedgerHQ/ledger-live/commit/3aafec3d8becd74a96421540388e2460dd0e4627) Thanks [@chabroA](https://github.com/chabroA)! - Fix handle new-window event in WebPlatformPlayer

## 2.46.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

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

- [#625](https://github.com/LedgerHQ/ledger-live/pull/625) [`2589194215`](https://github.com/LedgerHQ/ledger-live/commit/25891942151e4fefbdf6de8cdcf4264c0317f90a) Thanks [@chabroA](https://github.com/chabroA)! - Add navigation option to WebPlatformPlayer

* [#855](https://github.com/LedgerHQ/ledger-live/pull/855) [`2258f1ae8e`](https://github.com/LedgerHQ/ledger-live/commit/2258f1ae8e052761003d2c92efd2e5d00198439e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add banner to external integrations

### Patch Changes

- [#757](https://github.com/LedgerHQ/ledger-live/pull/757) [`1edaab40e4`](https://github.com/LedgerHQ/ledger-live/commit/1edaab40e4d457cbe96f27a6b2a149517f800091) Thanks [@gre](https://github.com/gre)! - Downgrade @sentry/node to a compatible version with @sentry/electron

* [#645](https://github.com/LedgerHQ/ledger-live/pull/645) [`88002763f3`](https://github.com/LedgerHQ/ledger-live/commit/88002763f3b7dc394cb8dff67b72cc234298c5f1) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add generic lotties

- [#768](https://github.com/LedgerHQ/ledger-live/pull/768) [`73cad51a50`](https://github.com/LedgerHQ/ledger-live/commit/73cad51a50af55048d56566914c2f80a2fc29f02) Thanks [@Justkant](https://github.com/Justkant)! - fix: use getMainAccount in broadcastTransaction [LIVE-3142]

* [#402](https://github.com/LedgerHQ/ledger-live/pull/402) [`6cd97ea894`](https://github.com/LedgerHQ/ledger-live/commit/6cd97ea89431d506b3c7021bd5753ecdb1e562da) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Migrate webplayerplatform to typescript

- [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb94`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

* [#537](https://github.com/LedgerHQ/ledger-live/pull/537) [`910a79bc7e`](https://github.com/LedgerHQ/ledger-live/commit/910a79bc7e1668f71c7db3f9abf26e8e933ca2e7) Thanks [@tomav](https://github.com/tomav)! - Fixes autofocus on password field in lock screen

- [#859](https://github.com/LedgerHQ/ledger-live/pull/859) [`f66e547cb9`](https://github.com/LedgerHQ/ledger-live/commit/f66e547cb9f9c6403f3046c08c8c14789fc47bfd) Thanks [@gre](https://github.com/gre)! - Add Analytics 'reason' field in context of sync events

- Updated dependencies [[`37159cbb9e`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e), [`ebe1adfb7d`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6), [`3dbd4d0781`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f), [`1a33d8641f`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5), [`807f3feb94`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8), [`9f5d214c72`](https://github.com/LedgerHQ/ledger-live/commit/9f5d214c72849221ac52b40a175c10caacb6405a), [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100), [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1), [`eb74f06064`](https://github.com/LedgerHQ/ledger-live/commit/eb74f06064404051b182e0f6b0e9f2a3e2f2dc9f), [`f4b7894426`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466), [`97eab434de`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9)]:
  - @ledgerhq/live-common@26.0.0
  - @ledgerhq/types-live@6.23.0
  - @ledgerhq/react-ui@0.8.3
  - @ledgerhq/types-cryptoassets@6.23.0

## 2.46.0-next.4

### Minor Changes

- [#625](https://github.com/LedgerHQ/ledger-live/pull/625) [`258919421`](https://github.com/LedgerHQ/ledger-live/commit/25891942151e4fefbdf6de8cdcf4264c0317f90a) Thanks [@chabroA](https://github.com/chabroA)! - Add navigation option to WebPlatformPlayer

## 2.46.0-next.3

### Minor Changes

- [#855](https://github.com/LedgerHQ/ledger-live/pull/855) [`2258f1ae8`](https://github.com/LedgerHQ/ledger-live/commit/2258f1ae8e052761003d2c92efd2e5d00198439e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add banner to external integrations

## 2.46.0-next.2

### Patch Changes

- Updated dependencies [[`a36d1de86`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100)]:
  - @ledgerhq/live-common@26.0.0-next.2

## 2.46.0-next.1

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

## 2.46.0-next.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

### Patch Changes

- [#757](https://github.com/LedgerHQ/ledger-live/pull/757) [`1edaab40e`](https://github.com/LedgerHQ/ledger-live/commit/1edaab40e4d457cbe96f27a6b2a149517f800091) Thanks [@gre](https://github.com/gre)! - Downgrade @sentry/node to a compatible version with @sentry/electron

* [#645](https://github.com/LedgerHQ/ledger-live/pull/645) [`88002763f`](https://github.com/LedgerHQ/ledger-live/commit/88002763f3b7dc394cb8dff67b72cc234298c5f1) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add generic lotties

- [#768](https://github.com/LedgerHQ/ledger-live/pull/768) [`73cad51a5`](https://github.com/LedgerHQ/ledger-live/commit/73cad51a50af55048d56566914c2f80a2fc29f02) Thanks [@Justkant](https://github.com/Justkant)! - fix: use getMainAccount in broadcastTransaction [LIVE-3142]

* [#402](https://github.com/LedgerHQ/ledger-live/pull/402) [`6cd97ea89`](https://github.com/LedgerHQ/ledger-live/commit/6cd97ea89431d506b3c7021bd5753ecdb1e562da) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Migrate webplayerplatform to typescript

- [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

* [#537](https://github.com/LedgerHQ/ledger-live/pull/537) [`910a79bc7`](https://github.com/LedgerHQ/ledger-live/commit/910a79bc7e1668f71c7db3f9abf26e8e933ca2e7) Thanks [@tomav](https://github.com/tomav)! - Fixes autofocus on password field in lock screen

- [#859](https://github.com/LedgerHQ/ledger-live/pull/859) [`f66e547cb`](https://github.com/LedgerHQ/ledger-live/commit/f66e547cb9f9c6403f3046c08c8c14789fc47bfd) Thanks [@gre](https://github.com/gre)! - Add Analytics 'reason' field in context of sync events

- Updated dependencies [[`37159cbb9`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e), [`ebe1adfb7`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6), [`3dbd4d078`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f), [`1a33d8641`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5), [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8), [`9f5d214c7`](https://github.com/LedgerHQ/ledger-live/commit/9f5d214c72849221ac52b40a175c10caacb6405a), [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`eb74f0606`](https://github.com/LedgerHQ/ledger-live/commit/eb74f06064404051b182e0f6b0e9f2a3e2f2dc9f), [`f4b789442`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466), [`97eab434d`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9)]:
  - @ledgerhq/live-common@25.2.0-next.0
  - @ledgerhq/types-live@6.23.0-next.0
  - @ledgerhq/react-ui@0.8.3-next.0
  - @ledgerhq/types-cryptoassets@6.23.0-next.0

## 2.45.1

### Patch Changes

- [`7526b8ae51`](https://github.com/LedgerHQ/ledger-live/commit/7526b8ae5139fb478c6500c9b216ba46d5d36f17) Thanks [@Justkant](https://github.com/Justkant)! - Reduce perf sampling for sentry

* [`7526b8ae51`](https://github.com/LedgerHQ/ledger-live/commit/7526b8ae5139fb478c6500c9b216ba46d5d36f17) Thanks [@Justkant](https://github.com/Justkant)! - Fixes segment integration

## 2.45.1-hotfix.2

### Patch Changes

- [#801](https://github.com/LedgerHQ/ledger-live/pull/801) [`5832094f1`](https://github.com/LedgerHQ/ledger-live/commit/5832094f124077ff1ebf5a456044f70964757e7a) Thanks [@gre](https://github.com/gre)! - Reduce perf sampling for sentry

* [#801](https://github.com/LedgerHQ/ledger-live/pull/801) [`5832094f1`](https://github.com/LedgerHQ/ledger-live/commit/5832094f124077ff1ebf5a456044f70964757e7a) Thanks [@gre](https://github.com/gre)! - Fixes segment integration

## 2.45.1-hotfix.1

## 2.45.0

### Minor Changes

- [#659](https://github.com/LedgerHQ/ledger-live/pull/659) [`eb83f93b1`](https://github.com/LedgerHQ/ledger-live/commit/eb83f93b1663404c2826692f2cc5f0be8cdd4bdd) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLD - buy and sell - redirect entry points of exchange app towards the new incoming live app

* [#462](https://github.com/LedgerHQ/ledger-live/pull/462) [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Cardano tokens in LLD

- [#602](https://github.com/LedgerHQ/ledger-live/pull/602) [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Accept new message.sign call from the live-app-sdk

* [#81](https://github.com/LedgerHQ/ledger-live/pull/81) [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - feat: add ERC20 token support to the Platform API

- [#624](https://github.com/LedgerHQ/ledger-live/pull/624) [`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add Searching bar for validators list of ATOM and SOL

* [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add memo capability to hedera coin family.

### Patch Changes

- [#734](https://github.com/LedgerHQ/ledger-live/pull/734) [`61b61d9d1`](https://github.com/LedgerHQ/ledger-live/commit/61b61d9d19bdc0c82108168bcf98b5f5769a038b) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLD - Buy Sell live app redirection should now use the correct account param identifier

* [#386](https://github.com/LedgerHQ/ledger-live/pull/386) [`8917ca143`](https://github.com/LedgerHQ/ledger-live/commit/8917ca1436e780e3a52f66f968f8224ad35362b4) Thanks [@gre](https://github.com/gre)! - Log experimental and feature flags in Sentry error reports.

- [#415](https://github.com/LedgerHQ/ledger-live/pull/415) [`6ef54d871`](https://github.com/LedgerHQ/ledger-live/commit/6ef54d871740f1b5378d2e259864c239aaea9c99) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Ellipsis added to memo for Cosmos

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

* Updated dependencies [[`345706e24`](https://github.com/LedgerHQ/ledger-live/commit/345706e24e91ba4c397d4a6ffc1b2b174a0ddc84), [`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905), [`e0516e387`](https://github.com/LedgerHQ/ledger-live/commit/e0516e3877fbbef458ec4da9e06bd9d7db09d0ee), [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01), [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a), [`e4b7dc326`](https://github.com/LedgerHQ/ledger-live/commit/e4b7dc32664d32b43dfae2821c29715ae94a6ab4), [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67), [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0), [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf), [`3be077f54`](https://github.com/LedgerHQ/ledger-live/commit/3be077f547cce51d8640a13fd37583d7782ab8a2), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/live-common@25.0.0
  - @ledgerhq/react-ui@0.8.1
  - @ledgerhq/errors@6.10.1
  - @ledgerhq/devices@7.0.0
  - @ledgerhq/hw-transport@6.27.2
  - @ledgerhq/hw-transport-http@6.27.2
  - @ledgerhq/hw-transport-node-hid-singleton@6.27.3

## 2.45.0-next.8

### Patch Changes

- [#734](https://github.com/LedgerHQ/ledger-live/pull/734) [`61b61d9d1`](https://github.com/LedgerHQ/ledger-live/commit/61b61d9d19bdc0c82108168bcf98b5f5769a038b) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLD - Buy Sell live app redirection should now use the correct account param identifier

## 2.45.0-next.7

### Minor Changes

- [#624](https://github.com/LedgerHQ/ledger-live/pull/624) [`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add Searching bar for validators list of ATOM and SOL

### Patch Changes

- Updated dependencies [[`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67)]:
  - @ledgerhq/live-common@25.0.0-next.6

## 2.45.0-next.6

### Minor Changes

- [#462](https://github.com/LedgerHQ/ledger-live/pull/462) [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Cardano tokens in LLD

### Patch Changes

- Updated dependencies [[`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01)]:
  - @ledgerhq/live-common@25.0.0-next.5

## 2.45.0-next.5

### Minor Changes

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add memo capability to hedera coin family.

### Patch Changes

- Updated dependencies [[`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf)]:
  - @ledgerhq/live-common@25.0.0-next.4

## 2.45.0-next.4

### Minor Changes

- [#659](https://github.com/LedgerHQ/ledger-live/pull/659) [`eb83f93b1`](https://github.com/LedgerHQ/ledger-live/commit/eb83f93b1663404c2826692f2cc5f0be8cdd4bdd) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLD - buy and sell - redirect entry points of exchange app towards the new incoming live app

## 2.45.0-next.3

### Minor Changes

- [#81](https://github.com/LedgerHQ/ledger-live/pull/81) [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - feat: add ERC20 token support to the Platform API

### Patch Changes

- Updated dependencies [[`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db)]:
  - @ledgerhq/live-common@25.0.0-next.3

## 2.45.0-next.2

### Patch Changes

- Updated dependencies [[`345706e24`](https://github.com/LedgerHQ/ledger-live/commit/345706e24e91ba4c397d4a6ffc1b2b174a0ddc84)]:
  - @ledgerhq/live-common@25.0.0-next.2

## 2.45.0-next.1

### Minor Changes

- [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

### Patch Changes

- Updated dependencies [[`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0)]:
  - @ledgerhq/live-common@25.0.0-next.1

## 2.45.0-next.0

### Minor Changes

- [#602](https://github.com/LedgerHQ/ledger-live/pull/602) [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Accept new message.sign call from the live-app-sdk

### Patch Changes

- [#386](https://github.com/LedgerHQ/ledger-live/pull/386) [`8917ca143`](https://github.com/LedgerHQ/ledger-live/commit/8917ca1436e780e3a52f66f968f8224ad35362b4) Thanks [@gre](https://github.com/gre)! - Log experimental and feature flags in Sentry error reports.

* [#415](https://github.com/LedgerHQ/ledger-live/pull/415) [`6ef54d871`](https://github.com/LedgerHQ/ledger-live/commit/6ef54d871740f1b5378d2e259864c239aaea9c99) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Ellipsis added to memo for Cosmos

- [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

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

- Updated dependencies [[`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905), [`e0516e387`](https://github.com/LedgerHQ/ledger-live/commit/e0516e3877fbbef458ec4da9e06bd9d7db09d0ee), [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a), [`e4b7dc326`](https://github.com/LedgerHQ/ledger-live/commit/e4b7dc32664d32b43dfae2821c29715ae94a6ab4), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`3be077f54`](https://github.com/LedgerHQ/ledger-live/commit/3be077f547cce51d8640a13fd37583d7782ab8a2), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/live-common@25.0.0-next.0
  - @ledgerhq/react-ui@0.8.1-next.0
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/devices@7.0.0-next.0
  - @ledgerhq/hw-transport@6.27.2-next.0
  - @ledgerhq/hw-transport-http@6.27.2-next.0
  - @ledgerhq/hw-transport-node-hid-singleton@6.27.3-next.0

## 2.44.1

### Patch Changes

- Updated dependencies [[`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/live-common@24.1.0-next.1
- Updated dependencies [[`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860)]:
  - @ledgerhq/live-common@24.1.0-next.0

## 2.44.1-next.1

### Patch Changes

- Updated dependencies [[`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/live-common@24.1.0-next.1

## 2.44.1-next.0

### Patch Changes

- Updated dependencies [[`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860)]:
  - @ledgerhq/live-common@24.1.0-next.0

## 2.44.0

### Minor Changes

- [#444](https://github.com/LedgerHQ/ledger-live/pull/444) [`0e076b0f3`](https://github.com/LedgerHQ/ledger-live/commit/0e076b0f3aa34ee8e56db5623b99ddb9c8d71700) Thanks [@Justkant](https://github.com/Justkant)! - feat: integration of alternate DEX on swap page [LIVE-2677]

* [#92](https://github.com/LedgerHQ/ledger-live/pull/92) [`ce02e4e78`](https://github.com/LedgerHQ/ledger-live/commit/ce02e4e78f575efb1c3a7e5da9ed116e9ef850b3) Thanks [@Justkant](https://github.com/Justkant)! - feat(swap): Add Changelly's Terms of Use in the confirmation screen [LIVE-1195]

- [#275](https://github.com/LedgerHQ/ledger-live/pull/275) [`a35c6e9a3`](https://github.com/LedgerHQ/ledger-live/commit/a35c6e9a310f9bc711b24303ab5397041d64c199) Thanks [@gre](https://github.com/gre)! - Add Sentry support

* [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`b531aa0bc`](https://github.com/LedgerHQ/ledger-live/commit/b531aa0bc0b18304813b5a2b08a6107c587ea6ba) Thanks [@github-actions](https://github.com/apps/github-actions)! - NFT counter value added on LLM and LLD with feature flagging

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`b531aa0bc`](https://github.com/LedgerHQ/ledger-live/commit/b531aa0bc0b18304813b5a2b08a6107c587ea6ba) Thanks [@github-actions](https://github.com/apps/github-actions)! - Bitcoin Rbf new implementation. Jira ticket: LIVE-1414, LIVE-1415, LIVE-1416

### Patch Changes

- [#186](https://github.com/LedgerHQ/ledger-live/pull/186) [`cdcee7ad9`](https://github.com/LedgerHQ/ledger-live/commit/cdcee7ad98767c117f854fd9ddcb9e1962ecc6cf) Thanks [@elbywan](https://github.com/elbywan)! - Replace webpack with esbuild for production builds.

* [#432](https://github.com/LedgerHQ/ledger-live/pull/432) [`ebb7deb1a`](https://github.com/LedgerHQ/ledger-live/commit/ebb7deb1af2b35b9e0d3a55f7e141136b3acebf8) Thanks [@elbywan](https://github.com/elbywan)! - Fix regression when opening external windows from within a webview tag

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`6f2aaedab`](https://github.com/LedgerHQ/ledger-live/commit/6f2aaedabe97e313f8a0d5b9725324220582ddf4) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix swap TOS styling

* [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`4de067e7c`](https://github.com/LedgerHQ/ledger-live/commit/4de067e7cffabf0fef5ee896f316b5374bed6365) Thanks [@github-actions](https://github.com/apps/github-actions)! - Swap: Fixes styling issues

- [#324](https://github.com/LedgerHQ/ledger-live/pull/324) [`89e31c3c4`](https://github.com/LedgerHQ/ledger-live/commit/89e31c3c46570f9ffe21f48a5e76ddc1bcfbc668) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Fixed issue on CryptoCurrency Icon in transactions history (size issue)

* [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`8ecc114d9`](https://github.com/LedgerHQ/ledger-live/commit/8ecc114d9693c2da7d51c000612ecf72cb3f9b55) Thanks [@github-actions](https://github.com/apps/github-actions)! - Handle all non final (i.e: non OK nor KO) status as pending

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`b531aa0bc`](https://github.com/LedgerHQ/ledger-live/commit/b531aa0bc0b18304813b5a2b08a6107c587ea6ba) Thanks [@github-actions](https://github.com/apps/github-actions)! - Adding optimistic operations to NFT transfers

* [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`b531aa0bc`](https://github.com/LedgerHQ/ledger-live/commit/b531aa0bc0b18304813b5a2b08a6107c587ea6ba) Thanks [@github-actions](https://github.com/apps/github-actions)! - Add loading spinner on "From amount" field in Swap form when using "Send max" toggle

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`b531aa0bc`](https://github.com/LedgerHQ/ledger-live/commit/b531aa0bc0b18304813b5a2b08a6107c587ea6ba) Thanks [@github-actions](https://github.com/apps/github-actions)! - Add basic support for macOS universal apps.

## 2.44.0-next.1

### Patch Changes

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`4de067e7c`](https://github.com/LedgerHQ/ledger-live/commit/4de067e7cffabf0fef5ee896f316b5374bed6365) Thanks [@github-actions](https://github.com/apps/github-actions)! - Swap: Fixes styling issues

## 2.44.0-next.0

### Minor Changes

- [#502](https://github.com/LedgerHQ/ledger-live/pull/502) [`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Bitcoin Rbf new implementation. Jira ticket: LIVE-1414, LIVE-1415, LIVE-1416

### Patch Changes

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`6f2aaedab`](https://github.com/LedgerHQ/ledger-live/commit/6f2aaedabe97e313f8a0d5b9725324220582ddf4) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix swap TOS styling

- Updated dependencies [[`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062)]:
  - @ledgerhq/live-common@24.0.0-next.4

## 2.44.0-next.4

### Minor Changes

- 5145781e5: NFT counter value added on LLM and LLD with feature flagging

### Patch Changes

- Updated dependencies [5145781e5]
  - @ledgerhq/live-common@24.0.0-next.3

## 2.44.0-next.3

### Minor Changes

- ce02e4e78: feat(swap): Add Changelly's Terms of Use in the confirmation screen [LIVE-1195]

## 2.44.0-next.2

### Minor Changes

- 0e076b0f3: feat: integration of alternate DEX on swap page [LIVE-2677]

## 2.43.2-next.1

### Patch Changes

- c5714333b: Adding optimistic operations to NFT transfers
- Updated dependencies [c5714333b]
  - @ledgerhq/live-common@24.0.0-next.2

## 2.43.2-next.0

### Patch Changes

- 99cc5bbc1: Handle all non final (i.e: non OK nor KO) status as pending
- 99cc5bbc1: Add loading spinner on "From amount" field in Swap form when using "Send max" toggle
- Updated dependencies [99cc5bbc1]
- Updated dependencies [99cc5bbc1]
  - @ledgerhq/live-common@24.0.0-next.1

## 2.45.0-next.0

### Minor Changes

- a35c6e9a3: Add Sentry support

### Patch Changes

- cdcee7ad9: Replace webpack with esbuild for production builds.
- ebb7deb1a: Fix regression when opening external windows from within a webview tag
- 89e31c3c4: Fixed issue on CryptoCurrency Icon in transactions history (size issue)
- c5c3f48e4: Add basic support for macOS universal apps.
- Updated dependencies [22531f3c3]
- Updated dependencies [e393b9bfa]
- Updated dependencies [d22452817]
- Updated dependencies [2012b5477]
- Updated dependencies [10440ec3c]
- Updated dependencies [e1f2f07a2]
- Updated dependencies [9c3e27f46]
- Updated dependencies [1e4a5647b]
- Updated dependencies [c5c3f48e4]
- Updated dependencies [ef01a3cc2]
- Updated dependencies [508e4c23b]
- Updated dependencies [b1e396dd8]
- Updated dependencies [e9decc277]
  - @ledgerhq/live-common@24.0.0-next.0
  - @ledgerhq/react-ui@0.8.0-next.0
  - @ledgerhq/hw-transport-node-hid-singleton@6.27.2-next.0

## 2.44.0

### Minor Changes

- 4db0f58ca: Updated learn feature url to be remote configurable
- 9c3b16bcc: Fix infinite loading when NFTs are load in gallery mode

### Patch Changes

- 4a676321f: Remove unecessary 'sqlite' cleanup that no longer is needed after libcore sunset
- c78f7d6db: Fixed issue on Circulating Supply, removed currency in front of the value
- Updated dependencies [8323d2eaa]
- Updated dependencies [bf12e0f65]
- Updated dependencies [8861c4fe0]
- Updated dependencies [ec5c4fa3d]
- Updated dependencies [608010c9d]
- Updated dependencies [78a64769d]
- Updated dependencies [0c2c6682b]
  - @ledgerhq/live-common@23.1.0
  - @ledgerhq/react-ui@0.7.8

## 2.44.0-next.6

### Patch Changes

- Updated dependencies [78a64769d]
  - @ledgerhq/live-common@23.1.0-next.4

## 2.44.0-next.5

### Patch Changes

- Updated dependencies [0c2c6682b]
  - @ledgerhq/react-ui@0.7.8-next.0

## 2.44.0-next.4

### Patch Changes

- Updated dependencies [ec5c4fa3d]
  - @ledgerhq/live-common@23.1.0-next.3

## 2.44.0-next.3

### Patch Changes

- Updated dependencies [bf12e0f65]
  - @ledgerhq/live-common@23.1.0-next.2

## 2.44.0-next.2

### Minor Changes

- 4db0f58ca: Updated learn feature url to be remote configurable

## 2.44.0-next.1

### Patch Changes

- Updated dependencies [608010c9d]
  - @ledgerhq/live-common@23.1.0-next.1

## 2.44.0-next.0

### Minor Changes

- 9c3b16bcc: Fix infinite loading when NFTs are load in gallery mode

### Patch Changes

- 4a676321f: Remove unecessary 'sqlite' cleanup that no longer is needed after libcore sunset
- c78f7d6db: Fixed issue on Circulating Supply, removed currency in front of the value
- Updated dependencies [8323d2eaa]
- Updated dependencies [8861c4fe0]
  - @ledgerhq/live-common@23.1.0-next.0

## 2.43.1

### Patch Changes

- 2707fa19b: add release notes

## 2.43.0

### Minor Changes

- cefeff1d7: Display a modal at app launch to inform users terms of use got updated. Also refactor the way we assess terms update using date comparison instead of strict string equality.
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading
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
  - @ledgerhq/react-ui@0.7.7

## 2.43.0-next.5

### Patch Changes

- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading
- Updated dependencies [8b2e24b6c]
  - @ledgerhq/live-common@23.0.0-next.4

## 2.43.0-next.4

### Patch Changes

- Updated dependencies [a66fbe852]
  - @ledgerhq/live-common@23.0.0-next.3

## 2.43.0-next.3

### Patch Changes

- Updated dependencies [8ee9c5568]
  - @ledgerhq/live-common@23.0.0-next.2

## 2.43.0-next.2

### Patch Changes

- Updated dependencies [98ecc6272]
  - @ledgerhq/live-common@23.0.0-next.1

## 2.43.0-next.1

### Minor Changes

- cefeff1d7: Display a modal at app launch to inform users terms of use got updated. Also refactor the way we assess terms update using date comparison instead of strict string equality.

## 2.43.0-next.0

### Minor Changes

- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

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
  - @ledgerhq/react-ui@0.7.7-next.0

## 2.42.0

### Minor Changes

- e0c187073: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb17: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab71: LIVE-1004 Hedera first integration in LLD
- daaf595c2: Add Chinese (ZH) and Spanish (ES) to discoverable languages. Also refactor the system language detection function.
- f913f6fdb: LIVE-2162 Solana staking UX improvements
- b054eb4d9: Fix wrong cosmos validator at summary step

### Patch Changes

- 1735fdd30: bugfix - market page lag issue during navigation fixed + removal of duplicated breadcrumb on market details page
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [16be6e5c0]
- Updated dependencies [a26ee3f54]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
  - @ledgerhq/live-common@22.2.0

## 2.42.0-llmnext.3

### Patch Changes

- Updated dependencies [16be6e5c0]
  - @ledgerhq/live-common@22.2.0-llmnext.2

## 2.42.0-llmnext.2

### Patch Changes

- Updated dependencies [a26ee3f54]
  - @ledgerhq/live-common@22.2.0-llmnext.1

## 2.42.0-llmnext.1

### Minor Changes

- b054eb4d: Fix wrong cosmos validator at summary step

## 2.42.0-llmnext.0

### Minor Changes

- e0c187073: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb17: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab71: LIVE-1004 Hedera first integration in LLD
- daaf595c2: Add Chinese (ZH) and Spanish (ES) to discoverable languages. Also refactor the system language detection function.
- f913f6fdb: LIVE-2162 Solana staking UX improvements

### Patch Changes

- 1735fdd30: bugfix - market page lag issue during navigation fixed + removal of duplicated breadcrumb on market details page
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
  - @ledgerhq/live-common@22.2.0-llmnext.0