# @devtools/relay

## 0.3.0-next.0

### Minor Changes

- [#20444](https://github.com/LedgerHQ/ledger-live/pull/20444) [`604c710`](https://github.com/LedgerHQ/ledger-live/commit/604c710658e80568e8ad10e588c84c23f954a142) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add uid-based device selection to relay: hosts receive a monotonic uid on connect, tools target a specific host instance via uid instead of host id

- [#20526](https://github.com/LedgerHQ/ledger-live/pull/20526) [`a55a756`](https://github.com/LedgerHQ/ledger-live/commit/a55a75671692de2a1dbb84c8cf5aac5df7b9f009) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Multiple tool clients can now connect to the same host session simultaneously. Messages are broadcast to all connected peers instead of being delivered to a single counterpart.

- [#20374](https://github.com/LedgerHQ/ledger-live/pull/20374) [`aaa67a7`](https://github.com/LedgerHQ/ledger-live/commit/aaa67a733e16cdfcb3f02b22038b0ae5518fb0ec) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add relay QR-code discovery and mobile QR scanner for one-tap Wi-Fi connection

### Patch Changes

- Updated dependencies [[`604c710`](https://github.com/LedgerHQ/ledger-live/commit/604c710658e80568e8ad10e588c84c23f954a142), [`f4b73a7`](https://github.com/LedgerHQ/ledger-live/commit/f4b73a71d9c44462fb18ec1d939c64a1dd102ec2)]:
  - @devtools/transport@0.4.0-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937)]:
  - @devtools/transport@0.3.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937)]:
  - @devtools/transport@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#19399](https://github.com/LedgerHQ/ledger-live/pull/19399) [`48553da`](https://github.com/LedgerHQ/ledger-live/commit/48553dacfb02c91b347952f84e39471bca954d8f) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add @devtools/relay WebSocket relay server

### Patch Changes

- Updated dependencies [[`ad64829`](https://github.com/LedgerHQ/ledger-live/commit/ad6482932dc6fcced313791a9b9ce5d1cb8cf42b)]:
  - @devtools/transport@0.2.0

## 0.2.0-next.0

### Minor Changes

- [#19399](https://github.com/LedgerHQ/ledger-live/pull/19399) [`48553da`](https://github.com/LedgerHQ/ledger-live/commit/48553dacfb02c91b347952f84e39471bca954d8f) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add @devtools/relay WebSocket relay server

### Patch Changes

- Updated dependencies [[`ad64829`](https://github.com/LedgerHQ/ledger-live/commit/ad6482932dc6fcced313791a9b9ce5d1cb8cf42b)]:
  - @devtools/transport@0.2.0-next.0
