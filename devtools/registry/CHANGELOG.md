# @devtools/registry

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`1190ce1`](https://github.com/LedgerHQ/ledger-live/commit/1190ce10656496de8af6aa893b6cafca6c8a36d8)]:
  - @devtools/feature-flags@0.9.0-next.0
  - @devtools/cloud-sync@0.1.1-next.0

## 0.4.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

- [#20733](https://github.com/LedgerHQ/ledger-live/pull/20733) [`132ae4a`](https://github.com/LedgerHQ/ledger-live/commit/132ae4a0776bc04797e0344d7123cef0d1124bb4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Rename metadata folder from `team-platform` to `platform`, remove unused `icon` field from `ToolMetadata` schema, and consolidate the add-tool guide into `README.md`

### Patch Changes

- Updated dependencies [[`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4)]:
  - @devtools/feature-flags@0.8.0
  - @devtools/pay-card@0.4.0

## 0.4.0-next.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

- [#20733](https://github.com/LedgerHQ/ledger-live/pull/20733) [`132ae4a`](https://github.com/LedgerHQ/ledger-live/commit/132ae4a0776bc04797e0344d7123cef0d1124bb4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Rename metadata folder from `team-platform` to `platform`, remove unused `icon` field from `ToolMetadata` schema, and consolidate the add-tool guide into `README.md`

### Patch Changes

- Updated dependencies [[`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4)]:
  - @devtools/feature-flags@0.8.0-next.0
  - @devtools/pay-card@0.4.0-next.0

## 0.3.0

### Minor Changes

- [#20634](https://github.com/LedgerHQ/ledger-live/pull/20634) [`dd0e578`](https://github.com/LedgerHQ/ledger-live/commit/dd0e578b82b8fc94fa8690cd8111f5826254b197) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Extract tool registry map and types into registry.ts; rename metadata/team-platform to metadata/platform

### Patch Changes

- Updated dependencies [[`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd)]:
  - @devtools/pay-card@0.3.0
  - @devtools/feature-flags@0.7.1

## 0.3.0-next.1

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.7.1-next.1

## 0.3.0-next.0

### Minor Changes

- [#20634](https://github.com/LedgerHQ/ledger-live/pull/20634) [`dd0e578`](https://github.com/LedgerHQ/ledger-live/commit/dd0e578b82b8fc94fa8690cd8111f5826254b197) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Extract tool registry map and types into registry.ts; rename metadata/team-platform to metadata/platform

### Patch Changes

- Updated dependencies [[`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd)]:
  - @devtools/pay-card@0.3.0-next.0
  - @devtools/feature-flags@0.7.1-next.0

## 0.2.0

### Minor Changes

- [#20461](https://github.com/LedgerHQ/ledger-live/pull/20461) [`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Card / Pay DevTool foundation package (`@devtools/pay-card`): shared `PayCardToolProps` contract, platform-neutral `usePayCardViewModel`, and registry wiring under the Wallet XP team (LIVE-35496).

### Patch Changes

- Updated dependencies [[`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d), [`1e0edb4`](https://github.com/LedgerHQ/ledger-live/commit/1e0edb42fd2c8c0e6edc4249f4eb3a13162aea2a), [`9c2a85e`](https://github.com/LedgerHQ/ledger-live/commit/9c2a85ef5c1c6a264b53bc3f4581385a250be2ad), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c)]:
  - @devtools/pay-card@0.2.0
  - @devtools/feature-flags@0.7.0

## 0.2.0-next.0

### Minor Changes

- [#20461](https://github.com/LedgerHQ/ledger-live/pull/20461) [`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Card / Pay DevTool foundation package (`@devtools/pay-card`): shared `PayCardToolProps` contract, platform-neutral `usePayCardViewModel`, and registry wiring under the Wallet XP team (LIVE-35496).

### Patch Changes

- Updated dependencies [[`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d), [`1e0edb4`](https://github.com/LedgerHQ/ledger-live/commit/1e0edb42fd2c8c0e6edc4249f4eb3a13162aea2a), [`9c2a85e`](https://github.com/LedgerHQ/ledger-live/commit/9c2a85ef5c1c6a264b53bc3f4581385a250be2ad), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c)]:
  - @devtools/pay-card@0.2.0-next.0
  - @devtools/feature-flags@0.7.0-next.0

## 0.1.9

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.6.4

## 0.1.9-next.0

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.6.4-next.0

## 0.1.8

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.6.3

## 0.1.8-next.0

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.6.3-next.0

## 0.1.7

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.6.2

## 0.1.7-next.0

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.6.2-next.0

## 0.1.6

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.6.1

## 0.1.6-next.0

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.6.1-next.0

## 0.1.5

### Patch Changes

- Updated dependencies [[`f8d5212`](https://github.com/LedgerHQ/ledger-live/commit/f8d5212153829a32fcafc6fded768e5468251413), [`3711e2b`](https://github.com/LedgerHQ/ledger-live/commit/3711e2bfdcc0be2cdb7c8d4567242fb14875ab1c), [`5e081d3`](https://github.com/LedgerHQ/ledger-live/commit/5e081d349639537e0f3eb8536218a55f2f0ee241)]:
  - @devtools/feature-flags@0.6.0

## 0.1.5-next.0

### Patch Changes

- Updated dependencies [[`f8d5212`](https://github.com/LedgerHQ/ledger-live/commit/f8d5212153829a32fcafc6fded768e5468251413), [`3711e2b`](https://github.com/LedgerHQ/ledger-live/commit/3711e2bfdcc0be2cdb7c8d4567242fb14875ab1c), [`5e081d3`](https://github.com/LedgerHQ/ledger-live/commit/5e081d349639537e0f3eb8536218a55f2f0ee241)]:
  - @devtools/feature-flags@0.6.0-next.0

## 0.1.4

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.5.1

## 0.1.4-next.2

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.5.1-next.2

## 0.1.4-next.1

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.5.1-next.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
