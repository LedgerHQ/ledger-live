# @ledgerhq/wallet-pnl

## 0.6.0

### Minor Changes

- [#18490](https://github.com/LedgerHQ/ledger-live/pull/18490) [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d) Thanks [@ysitbon](https://github.com/ysitbon)! - Replace the embedded `TokenCurrency.parentCurrency: CryptoCurrency` object with a `parentCurrencyId: string` foreign key.

  `TokenCurrency` no longer carries the full parent `CryptoCurrency` object. Resolve the parent on demand with `getCryptoCurrencyById(token.parentCurrencyId)` (or `findCryptoCurrencyById` when a missing parent must be tolerated). The CAL token converter and persistence layer now read/write `parentCurrencyId` directly, aligning the legacy type with the `@domain/entity-currency-token` schema.

### Patch Changes

- Updated dependencies [[`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7), [`b9a2a9e`](https://github.com/LedgerHQ/ledger-live/commit/b9a2a9e5b85f9fb5556ef2de83bd0418e5326e89), [`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7), [`da1c0c8`](https://github.com/LedgerHQ/ledger-live/commit/da1c0c87b3d2540eff9e51c665df8192b4486855), [`031097a`](https://github.com/LedgerHQ/ledger-live/commit/031097ac469c39e4ab475b92d9f6960ebb9a1ad3), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9), [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166), [`37ddb59`](https://github.com/LedgerHQ/ledger-live/commit/37ddb59233c0eb06c18a0b1006052b708c847f9c), [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/types-live@6.112.0
  - @ledgerhq/cryptoassets@13.52.0
  - @ledgerhq/types-cryptoassets@7.38.0
  - @ledgerhq/ledger-wallet-framework@2.2.0
  - @ledgerhq/live-countervalues@0.20.0

## 0.6.0-next.1

### Patch Changes

- Updated dependencies [[`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9)]:
  - @ledgerhq/cryptoassets@13.52.0-next.1
  - @ledgerhq/types-live@6.112.0-next.1
  - @ledgerhq/ledger-wallet-framework@2.2.0-next.1
  - @ledgerhq/live-countervalues@0.20.0-next.1

## 0.6.0-next.0

### Minor Changes

- [#18490](https://github.com/LedgerHQ/ledger-live/pull/18490) [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d) Thanks [@ysitbon](https://github.com/ysitbon)! - Replace the embedded `TokenCurrency.parentCurrency: CryptoCurrency` object with a `parentCurrencyId: string` foreign key.

  `TokenCurrency` no longer carries the full parent `CryptoCurrency` object. Resolve the parent on demand with `getCryptoCurrencyById(token.parentCurrencyId)` (or `findCryptoCurrencyById` when a missing parent must be tolerated). The CAL token converter and persistence layer now read/write `parentCurrencyId` directly, aligning the legacy type with the `@domain/entity-currency-token` schema.

### Patch Changes

- Updated dependencies [[`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7), [`b9a2a9e`](https://github.com/LedgerHQ/ledger-live/commit/b9a2a9e5b85f9fb5556ef2de83bd0418e5326e89), [`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7), [`da1c0c8`](https://github.com/LedgerHQ/ledger-live/commit/da1c0c87b3d2540eff9e51c665df8192b4486855), [`031097a`](https://github.com/LedgerHQ/ledger-live/commit/031097ac469c39e4ab475b92d9f6960ebb9a1ad3), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166), [`37ddb59`](https://github.com/LedgerHQ/ledger-live/commit/37ddb59233c0eb06c18a0b1006052b708c847f9c), [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/types-live@6.112.0-next.0
  - @ledgerhq/cryptoassets@13.52.0-next.0
  - @ledgerhq/types-cryptoassets@7.38.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.2.0-next.0
  - @ledgerhq/live-countervalues@0.20.0-next.0

## 0.5.0

### Minor Changes

- [#17941](https://github.com/LedgerHQ/ledger-live/pull/17941) [`4695b68`](https://github.com/LedgerHQ/ledger-live/commit/4695b6852f75b8a1ac6c6330b583d3a728337db7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Guard PnL reducers against non-finite counter values (NaN/Infinity). `typeof === "number"` previously let `Infinity` through, which `new BigNumber()` coerces to an internal NaN and poisons every downstream arithmetic op. Replaces the check with `Number.isFinite` at the three call sites (latest CV in `assetPnL`, historical op-date CV in `costBasis`, and the reconciliation delta CV).

### Patch Changes

- Updated dependencies [[`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339), [`9901502`](https://github.com/LedgerHQ/ledger-live/commit/990150200e70bc3ea55c5cfc41e1c77f24cc315b), [`0ebf28c`](https://github.com/LedgerHQ/ledger-live/commit/0ebf28cac81f6f25f356d54c891fab62f328e411), [`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649), [`2437b0d`](https://github.com/LedgerHQ/ledger-live/commit/2437b0d319034b241e207e170a39f343bc26cab1), [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33), [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b), [`d19f9de`](https://github.com/LedgerHQ/ledger-live/commit/d19f9debb00e15edbaa7d2cedfcb0d2b5ced4f80), [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78), [`cc4dd4d`](https://github.com/LedgerHQ/ledger-live/commit/cc4dd4db5e312da55966a6f0a8daa90e75e4dd94), [`bbc72fe`](https://github.com/LedgerHQ/ledger-live/commit/bbc72fe2ad0cee010349ab3b2e5a1e369dd9e840), [`8c9596d`](https://github.com/LedgerHQ/ledger-live/commit/8c9596de8eeec00f8d660a42448c6eb65c3aa9b2), [`5842a85`](https://github.com/LedgerHQ/ledger-live/commit/5842a85907c7418a393b0dffee756bff52370024)]:
  - @ledgerhq/types-live@6.111.0
  - @ledgerhq/cryptoassets@13.51.0
  - @ledgerhq/ledger-wallet-framework@2.1.0
  - @ledgerhq/live-countervalues@0.19.0

## 0.5.0-next.0

### Minor Changes

- [#17941](https://github.com/LedgerHQ/ledger-live/pull/17941) [`4695b68`](https://github.com/LedgerHQ/ledger-live/commit/4695b6852f75b8a1ac6c6330b583d3a728337db7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Guard PnL reducers against non-finite counter values (NaN/Infinity). `typeof === "number"` previously let `Infinity` through, which `new BigNumber()` coerces to an internal NaN and poisons every downstream arithmetic op. Replaces the check with `Number.isFinite` at the three call sites (latest CV in `assetPnL`, historical op-date CV in `costBasis`, and the reconciliation delta CV).

### Patch Changes

- Updated dependencies [[`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339), [`9901502`](https://github.com/LedgerHQ/ledger-live/commit/990150200e70bc3ea55c5cfc41e1c77f24cc315b), [`0ebf28c`](https://github.com/LedgerHQ/ledger-live/commit/0ebf28cac81f6f25f356d54c891fab62f328e411), [`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649), [`2437b0d`](https://github.com/LedgerHQ/ledger-live/commit/2437b0d319034b241e207e170a39f343bc26cab1), [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33), [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b), [`d19f9de`](https://github.com/LedgerHQ/ledger-live/commit/d19f9debb00e15edbaa7d2cedfcb0d2b5ced4f80), [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78), [`cc4dd4d`](https://github.com/LedgerHQ/ledger-live/commit/cc4dd4db5e312da55966a6f0a8daa90e75e4dd94), [`bbc72fe`](https://github.com/LedgerHQ/ledger-live/commit/bbc72fe2ad0cee010349ab3b2e5a1e369dd9e840), [`8c9596d`](https://github.com/LedgerHQ/ledger-live/commit/8c9596de8eeec00f8d660a42448c6eb65c3aa9b2), [`5842a85`](https://github.com/LedgerHQ/ledger-live/commit/5842a85907c7418a393b0dffee756bff52370024)]:
  - @ledgerhq/types-live@6.111.0-next.0
  - @ledgerhq/cryptoassets@13.51.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.1.0-next.0
  - @ledgerhq/live-countervalues@0.19.0-next.0

## 0.4.0

### Minor Changes

- [#17909](https://github.com/LedgerHQ/ledger-live/pull/17909) [`93f9bc7`](https://github.com/LedgerHQ/ledger-live/commit/93f9bc770e28977ce1d6b4b920b565d43b645518) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add PnL section to the mobile Asset Detail screen (Unrealised return + Average entry price cards, opens a detail drawer). Extracts a shared `usePnlViewModelBase` + builders under `mvvm/features/Pnl` so the Analytics (portfolio) and Asset Detail (asset) consumers share the same logic, and exposes `trendFromSign` / `PnlTrend` from `@ledgerhq/wallet-pnl` so mobile and desktop derive trends from the same primitive.

### Patch Changes

- Updated dependencies [[`812538e`](https://github.com/LedgerHQ/ledger-live/commit/812538e1788cf63aa3166d3842f0b27248400690), [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c), [`44fd893`](https://github.com/LedgerHQ/ledger-live/commit/44fd8931435a52232cfd5abed3fec7a5b275a9be), [`5e2b764`](https://github.com/LedgerHQ/ledger-live/commit/5e2b76429c0b3024782dc179875a24c5f2655274)]:
  - @ledgerhq/types-live@6.110.0
  - @ledgerhq/cryptoassets@13.50.0
  - @ledgerhq/ledger-wallet-framework@2.0.0
  - @ledgerhq/live-countervalues@0.18.6

## 0.4.0-next.0

### Minor Changes

- [#17909](https://github.com/LedgerHQ/ledger-live/pull/17909) [`93f9bc7`](https://github.com/LedgerHQ/ledger-live/commit/93f9bc770e28977ce1d6b4b920b565d43b645518) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add PnL section to the mobile Asset Detail screen (Unrealised return + Average entry price cards, opens a detail drawer). Extracts a shared `usePnlViewModelBase` + builders under `mvvm/features/Pnl` so the Analytics (portfolio) and Asset Detail (asset) consumers share the same logic, and exposes `trendFromSign` / `PnlTrend` from `@ledgerhq/wallet-pnl` so mobile and desktop derive trends from the same primitive.

### Patch Changes

- Updated dependencies [[`812538e`](https://github.com/LedgerHQ/ledger-live/commit/812538e1788cf63aa3166d3842f0b27248400690), [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c), [`44fd893`](https://github.com/LedgerHQ/ledger-live/commit/44fd8931435a52232cfd5abed3fec7a5b275a9be), [`5e2b764`](https://github.com/LedgerHQ/ledger-live/commit/5e2b76429c0b3024782dc179875a24c5f2655274)]:
  - @ledgerhq/types-live@6.110.0-next.0
  - @ledgerhq/cryptoassets@13.50.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.0.0-next.0
  - @ledgerhq/live-countervalues@0.18.6-next.0

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
