# @devtools/shell

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

## 0.9.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

### Patch Changes

- Updated dependencies [[`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4), [`132ae4a`](https://github.com/LedgerHQ/ledger-live/commit/132ae4a0776bc04797e0344d7123cef0d1124bb4)]:
  - @devtools/registry@0.4.0

## 0.9.0-next.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

### Patch Changes

- Updated dependencies [[`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4), [`132ae4a`](https://github.com/LedgerHQ/ledger-live/commit/132ae4a0776bc04797e0344d7123cef0d1124bb4)]:
  - @devtools/registry@0.4.0-next.0

## 0.8.1

### Patch Changes

- Updated dependencies [[`dd0e578`](https://github.com/LedgerHQ/ledger-live/commit/dd0e578b82b8fc94fa8690cd8111f5826254b197)]:
  - @devtools/registry@0.3.0

## 0.8.1-next.1

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.3.0-next.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
