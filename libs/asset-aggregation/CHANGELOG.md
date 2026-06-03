# @ledgerhq/asset-aggregation

## 0.6.0

### Minor Changes

- [#17561](https://github.com/LedgerHQ/ledger-live/pull/17561) [`5d5a111`](https://github.com/LedgerHQ/ledger-live/commit/5d5a11111173aabd685a409e09c08dcb67ccb95b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Stellar USDC (and MultiversX tokens) not aggregating under their cross-network meta-currency in the portfolio asset distribution. Apply legacyIdToApiId when resolving DADA-keyed lookups so LL-format ids (mixed-case Stellar, multiversx prefix) match the API-format ids returned by DADA.

- [#17503](https://github.com/LedgerHQ/ledger-live/pull/17503) [`f799d7f`](https://github.com/LedgerHQ/ledger-live/commit/f799d7f77de7af9d0a236c782b36cc4b629b41c7) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Aggregate AssetDetail total balance and addresses across every network of an asset on mobile (W4.0), and extract `resolveDistributionItem` / `parentAccountLookup` from desktop into `@ledgerhq/asset-aggregation` so both apps share one source.

### Patch Changes

- Updated dependencies [[`839537d`](https://github.com/LedgerHQ/ledger-live/commit/839537d42f9c2bf87ad0faf64e51966250976055), [`ef47541`](https://github.com/LedgerHQ/ledger-live/commit/ef47541f67995474a82446c416e0825623b5d063), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`62ec3e5`](https://github.com/LedgerHQ/ledger-live/commit/62ec3e5917ceee80c0384eea6ee0901faa58b08a), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554), [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46)]:
  - @ledgerhq/cryptoassets@13.49.0
  - @ledgerhq/types-cryptoassets@7.37.0
  - @ledgerhq/types-live@6.109.0
  - @ledgerhq/live-countervalues@0.18.5

## 0.6.0-next.0

### Minor Changes

- [#17561](https://github.com/LedgerHQ/ledger-live/pull/17561) [`5d5a111`](https://github.com/LedgerHQ/ledger-live/commit/5d5a11111173aabd685a409e09c08dcb67ccb95b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Stellar USDC (and MultiversX tokens) not aggregating under their cross-network meta-currency in the portfolio asset distribution. Apply legacyIdToApiId when resolving DADA-keyed lookups so LL-format ids (mixed-case Stellar, multiversx prefix) match the API-format ids returned by DADA.

- [#17503](https://github.com/LedgerHQ/ledger-live/pull/17503) [`f799d7f`](https://github.com/LedgerHQ/ledger-live/commit/f799d7f77de7af9d0a236c782b36cc4b629b41c7) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Aggregate AssetDetail total balance and addresses across every network of an asset on mobile (W4.0), and extract `resolveDistributionItem` / `parentAccountLookup` from desktop into `@ledgerhq/asset-aggregation` so both apps share one source.

### Patch Changes

- Updated dependencies [[`839537d`](https://github.com/LedgerHQ/ledger-live/commit/839537d42f9c2bf87ad0faf64e51966250976055), [`ef47541`](https://github.com/LedgerHQ/ledger-live/commit/ef47541f67995474a82446c416e0825623b5d063), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`62ec3e5`](https://github.com/LedgerHQ/ledger-live/commit/62ec3e5917ceee80c0384eea6ee0901faa58b08a), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554), [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46)]:
  - @ledgerhq/cryptoassets@13.49.0-next.0
  - @ledgerhq/types-cryptoassets@7.37.0-next.0
  - @ledgerhq/types-live@6.109.0-next.0
  - @ledgerhq/live-countervalues@0.18.5-next.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b)]:
  - @ledgerhq/types-live@6.108.0
  - @ledgerhq/cryptoassets@13.48.0
  - @ledgerhq/live-countervalues@0.18.4

## 0.5.1-next.0

### Patch Changes

- Updated dependencies [[`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b)]:
  - @ledgerhq/types-live@6.108.0-next.0
  - @ledgerhq/cryptoassets@13.48.0-next.0
  - @ledgerhq/live-countervalues@0.18.4-next.0

## 0.5.0

### Minor Changes

- [#16958](https://github.com/LedgerHQ/ledger-live/pull/16958) [`3f74e17`](https://github.com/LedgerHQ/ledger-live/commit/3f74e177076e944847ba6081804d344ee8160391) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Canonicalize EVM meta-currency asset distribution to Ethereum (currency label, market id) when grouped networks omit mainnet from assets data

- [#16758](https://github.com/LedgerHQ/ledger-live/pull/16758) [`51db81b`](https://github.com/LedgerHQ/ledger-live/commit/51db81badcab5d0d0bcd3f0e296eb1964af1ec82) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add computeAggregatedAccountsData to @ledgerhq/asset-aggregation and use it in LWM CryptoAddresses screen to show main accounts with aggregated fiat balance (main + sub-accounts), sorted by countervalue

### Patch Changes

- Updated dependencies [[`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/types-live@6.107.0
  - @ledgerhq/cryptoassets@13.47.0
  - @ledgerhq/live-countervalues@0.18.3

## 0.5.0-next.1

### Patch Changes

- Updated dependencies [[`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9)]:
  - @ledgerhq/cryptoassets@13.47.0-next.1
  - @ledgerhq/live-countervalues@0.18.3-next.1

## 0.5.0-next.0

### Minor Changes

- [#16958](https://github.com/LedgerHQ/ledger-live/pull/16958) [`3f74e17`](https://github.com/LedgerHQ/ledger-live/commit/3f74e177076e944847ba6081804d344ee8160391) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Canonicalize EVM meta-currency asset distribution to Ethereum (currency label, market id) when grouped networks omit mainnet from assets data

- [#16758](https://github.com/LedgerHQ/ledger-live/pull/16758) [`51db81b`](https://github.com/LedgerHQ/ledger-live/commit/51db81badcab5d0d0bcd3f0e296eb1964af1ec82) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add computeAggregatedAccountsData to @ledgerhq/asset-aggregation and use it in LWM CryptoAddresses screen to show main accounts with aggregated fiat balance (main + sub-accounts), sorted by countervalue

### Patch Changes

- Updated dependencies [[`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/types-live@6.107.0-next.0
  - @ledgerhq/cryptoassets@13.47.0-next.0
  - @ledgerhq/live-countervalues@0.18.3-next.0

## 0.4.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-countervalues@0.18.3

## 0.4.2-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-countervalues@0.18.3-hotfix.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95), [`e377079`](https://github.com/LedgerHQ/ledger-live/commit/e3770793670b73d4409bd5be2081ca922e8679ac), [`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee)]:
  - @ledgerhq/types-live@6.106.0
  - @ledgerhq/live-countervalues@0.18.2

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95), [`e377079`](https://github.com/LedgerHQ/ledger-live/commit/e3770793670b73d4409bd5be2081ca922e8679ac), [`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee)]:
  - @ledgerhq/types-live@6.106.0-next.0
  - @ledgerhq/live-countervalues@0.18.2-next.0

## 0.4.0

### Minor Changes

- [#16243](https://github.com/LedgerHQ/ledger-live/pull/16243) [`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add buildAssetDistribution with DADA meta-currency grouping and bySlug lookup

- [#16023](https://github.com/LedgerHQ/ledger-live/pull/16023) [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: remove eslint and prettier, replace with with oxlint and oxfmt

### Patch Changes

- Updated dependencies [[`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01), [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb), [`139cdbf`](https://github.com/LedgerHQ/ledger-live/commit/139cdbfd48120247ff54f5f7863ce866a6a755d0), [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754), [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839), [`46e78cf`](https://github.com/LedgerHQ/ledger-live/commit/46e78cf3a057a9de39a5abbb49fe779655db6507)]:
  - @ledgerhq/types-live@6.105.0
  - @ledgerhq/live-countervalues@0.18.1

## 0.4.0-next.0

### Minor Changes

- [#16243](https://github.com/LedgerHQ/ledger-live/pull/16243) [`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add buildAssetDistribution with DADA meta-currency grouping and bySlug lookup

- [#16023](https://github.com/LedgerHQ/ledger-live/pull/16023) [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: remove eslint and prettier, replace with with oxlint and oxfmt

### Patch Changes

- Updated dependencies [[`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01), [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb), [`139cdbf`](https://github.com/LedgerHQ/ledger-live/commit/139cdbfd48120247ff54f5f7863ce866a6a755d0), [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754), [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839), [`46e78cf`](https://github.com/LedgerHQ/ledger-live/commit/46e78cf3a057a9de39a5abbb49fe779655db6507)]:
  - @ledgerhq/types-live@6.105.0-next.0
  - @ledgerhq/live-countervalues@0.18.1-next.0

## 0.3.4

### Patch Changes

- Updated dependencies [[`24e8f80`](https://github.com/LedgerHQ/ledger-live/commit/24e8f80dc314619f954e6966aff8698591d6e05e), [`ea34195`](https://github.com/LedgerHQ/ledger-live/commit/ea34195c1115aaa40c69259ee2d2ee581e0349ab), [`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8), [`2ece647`](https://github.com/LedgerHQ/ledger-live/commit/2ece647f386e40f261662fc6e4e6624f302ee34f), [`55c01bc`](https://github.com/LedgerHQ/ledger-live/commit/55c01bcd8e43f9a54e93a41bb383d6d5c633b35f), [`fd3a7d3`](https://github.com/LedgerHQ/ledger-live/commit/fd3a7d37d539a28f3623b2e3c7a3c1f9b073b8e6)]:
  - @ledgerhq/types-live@6.104.0
  - @ledgerhq/types-cryptoassets@7.36.0
  - @ledgerhq/live-countervalues@0.18.0

## 0.3.4-next.0

### Patch Changes

- Updated dependencies [[`24e8f80`](https://github.com/LedgerHQ/ledger-live/commit/24e8f80dc314619f954e6966aff8698591d6e05e), [`ea34195`](https://github.com/LedgerHQ/ledger-live/commit/ea34195c1115aaa40c69259ee2d2ee581e0349ab), [`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8), [`2ece647`](https://github.com/LedgerHQ/ledger-live/commit/2ece647f386e40f261662fc6e4e6624f302ee34f), [`55c01bc`](https://github.com/LedgerHQ/ledger-live/commit/55c01bcd8e43f9a54e93a41bb383d6d5c633b35f), [`fd3a7d3`](https://github.com/LedgerHQ/ledger-live/commit/fd3a7d37d539a28f3623b2e3c7a3c1f9b073b8e6)]:
  - @ledgerhq/types-live@6.104.0-next.0
  - @ledgerhq/types-cryptoassets@7.36.0-next.0
  - @ledgerhq/live-countervalues@0.18.0-next.0

## 0.3.3

### Patch Changes

- Updated dependencies [[`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe), [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20), [`f67c5c5`](https://github.com/LedgerHQ/ledger-live/commit/f67c5c555c163739edbfd60b490a14ba8116146f), [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95)]:
  - @ledgerhq/types-live@6.103.0
  - @ledgerhq/live-countervalues@0.17.0

## 0.3.3-next.0

### Patch Changes

- Updated dependencies [[`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe), [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20), [`f67c5c5`](https://github.com/LedgerHQ/ledger-live/commit/f67c5c555c163739edbfd60b490a14ba8116146f), [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95)]:
  - @ledgerhq/types-live@6.103.0-next.0
  - @ledgerhq/live-countervalues@0.17.0-next.0

## 0.3.2

### Patch Changes

- Updated dependencies [[`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41)]:
  - @ledgerhq/live-countervalues@0.16.0
  - @ledgerhq/types-live@6.102.0

## 0.3.2-next.0

### Patch Changes

- Updated dependencies [[`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41)]:
  - @ledgerhq/live-countervalues@0.16.0-next.0
  - @ledgerhq/types-live@6.102.0-next.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`ffb3c46`](https://github.com/LedgerHQ/ledger-live/commit/ffb3c46acd292b9ac0f46a2b84509d02775a5f20), [`7cbfb7d`](https://github.com/LedgerHQ/ledger-live/commit/7cbfb7dd2d52ad8380ab4d37b02f63292699cd68), [`bfa4315`](https://github.com/LedgerHQ/ledger-live/commit/bfa4315d2f3b4b95c5a742ffd6e05272662f4550), [`75dfb86`](https://github.com/LedgerHQ/ledger-live/commit/75dfb86c871a026aa90136d0184637878d484484), [`e6f26e0`](https://github.com/LedgerHQ/ledger-live/commit/e6f26e0f475763aaf3271e2d4ed6cf36fb1f5060), [`9f559e9`](https://github.com/LedgerHQ/ledger-live/commit/9f559e98a1af37073e0e79ee5bb54b4aaecfb8c4), [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8), [`ad66568`](https://github.com/LedgerHQ/ledger-live/commit/ad66568fd9c96cfa08d11123a711e3fa79705f65), [`4cc02f3`](https://github.com/LedgerHQ/ledger-live/commit/4cc02f3c1ba0bdb93917b5427a375ab44cd5d208), [`37bc15e`](https://github.com/LedgerHQ/ledger-live/commit/37bc15e245107ce1044f36b57d191552a77329e6)]:
  - @ledgerhq/types-cryptoassets@7.35.0
  - @ledgerhq/types-live@6.101.0
  - @ledgerhq/live-countervalues@0.15.1

## 0.3.1-next.0

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`ffb3c46`](https://github.com/LedgerHQ/ledger-live/commit/ffb3c46acd292b9ac0f46a2b84509d02775a5f20), [`7cbfb7d`](https://github.com/LedgerHQ/ledger-live/commit/7cbfb7dd2d52ad8380ab4d37b02f63292699cd68), [`bfa4315`](https://github.com/LedgerHQ/ledger-live/commit/bfa4315d2f3b4b95c5a742ffd6e05272662f4550), [`75dfb86`](https://github.com/LedgerHQ/ledger-live/commit/75dfb86c871a026aa90136d0184637878d484484), [`e6f26e0`](https://github.com/LedgerHQ/ledger-live/commit/e6f26e0f475763aaf3271e2d4ed6cf36fb1f5060), [`9f559e9`](https://github.com/LedgerHQ/ledger-live/commit/9f559e98a1af37073e0e79ee5bb54b4aaecfb8c4), [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8), [`ad66568`](https://github.com/LedgerHQ/ledger-live/commit/ad66568fd9c96cfa08d11123a711e3fa79705f65), [`4cc02f3`](https://github.com/LedgerHQ/ledger-live/commit/4cc02f3c1ba0bdb93917b5427a375ab44cd5d208), [`37bc15e`](https://github.com/LedgerHQ/ledger-live/commit/37bc15e245107ce1044f36b57d191552a77329e6)]:
  - @ledgerhq/types-cryptoassets@7.35.0-next.0
  - @ledgerhq/types-live@6.101.0-next.0
  - @ledgerhq/live-countervalues@0.15.1-next.0

## 0.3.0

### Minor Changes

- [#14831](https://github.com/LedgerHQ/ledger-live/pull/14831) [`158872e`](https://github.com/LedgerHQ/ledger-live/commit/158872e435155e91b1feea7a925523fe434447c4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add asset section in portfolio

- [#14874](https://github.com/LedgerHQ/ledger-live/pull/14874) [`6ee40fb`](https://github.com/LedgerHQ/ledger-live/commit/6ee40fb9b07f1fe842192aadf54b7230334b9f99) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add assets section logic with empty state slicing, item navigation, and TrendCell MVVM refactor

### Patch Changes

- Updated dependencies [[`748b933`](https://github.com/LedgerHQ/ledger-live/commit/748b933f3786e48ec9dd434c76263c2c9a642c99), [`920006a`](https://github.com/LedgerHQ/ledger-live/commit/920006a31652af78d3b416bdb8826d1564e91b91), [`ba4d56f`](https://github.com/LedgerHQ/ledger-live/commit/ba4d56fa223b87b89d621de2d1885c5a55922ef4), [`697f2e6`](https://github.com/LedgerHQ/ledger-live/commit/697f2e6f5b24ff023a46cbbbf5c9f85bac90a4c4), [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/types-live@6.100.0
  - @ledgerhq/live-countervalues@0.15.0
  - @ledgerhq/types-cryptoassets@7.34.0

## 0.3.0-next.0

### Minor Changes

- [#14831](https://github.com/LedgerHQ/ledger-live/pull/14831) [`158872e`](https://github.com/LedgerHQ/ledger-live/commit/158872e435155e91b1feea7a925523fe434447c4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add asset section in portfolio

- [#14874](https://github.com/LedgerHQ/ledger-live/pull/14874) [`6ee40fb`](https://github.com/LedgerHQ/ledger-live/commit/6ee40fb9b07f1fe842192aadf54b7230334b9f99) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add assets section logic with empty state slicing, item navigation, and TrendCell MVVM refactor

### Patch Changes

- Updated dependencies [[`748b933`](https://github.com/LedgerHQ/ledger-live/commit/748b933f3786e48ec9dd434c76263c2c9a642c99), [`920006a`](https://github.com/LedgerHQ/ledger-live/commit/920006a31652af78d3b416bdb8826d1564e91b91), [`ba4d56f`](https://github.com/LedgerHQ/ledger-live/commit/ba4d56fa223b87b89d621de2d1885c5a55922ef4), [`697f2e6`](https://github.com/LedgerHQ/ledger-live/commit/697f2e6f5b24ff023a46cbbbf5c9f85bac90a4c4), [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/types-live@6.100.0-next.0
  - @ledgerhq/live-countervalues@0.15.0-next.0
  - @ledgerhq/types-cryptoassets@7.34.0-next.0

## 0.2.0

### Minor Changes

- [#14758](https://github.com/LedgerHQ/ledger-live/pull/14758) [`0041229`](https://github.com/LedgerHQ/ledger-live/commit/00412299786667b6f4ddc964ebe928fdf1bc9209) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add @ledgerhq/asset-aggregation package with dynamic asset categorization via DADA API category filter

### Patch Changes

- Updated dependencies [[`a96dc83`](https://github.com/LedgerHQ/ledger-live/commit/a96dc83916684e22c041904c479c615a3095303b), [`e954c1e`](https://github.com/LedgerHQ/ledger-live/commit/e954c1e0f0e45efe3b0e8c3fda9e6d5b22b5bc01), [`e389cd4`](https://github.com/LedgerHQ/ledger-live/commit/e389cd4fe163c3f54029c747141ae37dda5b4da7), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d), [`cc4c8f5`](https://github.com/LedgerHQ/ledger-live/commit/cc4c8f57e38586d77b89f32d359e65cc700912af)]:
  - @ledgerhq/types-live@6.99.0
  - @ledgerhq/live-countervalues@0.14.0

## 0.2.0-next.0

### Minor Changes

- [#14758](https://github.com/LedgerHQ/ledger-live/pull/14758) [`0041229`](https://github.com/LedgerHQ/ledger-live/commit/00412299786667b6f4ddc964ebe928fdf1bc9209) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add @ledgerhq/asset-aggregation package with dynamic asset categorization via DADA API category filter

### Patch Changes

- Updated dependencies [[`a96dc83`](https://github.com/LedgerHQ/ledger-live/commit/a96dc83916684e22c041904c479c615a3095303b), [`e954c1e`](https://github.com/LedgerHQ/ledger-live/commit/e954c1e0f0e45efe3b0e8c3fda9e6d5b22b5bc01), [`e389cd4`](https://github.com/LedgerHQ/ledger-live/commit/e389cd4fe163c3f54029c747141ae37dda5b4da7), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d), [`cc4c8f5`](https://github.com/LedgerHQ/ledger-live/commit/cc4c8f57e38586d77b89f32d359e65cc700912af)]:
  - @ledgerhq/types-live@6.99.0-next.0
  - @ledgerhq/live-countervalues@0.14.0-next.0
