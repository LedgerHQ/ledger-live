# @devtools/protocols

## 0.4.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

### Patch Changes

- Updated dependencies [[`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4)]:
  - @devtools/transport@0.6.0

## 0.4.0-next.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

### Patch Changes

- Updated dependencies [[`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4)]:
  - @devtools/transport@0.6.0-next.0

## 0.3.0

### Minor Changes

- [#20725](https://github.com/LedgerHQ/ledger-live/pull/20725) [`0fc43c1`](https://github.com/LedgerHQ/ledger-live/commit/0fc43c15841f585c0a9aaa5152587225978f7e2b) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add relay-tracked device list and device-name select in transport panel

### Patch Changes

- Updated dependencies [[`0fc43c1`](https://github.com/LedgerHQ/ledger-live/commit/0fc43c15841f585c0a9aaa5152587225978f7e2b)]:
  - @devtools/transport@0.5.0

## 0.3.0-next.0

### Minor Changes

- [#20725](https://github.com/LedgerHQ/ledger-live/pull/20725) [`0fc43c1`](https://github.com/LedgerHQ/ledger-live/commit/0fc43c15841f585c0a9aaa5152587225978f7e2b) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add relay-tracked device list and device-name select in transport panel

### Patch Changes

- Updated dependencies [[`0fc43c1`](https://github.com/LedgerHQ/ledger-live/commit/0fc43c15841f585c0a9aaa5152587225978f7e2b)]:
  - @devtools/transport@0.5.0-next.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`604c710`](https://github.com/LedgerHQ/ledger-live/commit/604c710658e80568e8ad10e588c84c23f954a142), [`f4b73a7`](https://github.com/LedgerHQ/ledger-live/commit/f4b73a71d9c44462fb18ec1d939c64a1dd102ec2)]:
  - @devtools/transport@0.4.0

## 0.2.2-next.0

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

- [#19320](https://github.com/LedgerHQ/ledger-live/pull/19320) [`ad64829`](https://github.com/LedgerHQ/ledger-live/commit/ad6482932dc6fcced313791a9b9ce5d1cb8cf42b) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add WebSocket devtools libraries for web-tools ⇄ Ledger app interaction.

  `transport` provides an isomorphic WebSocket factory with reactive connection
  state, a handshake protocol, and a `TransportProtocol` interface for custom
  behaviour. `protocols` builds on it with a `copyStore` protocol that replicates
  Redux store state across the wire.

### Patch Changes

- Updated dependencies [[`ad64829`](https://github.com/LedgerHQ/ledger-live/commit/ad6482932dc6fcced313791a9b9ce5d1cb8cf42b)]:
  - @devtools/transport@0.2.0

## 0.2.0-next.0

### Minor Changes

- [#19320](https://github.com/LedgerHQ/ledger-live/pull/19320) [`ad64829`](https://github.com/LedgerHQ/ledger-live/commit/ad6482932dc6fcced313791a9b9ce5d1cb8cf42b) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add WebSocket devtools libraries for web-tools ⇄ Ledger app interaction.

  `transport` provides an isomorphic WebSocket factory with reactive connection
  state, a handshake protocol, and a `TransportProtocol` interface for custom
  behaviour. `protocols` builds on it with a `copyStore` protocol that replicates
  Redux store state across the wire.

### Patch Changes

- Updated dependencies [[`ad64829`](https://github.com/LedgerHQ/ledger-live/commit/ad6482932dc6fcced313791a9b9ce5d1cb8cf42b)]:
  - @devtools/transport@0.2.0-next.0
