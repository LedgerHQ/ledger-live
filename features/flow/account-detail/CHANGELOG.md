# @features/flow-account-detail

## 0.2.0-next.0

### Minor Changes

- [#23618](https://github.com/LedgerHQ/ledger-live/pull/23618) [`93b62c3`](https://github.com/LedgerHQ/ledger-live/commit/93b62c317f1aeb5666f74ae91bff9d589c5ac1d5) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the hero: account balance (native + tokens) and quick-action tiles scoped to the account. A funded account gets Transfer · Swap · More (or Buy / Sell tiles when nothing can be swapped) with Buy · Sell · Earn in More; an account without funds gets Transfer and Buy only. Transfer opens the Transfer sheet on the account. Buy and Swap open the asset drawer on the account's network (every supported asset of that network, held or not), then open prefilled with the picked asset; when the network only has its coin, the drawer picks it directly. Swap brings the picked asset into this account (the source is chosen in Swap). Send, Sell and Earn ask which of the account's assets supporting the action to use, including those without balance, ordered by countervalue, and open directly when only one qualifies. `@features/platform-quick-actions` now owns the account asset rules (`listHeldAssets`, `hasAnyFunds`, `resolveAssetsByAction`, `sortAssetsByValue`); on desktop, Earn is shown inactive without funds. Section spacing follows Figma (24px between sections on mobile).

### Patch Changes

- Updated dependencies [[`35233dc`](https://github.com/LedgerHQ/ledger-live/commit/35233dc9e0f3389644536070fc3b9a2624d79826), [`7077a0a`](https://github.com/LedgerHQ/ledger-live/commit/7077a0ac3e17ba9922562ca286232bd7c475a4f4), [`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284), [`fab7c15`](https://github.com/LedgerHQ/ledger-live/commit/fab7c1541531f1f50efbc0c3efec1fbecda63ff9), [`102829a`](https://github.com/LedgerHQ/ledger-live/commit/102829a0c606564a8d36541391fac354ffb5b0cc), [`5b0e4e1`](https://github.com/LedgerHQ/ledger-live/commit/5b0e4e112e84cc236adea3fad7d2dba119286aac), [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2), [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`292b712`](https://github.com/LedgerHQ/ledger-live/commit/292b7129a233b43150c9c452b0efb20629a0bb58), [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`8df0f06`](https://github.com/LedgerHQ/ledger-live/commit/8df0f06428dea5a14e9f81672cdf4ed6042967a2), [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844), [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763), [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766), [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c)]:
  - @features/flow-account-detail-hero@0.2.0-next.0
  - @shared/feature-flags@0.28.0-next.0
  - @features/flow-account-detail-settings@0.2.0-next.0
  - @features/platform-feature-flags@0.10.0-next.0

## 0.1.0

### Minor Changes

- [#23363](https://github.com/LedgerHQ/ledger-live/pull/23363) [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail packages: `@features/flow-account-detail` (layout and `accountDetail` flag gate), `@features/flow-account-detail-hero` and `@features/flow-account-detail-settings` skeletons.

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c), [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab), [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321), [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc), [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b), [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0
  - @features/flow-account-detail-settings@0.1.0
  - @features/flow-account-detail-hero@0.1.0
  - @features/platform-feature-flags@0.9.1

## 0.1.0-next.0

### Minor Changes

- [#23363](https://github.com/LedgerHQ/ledger-live/pull/23363) [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail packages: `@features/flow-account-detail` (layout and `accountDetail` flag gate), `@features/flow-account-detail-hero` and `@features/flow-account-detail-settings` skeletons.

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c), [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab), [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321), [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc), [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b), [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0-next.0
  - @features/flow-account-detail-settings@0.1.0-next.0
  - @features/flow-account-detail-hero@0.1.0-next.0
  - @features/platform-feature-flags@0.9.1-next.0
