# @ledgerhq/wallet-pnl

## 0.3.0

### Minor Changes

- [#17451](https://github.com/LedgerHQ/ledger-live/pull/17451) [`d15fc5d`](https://github.com/LedgerHQ/ledger-live/commit/d15fc5dcabab2de8e4441568997234bfb31863a4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add an asset-level PnL section to the Asset Detail screen (an Unrealised return card and an Average entry price card, with a Total/Unrealised/Realised breakdown dialog). Backed by a new `computeAssetGroupPnL` aggregator and `useAssetGroupPnL` hook in `@ledgerhq/wallet-pnl`.

### Patch Changes

- Updated dependencies [[`839537d`](https://github.com/LedgerHQ/ledger-live/commit/839537d42f9c2bf87ad0faf64e51966250976055), [`ef47541`](https://github.com/LedgerHQ/ledger-live/commit/ef47541f67995474a82446c416e0825623b5d063), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`822bc92`](https://github.com/LedgerHQ/ledger-live/commit/822bc92945248ddd31304aa7ca90854c849d217f), [`62ec3e5`](https://github.com/LedgerHQ/ledger-live/commit/62ec3e5917ceee80c0384eea6ee0901faa58b08a), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554), [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46), [`5de991c`](https://github.com/LedgerHQ/ledger-live/commit/5de991c8686f473d2323b9c6536c53b7badf5f3d)]:
  - @ledgerhq/cryptoassets@13.49.0
  - @ledgerhq/types-cryptoassets@7.37.0
  - @ledgerhq/types-live@6.109.0
  - @ledgerhq/ledger-wallet-framework@1.6.0
  - @ledgerhq/live-countervalues@0.18.5

## 0.3.0-next.0

### Minor Changes

- [#17451](https://github.com/LedgerHQ/ledger-live/pull/17451) [`d15fc5d`](https://github.com/LedgerHQ/ledger-live/commit/d15fc5dcabab2de8e4441568997234bfb31863a4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add an asset-level PnL section to the Asset Detail screen (an Unrealised return card and an Average entry price card, with a Total/Unrealised/Realised breakdown dialog). Backed by a new `computeAssetGroupPnL` aggregator and `useAssetGroupPnL` hook in `@ledgerhq/wallet-pnl`.

### Patch Changes

- Updated dependencies [[`839537d`](https://github.com/LedgerHQ/ledger-live/commit/839537d42f9c2bf87ad0faf64e51966250976055), [`ef47541`](https://github.com/LedgerHQ/ledger-live/commit/ef47541f67995474a82446c416e0825623b5d063), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`822bc92`](https://github.com/LedgerHQ/ledger-live/commit/822bc92945248ddd31304aa7ca90854c849d217f), [`62ec3e5`](https://github.com/LedgerHQ/ledger-live/commit/62ec3e5917ceee80c0384eea6ee0901faa58b08a), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554), [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46), [`5de991c`](https://github.com/LedgerHQ/ledger-live/commit/5de991c8686f473d2323b9c6536c53b7badf5f3d)]:
  - @ledgerhq/cryptoassets@13.49.0-next.0
  - @ledgerhq/types-cryptoassets@7.37.0-next.0
  - @ledgerhq/types-live@6.109.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.6.0-next.0
  - @ledgerhq/live-countervalues@0.18.5-next.0

## 0.2.0

### Minor Changes

- [#17343](https://github.com/LedgerHQ/ledger-live/pull/17343) [`f753ec7`](https://github.com/LedgerHQ/ledger-live/commit/f753ec7f73a870fc4b9f24d213f399773bc50600) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@ledgerhq/wallet-pnl`: average cost basis PnL (per-asset and portfolio), operation classification, countervalue-backed cost basis cache.

- [#17384](https://github.com/LedgerHQ/ledger-live/pull/17384) [`fb2b211`](https://github.com/LedgerHQ/ledger-live/commit/fb2b21133ad208d79c5088fc1f6d1b015f874178) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Expose scenario builders via the new `@ledgerhq/wallet-pnl/scenarios` subpath (Hodler, Staker, Trader, SingleTrade, MultiAsset)

### Patch Changes

- Updated dependencies [[`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`3b746ee`](https://github.com/LedgerHQ/ledger-live/commit/3b746eea7f3f2be633947e8e9112987457c864a5), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`912e673`](https://github.com/LedgerHQ/ledger-live/commit/912e673368baa0342316c882653768d570b71262), [`6e832a0`](https://github.com/LedgerHQ/ledger-live/commit/6e832a044bd7abb704f0a45ea782e55c1b25487c), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b)]:
  - @ledgerhq/types-live@6.108.0
  - @ledgerhq/ledger-wallet-framework@1.5.0
  - @ledgerhq/cryptoassets@13.48.0
  - @ledgerhq/live-countervalues@0.18.4

## 0.2.0-next.0

### Minor Changes

- [#17343](https://github.com/LedgerHQ/ledger-live/pull/17343) [`f753ec7`](https://github.com/LedgerHQ/ledger-live/commit/f753ec7f73a870fc4b9f24d213f399773bc50600) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@ledgerhq/wallet-pnl`: average cost basis PnL (per-asset and portfolio), operation classification, countervalue-backed cost basis cache.

- [#17384](https://github.com/LedgerHQ/ledger-live/pull/17384) [`fb2b211`](https://github.com/LedgerHQ/ledger-live/commit/fb2b21133ad208d79c5088fc1f6d1b015f874178) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Expose scenario builders via the new `@ledgerhq/wallet-pnl/scenarios` subpath (Hodler, Staker, Trader, SingleTrade, MultiAsset)

### Patch Changes

- Updated dependencies [[`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`3b746ee`](https://github.com/LedgerHQ/ledger-live/commit/3b746eea7f3f2be633947e8e9112987457c864a5), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`912e673`](https://github.com/LedgerHQ/ledger-live/commit/912e673368baa0342316c882653768d570b71262), [`6e832a0`](https://github.com/LedgerHQ/ledger-live/commit/6e832a044bd7abb704f0a45ea782e55c1b25487c), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b)]:
  - @ledgerhq/types-live@6.108.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.5.0-next.0
  - @ledgerhq/cryptoassets@13.48.0-next.0
  - @ledgerhq/live-countervalues@0.18.4-next.0
