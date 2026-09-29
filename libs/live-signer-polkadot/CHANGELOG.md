# @ledgerhq/live-signer-polkadot

## 0.1.0-next.0

### Minor Changes

- [#22361](https://github.com/LedgerHQ/ledger-live/pull/22361) [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Add the DMK-backed Polkadot signer wrapper behind the `ldmkPolkadotSigner` feature flag

  `@ledgerhq/live-signer-polkadot` exports a DMK-backed and a legacy `hw-app-polkadot`-backed
  implementation of `PolkadotSigner`. The polkadot family's signer factory now returns the DMK
  implementation when the transport carries a DMK session and the `ldmkPolkadotSigner` flag is
  enabled, and falls back to the legacy implementation otherwise — with the flag off, every
  polkadot-family currency (polkadot, assethub_polkadot, westend, assethub_westend, bittensor)
  keeps its current behaviour unchanged.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-polkadot@7.3.1-next.0
