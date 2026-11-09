# @devtools/shell

## 0.14.0-next.0

### Minor Changes

- [#24320](https://github.com/LedgerHQ/ledger-live/pull/24320) [`d02425e`](https://github.com/LedgerHQ/ledger-live/commit/d02425e29efe55595b51556e598fde0f9c34574f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Align the native devtools with Lumen and the desktop: tiles for the categories, kind and owner tags, one icon per tool, Lumen inputs, one horizontal gutter

### Patch Changes

- Updated dependencies [[`be81b1c`](https://github.com/LedgerHQ/ledger-live/commit/be81b1c79213926d7963e730fc8ccf4323e58db4), [`4db45b9`](https://github.com/LedgerHQ/ledger-live/commit/4db45b933feabde39ce1bc98796e118eae10f47d)]:
  - @devtools/registry@0.8.0-next.0

## 0.13.0

### Minor Changes

- [#23985](https://github.com/LedgerHQ/ledger-live/pull/23985) [`97be95e`](https://github.com/LedgerHQ/ledger-live/commit/97be95ecba1a1989b8d5ccfc5c4bdf96cc60e767) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Name every devtool by its technical id, tag each with the kind of package it inspects (entity, api, feature, shared or lib), and give account-balance to Wallet XP

- [#23787](https://github.com/LedgerHQ/ledger-live/pull/23787) [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a `mock-accounts` devtool: `mock:2:…` descriptors served by a lazy-loaded MockSource, with their balances and paginated operations

### Patch Changes

- Updated dependencies [[`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51), [`566902e`](https://github.com/LedgerHQ/ledger-live/commit/566902e2101f69e0216ced4fe000daba775ff6bb), [`97be95e`](https://github.com/LedgerHQ/ledger-live/commit/97be95ecba1a1989b8d5ccfc5c4bdf96cc60e767), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820), [`5a6a32d`](https://github.com/LedgerHQ/ledger-live/commit/5a6a32df1c7d16cd6f3e4797002224f352cb2ba9)]:
  - @devtools/registry@0.7.0

## 0.13.0-next.0

### Minor Changes

- [#23985](https://github.com/LedgerHQ/ledger-live/pull/23985) [`97be95e`](https://github.com/LedgerHQ/ledger-live/commit/97be95ecba1a1989b8d5ccfc5c4bdf96cc60e767) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Name every devtool by its technical id, tag each with the kind of package it inspects (entity, api, feature, shared or lib), and give account-balance to Wallet XP

- [#23787](https://github.com/LedgerHQ/ledger-live/pull/23787) [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a `mock-accounts` devtool: `mock:2:…` descriptors served by a lazy-loaded MockSource, with their balances and paginated operations

### Patch Changes

- Updated dependencies [[`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51), [`566902e`](https://github.com/LedgerHQ/ledger-live/commit/566902e2101f69e0216ced4fe000daba775ff6bb), [`97be95e`](https://github.com/LedgerHQ/ledger-live/commit/97be95ecba1a1989b8d5ccfc5c4bdf96cc60e767), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820), [`5a6a32d`](https://github.com/LedgerHQ/ledger-live/commit/5a6a32df1c7d16cd6f3e4797002224f352cb2ba9)]:
  - @devtools/registry@0.7.0-next.0

## 0.12.0

### Minor Changes

- [#23888](https://github.com/LedgerHQ/ledger-live/pull/23888) [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065) Thanks [@zel-kass](https://github.com/zel-kass)! - Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.

- [#23589](https://github.com/LedgerHQ/ledger-live/pull/23589) [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add an Accounts section to DevTools with Account data, Descriptors and Balance pages

- [#23875](https://github.com/LedgerHQ/ledger-live/pull/23875) [`f717fa9`](https://github.com/LedgerHQ/ledger-live/commit/f717fa924ea60f0e650b01cceb555be46bca510b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Align @tanstack/react-table catalog on 8.21.3 to drop the duplicate 8.5.11 install

### Patch Changes

- Updated dependencies [[`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18), [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c), [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a), [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94)]:
  - @devtools/registry@0.6.0

## 0.12.0-next.0

### Minor Changes

- [#23888](https://github.com/LedgerHQ/ledger-live/pull/23888) [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065) Thanks [@zel-kass](https://github.com/zel-kass)! - Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.

- [#23589](https://github.com/LedgerHQ/ledger-live/pull/23589) [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add an Accounts section to DevTools with Account data, Descriptors and Balance pages

- [#23875](https://github.com/LedgerHQ/ledger-live/pull/23875) [`f717fa9`](https://github.com/LedgerHQ/ledger-live/commit/f717fa924ea60f0e650b01cceb555be46bca510b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Align @tanstack/react-table catalog on 8.21.3 to drop the duplicate 8.5.11 install

### Patch Changes

- Updated dependencies [[`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18), [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c), [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a), [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94)]:
  - @devtools/registry@0.6.0-next.0

## 0.11.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.5.3

## 0.11.0-next.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.5.3-next.0

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.5.2

## 0.10.2-next.0

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.5.2-next.0

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.5.1

## 0.10.1-next.1

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.5.1-next.1

## 0.10.1-next.0

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.5.1-next.0

## 0.10.0

### Minor Changes

- [#22306](https://github.com/LedgerHQ/ledger-live/pull/22306) [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Restore translucent status backgrounds with the Lumen `-transparent` tokens after status colors became solid.

- [#22145](https://github.com/LedgerHQ/ledger-live/pull/22145) [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847) Thanks [@ysitbon](https://github.com/ysitbon)! - Put every devtools package under knip and remove the dead code it found

  Dual-platform packages run knip once per platform through `createDualPlatformKnipConfig`, so a
  suffix-less `./Tool` specifier resolves to the right twin instead of orphaning both. Removed: the
  unreachable `Expand` component, the `metadata` and web-only `hooks` barrels, and the named exports
  that duplicated a default export. `@devtools/protocols` now enumerates its two subpath exports
  instead of a `./*` wildcard.

### Patch Changes

- Updated dependencies [[`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847), [`01473d6`](https://github.com/LedgerHQ/ledger-live/commit/01473d6dff53295312cef15863aff5abbf6ccf09)]:
  - @devtools/registry@0.5.0

## 0.10.0-next.0

### Minor Changes

- [#22306](https://github.com/LedgerHQ/ledger-live/pull/22306) [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Restore translucent status backgrounds with the Lumen `-transparent` tokens after status colors became solid.

- [#22145](https://github.com/LedgerHQ/ledger-live/pull/22145) [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847) Thanks [@ysitbon](https://github.com/ysitbon)! - Put every devtools package under knip and remove the dead code it found

  Dual-platform packages run knip once per platform through `createDualPlatformKnipConfig`, so a
  suffix-less `./Tool` specifier resolves to the right twin instead of orphaning both. Removed: the
  unreachable `Expand` component, the `metadata` and web-only `hooks` barrels, and the named exports
  that duplicated a default export. `@devtools/protocols` now enumerates its two subpath exports
  instead of a `./*` wildcard.

### Patch Changes

- Updated dependencies [[`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847), [`01473d6`](https://github.com/LedgerHQ/ledger-live/commit/01473d6dff53295312cef15863aff5abbf6ccf09)]:
  - @devtools/registry@0.5.0-next.0

## 0.9.3

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.4.3

## 0.9.3-next.0

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.4.3-next.0

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.4.2

## 0.9.2-next.1

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.4.2-next.1

## 0.9.2-next.0

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.4.2-next.0

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.4.1

## 0.9.1-next.0

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.4.1-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
