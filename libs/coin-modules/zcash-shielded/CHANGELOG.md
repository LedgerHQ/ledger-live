# @ledgerhq/zcash-shielded

## 0.8.0

### Minor Changes

- [#15853](https://github.com/LedgerHQ/ledger-live/pull/15853) [`892f50a`](https://github.com/LedgerHQ/ledger-live/commit/892f50a33033abbcb05f6cdfd7134c86cd4b45eb) Thanks [@alevito](https://github.com/alevito)! - DecryptedOutput::amount is expressed in Zatoshis

- [#15019](https://github.com/LedgerHQ/ledger-live/pull/15019) [`03ef36f`](https://github.com/LedgerHQ/ledger-live/commit/03ef36fe77f9048541b46e166d8bd8674fe3d896) Thanks [@alevito](https://github.com/alevito)! - - Add support for ZCash shielded sync to coin-bitcoin module

- [#15872](https://github.com/LedgerHQ/ledger-live/pull/15872) [`ca9136f`](https://github.com/LedgerHQ/ledger-live/commit/ca9136f9d17c7c82434a674faf2e111cac635a4b) Thanks [@alevito](https://github.com/alevito)! - ZCash.decryptTransaction(..) returns fee in zatoshis.

- [#15745](https://github.com/LedgerHQ/ledger-live/pull/15745) [`b755e91`](https://github.com/LedgerHQ/ledger-live/commit/b755e916e4c1e7ebd9043dfc959eba2c5081ec5b) Thanks [@semeano](https://github.com/semeano)! - Save private info when enabling shielded transactions

- [#15679](https://github.com/LedgerHQ/ledger-live/pull/15679) [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore(coin-modules): add oxfmt with shared config (Prettier parity)

  - Add libs/coin-modules/.oxfmtrc.json aligned with root .prettierrc and desktop/mobile oxfmt
  - Add format, format:check, and run oxfmt before oxlint in lint:fix; add oxfmt devDependency
  - Remove coin-ton prettier script; turbo format/format:check tasks
  - Initial oxfmt pass on src

- [#15786](https://github.com/LedgerHQ/ledger-live/pull/15786) [`fe0dedb`](https://github.com/LedgerHQ/ledger-live/commit/fe0dedb3d2f67390102b1153b6ee6cb16c22a26a) Thanks [@semeano](https://github.com/semeano)! - Connect Zcash UI with module sync

### Patch Changes

- Updated dependencies [[`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8), [`2ece647`](https://github.com/LedgerHQ/ledger-live/commit/2ece647f386e40f261662fc6e4e6624f302ee34f)]:
  - @ledgerhq/logs@6.17.0
  - @ledgerhq/live-network@2.5.0

## 0.8.0-next.0

### Minor Changes

- [#15853](https://github.com/LedgerHQ/ledger-live/pull/15853) [`892f50a`](https://github.com/LedgerHQ/ledger-live/commit/892f50a33033abbcb05f6cdfd7134c86cd4b45eb) Thanks [@alevito](https://github.com/alevito)! - DecryptedOutput::amount is expressed in Zatoshis

- [#15019](https://github.com/LedgerHQ/ledger-live/pull/15019) [`03ef36f`](https://github.com/LedgerHQ/ledger-live/commit/03ef36fe77f9048541b46e166d8bd8674fe3d896) Thanks [@alevito](https://github.com/alevito)! - - Add support for ZCash shielded sync to coin-bitcoin module

- [#15872](https://github.com/LedgerHQ/ledger-live/pull/15872) [`ca9136f`](https://github.com/LedgerHQ/ledger-live/commit/ca9136f9d17c7c82434a674faf2e111cac635a4b) Thanks [@alevito](https://github.com/alevito)! - ZCash.decryptTransaction(..) returns fee in zatoshis.

- [#15745](https://github.com/LedgerHQ/ledger-live/pull/15745) [`b755e91`](https://github.com/LedgerHQ/ledger-live/commit/b755e916e4c1e7ebd9043dfc959eba2c5081ec5b) Thanks [@semeano](https://github.com/semeano)! - Save private info when enabling shielded transactions

- [#15679](https://github.com/LedgerHQ/ledger-live/pull/15679) [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore(coin-modules): add oxfmt with shared config (Prettier parity)

  - Add libs/coin-modules/.oxfmtrc.json aligned with root .prettierrc and desktop/mobile oxfmt
  - Add format, format:check, and run oxfmt before oxlint in lint:fix; add oxfmt devDependency
  - Remove coin-ton prettier script; turbo format/format:check tasks
  - Initial oxfmt pass on src

- [#15786](https://github.com/LedgerHQ/ledger-live/pull/15786) [`fe0dedb`](https://github.com/LedgerHQ/ledger-live/commit/fe0dedb3d2f67390102b1153b6ee6cb16c22a26a) Thanks [@semeano](https://github.com/semeano)! - Connect Zcash UI with module sync

### Patch Changes

- Updated dependencies [[`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8), [`2ece647`](https://github.com/LedgerHQ/ledger-live/commit/2ece647f386e40f261662fc6e4e6624f302ee34f)]:
  - @ledgerhq/logs@6.17.0-next.0
  - @ledgerhq/live-network@2.5.0-next.0

## 0.7.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-network@2.4.3

## 0.7.2-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-network@2.4.3-next.0

## 0.7.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-network@2.4.2

## 0.7.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-network@2.4.2-next.0

## 0.7.0

### Minor Changes

- [#15014](https://github.com/LedgerHQ/ledger-live/pull/15014) [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8) Thanks [@semeano](https://github.com/semeano)! - Zcash: merge transparent and shielded ops

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025)]:
  - @ledgerhq/logs@6.16.0
  - @ledgerhq/live-network@2.4.1

## 0.7.0-next.0

### Minor Changes

- [#15014](https://github.com/LedgerHQ/ledger-live/pull/15014) [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8) Thanks [@semeano](https://github.com/semeano)! - Zcash: merge transparent and shielded ops

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025)]:
  - @ledgerhq/logs@6.16.0-next.0
  - @ledgerhq/live-network@2.4.1-next.0

## 0.6.0

### Minor Changes

- [#14584](https://github.com/LedgerHQ/ledger-live/pull/14584) [`48afda0`](https://github.com/LedgerHQ/ledger-live/commit/48afda0b1d11cdb98ba19373155834d820b166b6) Thanks [@alevito](https://github.com/alevito)! - Exposes a new ZCash.syncShielded method for parsing shielded transactions in blocks, starting from a given start block

- [#14825](https://github.com/LedgerHQ/ledger-live/pull/14825) [`4aa6be3`](https://github.com/LedgerHQ/ledger-live/commit/4aa6be378061d7ce9d445e5e31e12753aa856355) Thanks [@semeano](https://github.com/semeano)! - Move zcash types to zcash-shielded

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

### Patch Changes

- Updated dependencies [[`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/logs@6.15.0
  - @ledgerhq/live-network@2.4.0

## 0.6.0-next.0

### Minor Changes

- [#14584](https://github.com/LedgerHQ/ledger-live/pull/14584) [`48afda0`](https://github.com/LedgerHQ/ledger-live/commit/48afda0b1d11cdb98ba19373155834d820b166b6) Thanks [@alevito](https://github.com/alevito)! - Exposes a new ZCash.syncShielded method for parsing shielded transactions in blocks, starting from a given start block

- [#14825](https://github.com/LedgerHQ/ledger-live/pull/14825) [`4aa6be3`](https://github.com/LedgerHQ/ledger-live/commit/4aa6be378061d7ce9d445e5e31e12753aa856355) Thanks [@semeano](https://github.com/semeano)! - Move zcash types to zcash-shielded

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

### Patch Changes

- Updated dependencies [[`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/logs@6.15.0-next.0
  - @ledgerhq/live-network@2.4.0-next.0

## 0.5.0

### Minor Changes

- [#14354](https://github.com/LedgerHQ/ledger-live/pull/14354) [`91450b8`](https://github.com/LedgerHQ/ledger-live/commit/91450b87ab99edf0ebb062802b2f2a21d0a5deb5) Thanks [@semeano](https://github.com/semeano)! - ZCash sync account update

- [#13927](https://github.com/LedgerHQ/ledger-live/pull/13927) [`cab6ad5`](https://github.com/LedgerHQ/ledger-live/commit/cab6ad52c1eefa2d4af3ee002e5ffbf866d84234) Thanks [@alevito](https://github.com/alevito)! - Exposes a new method findShieldedTxsInBlock for finding shielded transactions in block

- [#14182](https://github.com/LedgerHQ/ledger-live/pull/14182) [`b696228`](https://github.com/LedgerHQ/ledger-live/commit/b696228f631aa9371f8d607ce5081abb389af912) Thanks [@pvoliveira](https://github.com/pvoliveira)! - Add findBlockHeight implementation

### Patch Changes

- Updated dependencies [[`91450b8`](https://github.com/LedgerHQ/ledger-live/commit/91450b87ab99edf0ebb062802b2f2a21d0a5deb5), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8)]:
  - @ledgerhq/coin-bitcoin@0.32.0
  - @ledgerhq/live-network@2.3.0

## 0.5.0-next.0

### Minor Changes

- [#14354](https://github.com/LedgerHQ/ledger-live/pull/14354) [`91450b8`](https://github.com/LedgerHQ/ledger-live/commit/91450b87ab99edf0ebb062802b2f2a21d0a5deb5) Thanks [@semeano](https://github.com/semeano)! - ZCash sync account update

- [#13927](https://github.com/LedgerHQ/ledger-live/pull/13927) [`cab6ad5`](https://github.com/LedgerHQ/ledger-live/commit/cab6ad52c1eefa2d4af3ee002e5ffbf866d84234) Thanks [@alevito](https://github.com/alevito)! - Exposes a new method findShieldedTxsInBlock for finding shielded transactions in block

- [#14182](https://github.com/LedgerHQ/ledger-live/pull/14182) [`b696228`](https://github.com/LedgerHQ/ledger-live/commit/b696228f631aa9371f8d607ce5081abb389af912) Thanks [@pvoliveira](https://github.com/pvoliveira)! - Add findBlockHeight implementation

### Patch Changes

- Updated dependencies [[`91450b8`](https://github.com/LedgerHQ/ledger-live/commit/91450b87ab99edf0ebb062802b2f2a21d0a5deb5), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8)]:
  - @ledgerhq/coin-bitcoin@0.32.0-next.0
  - @ledgerhq/live-network@2.3.0-next.0

## 0.4.0

### Minor Changes

- [#14234](https://github.com/LedgerHQ/ledger-live/pull/14234) [`40249cb`](https://github.com/LedgerHQ/ledger-live/commit/40249cbb3c112b8bf7e8c36880b80e60154d6090) Thanks [@semeano](https://github.com/semeano)! - Add function to estimate sync time

- [#13887](https://github.com/LedgerHQ/ledger-live/pull/13887) [`4e17220`](https://github.com/LedgerHQ/ledger-live/commit/4e17220d76afd31937d56aa8c285609ebbf867c8) Thanks [@alevito](https://github.com/alevito)! - Method for decrypting shielded part of a ZCash transaction

## 0.4.0-next.0

### Minor Changes

- [#14234](https://github.com/LedgerHQ/ledger-live/pull/14234) [`40249cb`](https://github.com/LedgerHQ/ledger-live/commit/40249cbb3c112b8bf7e8c36880b80e60154d6090) Thanks [@semeano](https://github.com/semeano)! - Add function to estimate sync time

- [#13887](https://github.com/LedgerHQ/ledger-live/pull/13887) [`4e17220`](https://github.com/LedgerHQ/ledger-live/commit/4e17220d76afd31937d56aa8c285609ebbf867c8) Thanks [@alevito](https://github.com/alevito)! - Method for decrypting shielded part of a ZCash transaction

## 0.3.0

### Minor Changes

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

## 0.3.0-next.0

### Minor Changes

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

## 0.2.0

### Minor Changes

- [#13166](https://github.com/LedgerHQ/ledger-live/pull/13166) [`9a97195`](https://github.com/LedgerHQ/ledger-live/commit/9a9719585de98dee726345643549676712848972) Thanks [@alevito](https://github.com/alevito)! - Create the basic structure of a ZCash library for shielded transactions.

## 0.2.0-next.0

### Minor Changes

- [#13166](https://github.com/LedgerHQ/ledger-live/pull/13166) [`9a97195`](https://github.com/LedgerHQ/ledger-live/commit/9a9719585de98dee726345643549676712848972) Thanks [@alevito](https://github.com/alevito)! - Create the basic structure of a ZCash library for shielded transactions.
