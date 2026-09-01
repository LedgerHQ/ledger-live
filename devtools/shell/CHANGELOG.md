# @devtools/shell

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

## 0.8.1-next.0

### Patch Changes

- Updated dependencies [[`dd0e578`](https://github.com/LedgerHQ/ledger-live/commit/dd0e578b82b8fc94fa8690cd8111f5826254b197)]:
  - @devtools/registry@0.3.0-next.0

## 0.8.0

### Minor Changes

- [#20487](https://github.com/LedgerHQ/ledger-live/pull/20487) [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the duplicated jest wiring (dual web/native presets, React Native mocks, setup files and the themed testing-library render) into the shared `@support/jest-devtools` package. Each package now keeps only a one-line re-export plus its own package-specific fixtures. The feature-flags web tests gained the lumen ThemeProvider they were missing.

### Patch Changes

- Updated dependencies [[`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d)]:
  - @devtools/registry@0.2.0

## 0.8.0-next.0

### Minor Changes

- [#20487](https://github.com/LedgerHQ/ledger-live/pull/20487) [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the duplicated jest wiring (dual web/native presets, React Native mocks, setup files and the themed testing-library render) into the shared `@support/jest-devtools` package. Each package now keeps only a one-line re-export plus its own package-specific fixtures. The feature-flags web tests gained the lumen ThemeProvider they were missing.

### Patch Changes

- Updated dependencies [[`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d)]:
  - @devtools/registry@0.2.0-next.0

## 0.7.0

### Minor Changes

- [#20225](https://github.com/LedgerHQ/ledger-live/pull/20225) [`9051d74`](https://github.com/LedgerHQ/ledger-live/commit/9051d7495e55706e8fb8801107f9473f505cb395) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add native transport panel and expose footer slot on native DevTools shell

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.9

## 0.7.0-next.0

### Minor Changes

- [#20225](https://github.com/LedgerHQ/ledger-live/pull/20225) [`9051d74`](https://github.com/LedgerHQ/ledger-live/commit/9051d7495e55706e8fb8801107f9473f505cb395) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add native transport panel and expose footer slot on native DevTools shell

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.9-next.0

## 0.6.0

### Minor Changes

- [#20066](https://github.com/LedgerHQ/ledger-live/pull/20066) [`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add @devtools/transport-panel package with TransportPanel, TransportPanelContent, TransportDebug, HistoryLine and TransportStateIndicator components. Expose sidebarFooter slot in @devtools/shell sidebar. Add origin field to TransportState. Wire transport panel in web-tools dev-tools page.

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.8

## 0.6.0-next.0

### Minor Changes

- [#20066](https://github.com/LedgerHQ/ledger-live/pull/20066) [`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add @devtools/transport-panel package with TransportPanel, TransportPanelContent, TransportDebug, HistoryLine and TransportStateIndicator components. Expose sidebarFooter slot in @devtools/shell sidebar. Add origin field to TransportState. Wire transport panel in web-tools dev-tools page.

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.8-next.0

## 0.5.2

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.7

## 0.5.2-next.0

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.7-next.0

## 0.5.1

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.6

## 0.5.1-next.0

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.6-next.0

## 0.5.0

### Minor Changes

- [#19205](https://github.com/LedgerHQ/ledger-live/pull/19205) [`3711e2b`](https://github.com/LedgerHQ/ledger-live/commit/3711e2bfdcc0be2cdb7c8d4567242fb14875ab1c) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Prepare shell and components for LWD wiring. Add onClose to shell props and a back arrow in the sidebar. In feature-flags, replace the sidebar with a dialog.

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.5

## 0.5.0-next.0

### Minor Changes

- [#19205](https://github.com/LedgerHQ/ledger-live/pull/19205) [`3711e2b`](https://github.com/LedgerHQ/ledger-live/commit/3711e2bfdcc0be2cdb7c8d4567242fb14875ab1c) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Prepare shell and components for LWD wiring. Add onClose to shell props and a back arrow in the sidebar. In feature-flags, replace the sidebar with a dialog.

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.5-next.0

## 0.4.0

### Minor Changes

- [#18547](https://github.com/LedgerHQ/ledger-live/pull/18547) [`4973a36`](https://github.com/LedgerHQ/ledger-live/commit/4973a3648b64c9110f42dcacfdc559f4e7186885) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add mobile ui for devtools/shell. A screen to choose a tool category, one for tools and one for the tool itself

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.4

## 0.4.0-next.2

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.4-next.2

## 0.4.0-next.1

### Patch Changes

- Updated dependencies []:
  - @devtools/registry@0.1.4-next.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
