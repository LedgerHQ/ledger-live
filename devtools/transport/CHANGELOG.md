# @devtools/transport

## 0.3.0-next.0

### Minor Changes

- [#20066](https://github.com/LedgerHQ/ledger-live/pull/20066) [`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add @devtools/transport-panel package with TransportPanel, TransportPanelContent, TransportDebug, HistoryLine and TransportStateIndicator components. Expose sidebarFooter slot in @devtools/shell sidebar. Add origin field to TransportState. Wire transport panel in web-tools dev-tools page.

## 0.2.0

### Minor Changes

- [#19320](https://github.com/LedgerHQ/ledger-live/pull/19320) [`ad64829`](https://github.com/LedgerHQ/ledger-live/commit/ad6482932dc6fcced313791a9b9ce5d1cb8cf42b) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add WebSocket devtools libraries for web-tools ⇄ Ledger app interaction.

  `transport` provides an isomorphic WebSocket factory with reactive connection
  state, a handshake protocol, and a `TransportProtocol` interface for custom
  behaviour. `protocols` builds on it with a `copyStore` protocol that replicates
  Redux store state across the wire.

## 0.2.0-next.0

### Minor Changes

- [#19320](https://github.com/LedgerHQ/ledger-live/pull/19320) [`ad64829`](https://github.com/LedgerHQ/ledger-live/commit/ad6482932dc6fcced313791a9b9ce5d1cb8cf42b) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add WebSocket devtools libraries for web-tools ⇄ Ledger app interaction.

  `transport` provides an isomorphic WebSocket factory with reactive connection
  state, a handshake protocol, and a `TransportProtocol` interface for custom
  behaviour. `protocols` builds on it with a `copyStore` protocol that replicates
  Redux store state across the wire.
