# @features/flow-account-detail

## 0.5.0-next.0

### Minor Changes

- [#24617](https://github.com/LedgerHQ/ledger-live/pull/24617) [`45f0819`](https://github.com/LedgerHQ/ledger-live/commit/45f081972c38225dfed314c9d8313cd510629a85) Thanks [@ysitbon](https://github.com/ysitbon)! - AccountDetailLayout tests import the component without a platform suffix.

- [#24593](https://github.com/LedgerHQ/ledger-live/pull/24593) [`5dff2e5`](https://github.com/LedgerHQ/ledger-live/commit/5dff2e54adbff5b6bc5ad2e57bbd6c5e6f85271a) Thanks [@deepyjr](https://github.com/deepyjr)! - Gate the Account Detail Analytics banner with the `accountDetail` `analyticsBanner` param, send it to analytics and keep the banner until it is closed

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`79fbc3e`](https://github.com/LedgerHQ/ledger-live/commit/79fbc3e91945f78c42bc69c79ca4daf8df331a99), [`1d97ca7`](https://github.com/LedgerHQ/ledger-live/commit/1d97ca78b8e326c5bdd1af98199dd9e9aa06b4c5), [`d1e1f5f`](https://github.com/LedgerHQ/ledger-live/commit/d1e1f5f156ff95ae5fd7ebdeaec3b5d628d671b7), [`d593a3d`](https://github.com/LedgerHQ/ledger-live/commit/d593a3d4a21bcdc6e28a193521b949c1323a4a5b), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`5dff2e5`](https://github.com/LedgerHQ/ledger-live/commit/5dff2e54adbff5b6bc5ad2e57bbd6c5e6f85271a), [`3a6ddb3`](https://github.com/LedgerHQ/ledger-live/commit/3a6ddb3fbd9d18c8005b9aef84597c8dc92dcfab)]:
  - @shared/feature-flags@0.31.0-next.0
  - @features/platform-feature-flags@0.13.0-next.0
  - @features/flow-account-detail-settings@0.3.2-next.0
  - @features/flow-account-detail-hero@0.4.0

## 0.4.0

### Minor Changes

- [#24443](https://github.com/LedgerHQ/ledger-live/pull/24443) [`c842892`](https://github.com/LedgerHQ/ledger-live/commit/c8428923a5cf0ed556ff7a48a6e373c740cdb6a1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Send `network` instead of `currency` and drop `isTokenAccount` on the account detail page events

- [#24196](https://github.com/LedgerHQ/ledger-live/pull/24196) [`77e21f9`](https://github.com/LedgerHQ/ledger-live/commit/77e21f9395f93b4ede8e70b68f3f74139622a25a) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Account Detail Analytics introduction in a dedicated layout slot above the custom place, with dismissal persisted across desktop restarts and account entry context.

- [#24462](https://github.com/LedgerHQ/ledger-live/pull/24462) [`73bd4ee`](https://github.com/LedgerHQ/ledger-live/commit/73bd4ee5567f188c79b70a3f2bd2507e81d2ba85) Thanks [@deepyjr](https://github.com/deepyjr)! - Track the Analytics filters, the Analytics banner click and its visibility on the account page.

### Patch Changes

- Updated dependencies [[`39cb975`](https://github.com/LedgerHQ/ledger-live/commit/39cb9752fe05ea8510059b5302f1e44575641b78), [`0ebe8ea`](https://github.com/LedgerHQ/ledger-live/commit/0ebe8ea274936993a9dff1c36bf7b036d531e1f5), [`2c728a2`](https://github.com/LedgerHQ/ledger-live/commit/2c728a22e6acce91ec50f07bb676114850389d4a), [`59280f5`](https://github.com/LedgerHQ/ledger-live/commit/59280f54cb1b4cf679f926dfeac4848103b0ac42), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`498cbdd`](https://github.com/LedgerHQ/ledger-live/commit/498cbdd918b0117959e9e0ff9db6adb31191b138), [`62bdc34`](https://github.com/LedgerHQ/ledger-live/commit/62bdc344261d600a3d7d2b78a8cdb9e7b3c97c25), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24), [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f), [`d528ea0`](https://github.com/LedgerHQ/ledger-live/commit/d528ea06fe6571e7c990936f2f22831e754b0178), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`0d2268d`](https://github.com/LedgerHQ/ledger-live/commit/0d2268d099e6ad7adac33bcb1e4456a28712a2ec)]:
  - @shared/feature-flags@0.30.0
  - @features/flow-account-detail-hero@0.4.0
  - @features/platform-feature-flags@0.12.0
  - @features/flow-account-detail-settings@0.3.1

## 0.4.0-next.0

### Minor Changes

- [#24443](https://github.com/LedgerHQ/ledger-live/pull/24443) [`c842892`](https://github.com/LedgerHQ/ledger-live/commit/c8428923a5cf0ed556ff7a48a6e373c740cdb6a1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Send `network` instead of `currency` and drop `isTokenAccount` on the account detail page events

- [#24196](https://github.com/LedgerHQ/ledger-live/pull/24196) [`77e21f9`](https://github.com/LedgerHQ/ledger-live/commit/77e21f9395f93b4ede8e70b68f3f74139622a25a) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Account Detail Analytics introduction in a dedicated layout slot above the custom place, with dismissal persisted across desktop restarts and account entry context.

- [#24462](https://github.com/LedgerHQ/ledger-live/pull/24462) [`73bd4ee`](https://github.com/LedgerHQ/ledger-live/commit/73bd4ee5567f188c79b70a3f2bd2507e81d2ba85) Thanks [@deepyjr](https://github.com/deepyjr)! - Track the Analytics filters, the Analytics banner click and its visibility on the account page.

### Patch Changes

- Updated dependencies [[`39cb975`](https://github.com/LedgerHQ/ledger-live/commit/39cb9752fe05ea8510059b5302f1e44575641b78), [`0ebe8ea`](https://github.com/LedgerHQ/ledger-live/commit/0ebe8ea274936993a9dff1c36bf7b036d531e1f5), [`2c728a2`](https://github.com/LedgerHQ/ledger-live/commit/2c728a22e6acce91ec50f07bb676114850389d4a), [`59280f5`](https://github.com/LedgerHQ/ledger-live/commit/59280f54cb1b4cf679f926dfeac4848103b0ac42), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`498cbdd`](https://github.com/LedgerHQ/ledger-live/commit/498cbdd918b0117959e9e0ff9db6adb31191b138), [`62bdc34`](https://github.com/LedgerHQ/ledger-live/commit/62bdc344261d600a3d7d2b78a8cdb9e7b3c97c25), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24), [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f), [`d528ea0`](https://github.com/LedgerHQ/ledger-live/commit/d528ea06fe6571e7c990936f2f22831e754b0178), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`0d2268d`](https://github.com/LedgerHQ/ledger-live/commit/0d2268d099e6ad7adac33bcb1e4456a28712a2ec)]:
  - @shared/feature-flags@0.30.0-next.0
  - @features/flow-account-detail-hero@0.4.0-next.0
  - @features/platform-feature-flags@0.12.0-next.0
  - @features/flow-account-detail-settings@0.3.1-next.0

## 0.3.0

### Minor Changes

- [#24082](https://github.com/LedgerHQ/ledger-live/pull/24082) [`a9aac86`](https://github.com/LedgerHQ/ledger-live/commit/a9aac86b79c371c0b98bd8f16c966dadb81e07d6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared delegation section of Account Detail (Lumen table on LWD, list with a bottom sheet on LWM) and the family slot that lets a family use it

### Patch Changes

- Updated dependencies [[`c1c388f`](https://github.com/LedgerHQ/ledger-live/commit/c1c388f850e9d045f87acb13b9af8fc71e546b45), [`d185364`](https://github.com/LedgerHQ/ledger-live/commit/d185364617d5f4d2f52d05cc2d137055227dc6d3), [`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`7aeab58`](https://github.com/LedgerHQ/ledger-live/commit/7aeab582f0f6c8d38cf88af0c559dd37d77b9a1c), [`68196b4`](https://github.com/LedgerHQ/ledger-live/commit/68196b4642ad26ccce9b3263e45ee718572acb11), [`f95b426`](https://github.com/LedgerHQ/ledger-live/commit/f95b4268782b5cfd8cb4c14c9b0e5c6384cafa4d), [`e275739`](https://github.com/LedgerHQ/ledger-live/commit/e27573929d3e688afbb6544c58274e025867e6e4), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf)]:
  - @features/flow-account-detail-hero@0.3.0
  - @features/flow-account-detail-settings@0.3.0
  - @shared/feature-flags@0.29.0
  - @features/platform-feature-flags@0.11.0

## 0.3.0-next.0

### Minor Changes

- [#24082](https://github.com/LedgerHQ/ledger-live/pull/24082) [`a9aac86`](https://github.com/LedgerHQ/ledger-live/commit/a9aac86b79c371c0b98bd8f16c966dadb81e07d6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared delegation section of Account Detail (Lumen table on LWD, list with a bottom sheet on LWM) and the family slot that lets a family use it

### Patch Changes

- Updated dependencies [[`c1c388f`](https://github.com/LedgerHQ/ledger-live/commit/c1c388f850e9d045f87acb13b9af8fc71e546b45), [`d185364`](https://github.com/LedgerHQ/ledger-live/commit/d185364617d5f4d2f52d05cc2d137055227dc6d3), [`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`7aeab58`](https://github.com/LedgerHQ/ledger-live/commit/7aeab582f0f6c8d38cf88af0c559dd37d77b9a1c), [`68196b4`](https://github.com/LedgerHQ/ledger-live/commit/68196b4642ad26ccce9b3263e45ee718572acb11), [`f95b426`](https://github.com/LedgerHQ/ledger-live/commit/f95b4268782b5cfd8cb4c14c9b0e5c6384cafa4d), [`e275739`](https://github.com/LedgerHQ/ledger-live/commit/e27573929d3e688afbb6544c58274e025867e6e4), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf)]:
  - @features/flow-account-detail-hero@0.3.0-next.0
  - @features/flow-account-detail-settings@0.3.0-next.0
  - @shared/feature-flags@0.29.0-next.0
  - @features/platform-feature-flags@0.11.0-next.0

## 0.2.0

### Minor Changes

- [#23618](https://github.com/LedgerHQ/ledger-live/pull/23618) [`93b62c3`](https://github.com/LedgerHQ/ledger-live/commit/93b62c317f1aeb5666f74ae91bff9d589c5ac1d5) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the hero: account balance (native + tokens) and quick-action tiles scoped to the account. A funded account gets Transfer · Swap · More (or Buy / Sell tiles when nothing can be swapped) with Buy · Sell · Earn in More; an account without funds gets Transfer and Buy only. Transfer opens the Transfer sheet on the account. Buy and Swap open the asset drawer on the account's network (every supported asset of that network, held or not), then open prefilled with the picked asset; when the network only has its coin, the drawer picks it directly. Swap brings the picked asset into this account (the source is chosen in Swap). Send, Sell and Earn ask which of the account's assets supporting the action to use, including those without balance, ordered by countervalue, and open directly when only one qualifies. `@features/platform-quick-actions` now owns the account asset rules (`listHeldAssets`, `hasAnyFunds`, `resolveAssetsByAction`, `sortAssetsByValue`); on desktop, Earn is shown inactive without funds. Section spacing follows Figma (24px between sections on mobile).

### Patch Changes

- Updated dependencies [[`35233dc`](https://github.com/LedgerHQ/ledger-live/commit/35233dc9e0f3389644536070fc3b9a2624d79826), [`7077a0a`](https://github.com/LedgerHQ/ledger-live/commit/7077a0ac3e17ba9922562ca286232bd7c475a4f4), [`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284), [`fab7c15`](https://github.com/LedgerHQ/ledger-live/commit/fab7c1541531f1f50efbc0c3efec1fbecda63ff9), [`102829a`](https://github.com/LedgerHQ/ledger-live/commit/102829a0c606564a8d36541391fac354ffb5b0cc), [`5b0e4e1`](https://github.com/LedgerHQ/ledger-live/commit/5b0e4e112e84cc236adea3fad7d2dba119286aac), [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2), [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`292b712`](https://github.com/LedgerHQ/ledger-live/commit/292b7129a233b43150c9c452b0efb20629a0bb58), [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`8df0f06`](https://github.com/LedgerHQ/ledger-live/commit/8df0f06428dea5a14e9f81672cdf4ed6042967a2), [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844), [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763), [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766), [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c)]:
  - @features/flow-account-detail-hero@0.2.0
  - @shared/feature-flags@0.28.0
  - @features/flow-account-detail-settings@0.2.0
  - @features/platform-feature-flags@0.10.0

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
