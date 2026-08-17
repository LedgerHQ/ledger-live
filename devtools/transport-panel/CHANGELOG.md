# @devtools/transport-panel

## 0.4.0

### Minor Changes

- [#20487](https://github.com/LedgerHQ/ledger-live/pull/20487) [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the duplicated jest wiring (dual web/native presets, React Native mocks, setup files and the themed testing-library render) into the shared `@support/jest-devtools` package. Each package now keeps only a one-line re-export plus its own package-specific fixtures. The feature-flags web tests gained the lumen ThemeProvider they were missing.

- [#20374](https://github.com/LedgerHQ/ledger-live/pull/20374) [`aaa67a7`](https://github.com/LedgerHQ/ledger-live/commit/aaa67a733e16cdfcb3f02b22038b0ae5518fb0ec) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add relay QR-code discovery and mobile QR scanner for one-tap Wi-Fi connection

### Patch Changes

- Updated dependencies [[`604c710`](https://github.com/LedgerHQ/ledger-live/commit/604c710658e80568e8ad10e588c84c23f954a142), [`f4b73a7`](https://github.com/LedgerHQ/ledger-live/commit/f4b73a71d9c44462fb18ec1d939c64a1dd102ec2)]:
  - @devtools/transport@0.4.0

## 0.4.0-next.0

### Minor Changes

- [#20487](https://github.com/LedgerHQ/ledger-live/pull/20487) [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the duplicated jest wiring (dual web/native presets, React Native mocks, setup files and the themed testing-library render) into the shared `@support/jest-devtools` package. Each package now keeps only a one-line re-export plus its own package-specific fixtures. The feature-flags web tests gained the lumen ThemeProvider they were missing.

- [#20374](https://github.com/LedgerHQ/ledger-live/pull/20374) [`aaa67a7`](https://github.com/LedgerHQ/ledger-live/commit/aaa67a733e16cdfcb3f02b22038b0ae5518fb0ec) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add relay QR-code discovery and mobile QR scanner for one-tap Wi-Fi connection

### Patch Changes

- Updated dependencies [[`604c710`](https://github.com/LedgerHQ/ledger-live/commit/604c710658e80568e8ad10e588c84c23f954a142), [`f4b73a7`](https://github.com/LedgerHQ/ledger-live/commit/f4b73a71d9c44462fb18ec1d939c64a1dd102ec2)]:
  - @devtools/transport@0.4.0-next.0

## 0.3.0

### Minor Changes

- [#20225](https://github.com/LedgerHQ/ledger-live/pull/20225) [`9051d74`](https://github.com/LedgerHQ/ledger-live/commit/9051d7495e55706e8fb8801107f9473f505cb395) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add native transport panel and expose footer slot on native DevTools shell

- [#20329](https://github.com/LedgerHQ/ledger-live/pull/20329) [`d35298f`](https://github.com/LedgerHQ/ledger-live/commit/d35298f0158e124f12fbdf811c5fdc795898e2c0) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Guard invalid WebSocket URLs before attempting connection to prevent native crash on mobile

## 0.3.0-next.0

### Minor Changes

- [#20225](https://github.com/LedgerHQ/ledger-live/pull/20225) [`9051d74`](https://github.com/LedgerHQ/ledger-live/commit/9051d7495e55706e8fb8801107f9473f505cb395) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add native transport panel and expose footer slot on native DevTools shell

- [#20329](https://github.com/LedgerHQ/ledger-live/pull/20329) [`d35298f`](https://github.com/LedgerHQ/ledger-live/commit/d35298f0158e124f12fbdf811c5fdc795898e2c0) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Guard invalid WebSocket URLs before attempting connection to prevent native crash on mobile

## 0.2.0

### Minor Changes

- [#20066](https://github.com/LedgerHQ/ledger-live/pull/20066) [`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add @devtools/transport-panel package with TransportPanel, TransportPanelContent, TransportDebug, HistoryLine and TransportStateIndicator components. Expose sidebarFooter slot in @devtools/shell sidebar. Add origin field to TransportState. Wire transport panel in web-tools dev-tools page.

### Patch Changes

- Updated dependencies [[`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937)]:
  - @devtools/transport@0.3.0

## 0.2.0-next.0

### Minor Changes

- [#20066](https://github.com/LedgerHQ/ledger-live/pull/20066) [`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add @devtools/transport-panel package with TransportPanel, TransportPanelContent, TransportDebug, HistoryLine and TransportStateIndicator components. Expose sidebarFooter slot in @devtools/shell sidebar. Add origin field to TransportState. Wire transport panel in web-tools dev-tools page.

### Patch Changes

- Updated dependencies [[`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937)]:
  - @devtools/transport@0.3.0-next.0
