# @ledgerhq/live-signer-celo

## 1.1.1

### Patch Changes

- Updated dependencies [[`7bb9c64`](https://github.com/LedgerHQ/ledger-live/commit/7bb9c6403895707a4e27237ff57c770d11ec5831)]:
  - @ledgerhq/coin-celo@2.4.0
  - @ledgerhq/hw-app-eth@7.8.4
  - @ledgerhq/hw-app-celo@7.1.1

## 1.1.1-next.0

### Patch Changes

- Updated dependencies [[`7bb9c64`](https://github.com/LedgerHQ/ledger-live/commit/7bb9c6403895707a4e27237ff57c770d11ec5831)]:
  - @ledgerhq/coin-celo@2.4.0-next.0
  - @ledgerhq/hw-app-eth@7.8.4-next.0
  - @ledgerhq/hw-app-celo@7.1.1-next.0

## 1.1.0

### Minor Changes

- [#16914](https://github.com/LedgerHQ/ledger-live/pull/16914) [`0b001f0`](https://github.com/LedgerHQ/ledger-live/commit/0b001f01a039fe4f11c508d69457350a1e3f23fd) Thanks [@pvoliveira](https://github.com/pvoliveira)! - Remove all `@celo/*` runtime dependencies (except `@celo/abis`) and replace with `viem` SDK; source contract ABIs (Registry, Accounts, Election, LockedGold, IERC20) from the official `@celo/abis` package instead of a local hand-written copy; drop `rlpEncodedTxForLedger` from the Celo signer interface in favour of viem/celo CIP-64 transaction serialization

### Patch Changes

- Updated dependencies [[`0b001f0`](https://github.com/LedgerHQ/ledger-live/commit/0b001f01a039fe4f11c508d69457350a1e3f23fd)]:
  - @ledgerhq/coin-celo@2.3.0
  - @ledgerhq/hw-app-celo@7.1.0
  - @ledgerhq/hw-app-eth@7.8.3

## 1.1.0-next.0

### Minor Changes

- [#16914](https://github.com/LedgerHQ/ledger-live/pull/16914) [`0b001f0`](https://github.com/LedgerHQ/ledger-live/commit/0b001f01a039fe4f11c508d69457350a1e3f23fd) Thanks [@pvoliveira](https://github.com/pvoliveira)! - Remove all `@celo/*` runtime dependencies (except `@celo/abis`) and replace with `viem` SDK; source contract ABIs (Registry, Accounts, Election, LockedGold, IERC20) from the official `@celo/abis` package instead of a local hand-written copy; drop `rlpEncodedTxForLedger` from the Celo signer interface in favour of viem/celo CIP-64 transaction serialization

### Patch Changes

- Updated dependencies [[`0b001f0`](https://github.com/LedgerHQ/ledger-live/commit/0b001f01a039fe4f11c508d69457350a1e3f23fd)]:
  - @ledgerhq/coin-celo@2.3.0-next.0
  - @ledgerhq/hw-app-celo@7.1.0-next.0
  - @ledgerhq/hw-app-eth@7.8.3-next.0

## 1.0.2

### Patch Changes

- Updated dependencies [[`f7df0c0`](https://github.com/LedgerHQ/ledger-live/commit/f7df0c0b946d5ad010ea8c5d17f6af65de57608f)]:
  - @ledgerhq/coin-celo@2.2.0
  - @ledgerhq/hw-app-eth@7.8.2
  - @ledgerhq/hw-app-celo@7.0.2
  - @ledgerhq/hw-transport@6.35.2

## 1.0.2-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-celo@2.2.0-next.1

## 1.0.2-next.0

### Patch Changes

- Updated dependencies [[`f7df0c0`](https://github.com/LedgerHQ/ledger-live/commit/f7df0c0b946d5ad010ea8c5d17f6af65de57608f)]:
  - @ledgerhq/coin-celo@2.2.0-next.0
  - @ledgerhq/hw-app-eth@7.8.2-next.0
  - @ledgerhq/hw-app-celo@7.0.2-next.0
  - @ledgerhq/hw-transport@6.35.2-next.0

## 1.0.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-celo@2.1.1
  - @ledgerhq/hw-app-celo@7.0.2
  - @ledgerhq/hw-app-eth@7.8.2
  - @ledgerhq/hw-transport@6.35.2

## 1.0.2-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-celo@2.1.1-hotfix.0
  - @ledgerhq/hw-app-celo@7.0.2-hotfix.0
  - @ledgerhq/hw-app-eth@7.8.2-hotfix.0
  - @ledgerhq/hw-transport@6.35.2-hotfix.0

## 1.0.1

### Patch Changes

- Updated dependencies [[`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee), [`c6a5082`](https://github.com/LedgerHQ/ledger-live/commit/c6a50820f81f5d74101039720c96a8e221819513)]:
  - @ledgerhq/coin-celo@2.1.0
  - @ledgerhq/hw-app-eth@7.8.1
  - @ledgerhq/hw-app-celo@7.0.1

## 1.0.1-next.0

### Patch Changes

- Updated dependencies [[`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee), [`c6a5082`](https://github.com/LedgerHQ/ledger-live/commit/c6a50820f81f5d74101039720c96a8e221819513)]:
  - @ledgerhq/coin-celo@2.1.0-next.0
  - @ledgerhq/hw-app-eth@7.8.1-next.0
  - @ledgerhq/hw-app-celo@7.0.1-next.0

## 1.0.0

### Major Changes

- [#15635](https://github.com/LedgerHQ/ledger-live/pull/15635) [`946be6e`](https://github.com/LedgerHQ/ledger-live/commit/946be6e0111c79e77eb486619b4ad645523b1966) Thanks [@UmbrellaHoodies](https://github.com/UmbrellaHoodies)! - update hw-celo-app and hw-eth-app to support new fee currency field and CIP64 transaction. Move to live-signer-celo

### Patch Changes

- Updated dependencies [[`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8), [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58), [`946be6e`](https://github.com/LedgerHQ/ledger-live/commit/946be6e0111c79e77eb486619b4ad645523b1966), [`c0ed9b9`](https://github.com/LedgerHQ/ledger-live/commit/c0ed9b9c8fa1fdb6d0cecb7b0a5da2710789a8c2), [`3d16706`](https://github.com/LedgerHQ/ledger-live/commit/3d1670660a803f17f4949f7d0c1c7a701106653a), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21)]:
  - @ledgerhq/coin-celo@2.0.0
  - @ledgerhq/hw-app-celo@7.0.0
  - @ledgerhq/hw-app-eth@7.8.0
  - @ledgerhq/hw-transport@6.35.1

## 1.0.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-celo@2.0.0-next.1

## 1.0.0-next.0

### Major Changes

- [#15635](https://github.com/LedgerHQ/ledger-live/pull/15635) [`946be6e`](https://github.com/LedgerHQ/ledger-live/commit/946be6e0111c79e77eb486619b4ad645523b1966) Thanks [@UmbrellaHoodies](https://github.com/UmbrellaHoodies)! - update hw-celo-app and hw-eth-app to support new fee currency field and CIP64 transaction. Move to live-signer-celo

### Patch Changes

- Updated dependencies [[`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8), [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58), [`946be6e`](https://github.com/LedgerHQ/ledger-live/commit/946be6e0111c79e77eb486619b4ad645523b1966), [`c0ed9b9`](https://github.com/LedgerHQ/ledger-live/commit/c0ed9b9c8fa1fdb6d0cecb7b0a5da2710789a8c2), [`3d16706`](https://github.com/LedgerHQ/ledger-live/commit/3d1670660a803f17f4949f7d0c1c7a701106653a), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21)]:
  - @ledgerhq/coin-celo@2.0.0-next.0
  - @ledgerhq/hw-app-celo@7.0.0-next.0
  - @ledgerhq/hw-app-eth@7.8.0-next.0
  - @ledgerhq/hw-transport@6.35.1-next.0
