# @ledgerhq/coin-tester-evm

## 1.11.0-next.0

### Minor Changes

- [#12248](https://github.com/LedgerHQ/ledger-live/pull/12248) [`f0e3f10`](https://github.com/LedgerHQ/ledger-live/commit/f0e3f10aaddadc03d7ebac577c4d4a0dd4d3d044) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): dynamically adjust transaction type

### Patch Changes

- Updated dependencies [[`bba0818`](https://github.com/LedgerHQ/ledger-live/commit/bba0818d91913ac8b45b9638792a28b36e02f48d), [`8c5966e`](https://github.com/LedgerHQ/ledger-live/commit/8c5966ebbf04e9e4ce48b8fcba5de391252eb921), [`74a340b`](https://github.com/LedgerHQ/ledger-live/commit/74a340b258589c9c37476103029eb036b930616c), [`b2780c4`](https://github.com/LedgerHQ/ledger-live/commit/b2780c42aa9dbc38709b4254a14c792913464637), [`8422b37`](https://github.com/LedgerHQ/ledger-live/commit/8422b376ac66bd43e3f70578b441fb7d3e95e9ff), [`a6bc24e`](https://github.com/LedgerHQ/ledger-live/commit/a6bc24ee988b98bf82f807ac5ce731ba79813901), [`ddffd48`](https://github.com/LedgerHQ/ledger-live/commit/ddffd4836cc916018e96dd7373543dcdb20334e0), [`cccee0b`](https://github.com/LedgerHQ/ledger-live/commit/cccee0b8d76851abadbf8d2aa97c72454b749a1d), [`b69c97d`](https://github.com/LedgerHQ/ledger-live/commit/b69c97d979ba97154c9abfda6abfc2a36becee4f), [`544721d`](https://github.com/LedgerHQ/ledger-live/commit/544721d198454526ef83516619d59c881ba34eb9), [`b80ae2a`](https://github.com/LedgerHQ/ledger-live/commit/b80ae2a43a0b6831afbca248e95142ced7e4dc01), [`5cd6964`](https://github.com/LedgerHQ/ledger-live/commit/5cd69649120a86328ce7943f4b54d84ce6426238), [`9a8d4ba`](https://github.com/LedgerHQ/ledger-live/commit/9a8d4ba540372a2b901186f711dbfd005d17ca42), [`1c6f5f5`](https://github.com/LedgerHQ/ledger-live/commit/1c6f5f5843349b1955f7ca466f98cbe4ffcdaddf), [`f0e3f10`](https://github.com/LedgerHQ/ledger-live/commit/f0e3f10aaddadc03d7ebac577c4d4a0dd4d3d044), [`d5d838a`](https://github.com/LedgerHQ/ledger-live/commit/d5d838a23e00edd53293843781c559c41db4e854), [`9f61dcf`](https://github.com/LedgerHQ/ledger-live/commit/9f61dcf6163fd66657e5be732c28bea623a40515), [`479abcc`](https://github.com/LedgerHQ/ledger-live/commit/479abcc77310297226726271d3bdad7668a084ee), [`1b12223`](https://github.com/LedgerHQ/ledger-live/commit/1b1222391d351698710d23e3245a1a7b61566d90), [`938b970`](https://github.com/LedgerHQ/ledger-live/commit/938b970e15118dc706c759a3bec27dc01c3dd268), [`c40e9da`](https://github.com/LedgerHQ/ledger-live/commit/c40e9da68452fe9827b9435ff2d162291186be73), [`7acca7b`](https://github.com/LedgerHQ/ledger-live/commit/7acca7b3f8db4f0c1d2bdbeb0722c88923b0e5ea), [`c0b5b9f`](https://github.com/LedgerHQ/ledger-live/commit/c0b5b9f4cdcb2ea3e15419cbf3d1a14f725c3e6a), [`f78d6ff`](https://github.com/LedgerHQ/ledger-live/commit/f78d6ff46551a8d45b42d8d878b3dcbc96596b2f), [`48ad785`](https://github.com/LedgerHQ/ledger-live/commit/48ad785ce6f7f8fef27157b611e8c8e6e91bfe7e), [`3e54d84`](https://github.com/LedgerHQ/ledger-live/commit/3e54d8442ecd95fd9cbaf140f80c4173b82cc152), [`70049be`](https://github.com/LedgerHQ/ledger-live/commit/70049bed0cd0a8c7a9e4947a63af82061dad46c0), [`ded9965`](https://github.com/LedgerHQ/ledger-live/commit/ded99658228c6ee46c70d6f32563c2c92f4f0565), [`4232a4c`](https://github.com/LedgerHQ/ledger-live/commit/4232a4cbef7e77082ff8ecbd3f2da9c22559c2de), [`5b41dd5`](https://github.com/LedgerHQ/ledger-live/commit/5b41dd56e024a5d03ba0e49084113c04887395db), [`e686e2e`](https://github.com/LedgerHQ/ledger-live/commit/e686e2e54eb7b6cc166e36883c1de722108285ef), [`eb5a17e`](https://github.com/LedgerHQ/ledger-live/commit/eb5a17e4db336eaa871eaeb52ffa5248e0f78bec), [`af47f52`](https://github.com/LedgerHQ/ledger-live/commit/af47f52290f0a140744cea4cb99649e0a47ef54e), [`c70f6a8`](https://github.com/LedgerHQ/ledger-live/commit/c70f6a8370056b6fd8f236205471359d6f9b846f)]:
  - @ledgerhq/live-common@34.53.0-next.0
  - @ledgerhq/types-live@6.89.0-next.0
  - @ledgerhq/cryptoassets@13.33.0-next.0
  - @ledgerhq/coin-framework@6.9.0-next.0
  - @ledgerhq/coin-evm@2.35.0-next.0
  - @ledgerhq/coin-tester@0.12.0-next.0
  - @ledgerhq/live-signer-evm@0.10.1-next.0

## 1.10.1

### Patch Changes

- Updated dependencies [[`51bfea9`](https://github.com/LedgerHQ/ledger-live/commit/51bfea93d2b52ab552bb7f4932bfd225134f3238)]:
  - @ledgerhq/live-common@34.52.1

## 1.10.1-hotfix.0

### Patch Changes

- Updated dependencies [[`51bfea9`](https://github.com/LedgerHQ/ledger-live/commit/51bfea93d2b52ab552bb7f4932bfd225134f3238)]:
  - @ledgerhq/live-common@34.52.1-hotfix.0

## 1.10.0

### Minor Changes

- [#12431](https://github.com/LedgerHQ/ledger-live/pull/12431) [`4095b90`](https://github.com/LedgerHQ/ledger-live/commit/4095b9024527c16454eff9d5c44ed825375296ea) Thanks [@gre-ledger](https://github.com/gre-ledger)! - dedup ethers library

### Patch Changes

- Updated dependencies [[`a4bf9fb`](https://github.com/LedgerHQ/ledger-live/commit/a4bf9fbd766023028cb059ff033a21dbdc862115), [`49b5b77`](https://github.com/LedgerHQ/ledger-live/commit/49b5b7765718b13283d324bb77ad6f7403dd96ed), [`d576a0c`](https://github.com/LedgerHQ/ledger-live/commit/d576a0c5354fd3aaf2900432c0c847b7c205ae63), [`08ff5f2`](https://github.com/LedgerHQ/ledger-live/commit/08ff5f2ea791b3ffaeb715d40b7ade782e195a65), [`b4ceaff`](https://github.com/LedgerHQ/ledger-live/commit/b4ceaff2ecf68d8a14e09801c76ab0b014c45286), [`5b8a62e`](https://github.com/LedgerHQ/ledger-live/commit/5b8a62e244a13a384ae3e1c76bb5a5947eac614f), [`56ba896`](https://github.com/LedgerHQ/ledger-live/commit/56ba8964e2c4c35791073a9370944658387515bb), [`965692a`](https://github.com/LedgerHQ/ledger-live/commit/965692a3c88e114616e3f9c0e76ab2bfbb57a85f), [`919967c`](https://github.com/LedgerHQ/ledger-live/commit/919967c78195b7cd0ea43183c019b0b73e8d9a1f), [`da750a1`](https://github.com/LedgerHQ/ledger-live/commit/da750a16ee5f2c083114569b8ae3c708cceba06c), [`63e8f34`](https://github.com/LedgerHQ/ledger-live/commit/63e8f342f6b951ab77bb710b9971f033c05e579e), [`ccf788d`](https://github.com/LedgerHQ/ledger-live/commit/ccf788d7c0239ca95e76c3cc340f9a6bd09ea726), [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d), [`11eeb30`](https://github.com/LedgerHQ/ledger-live/commit/11eeb30e4279cdd6cf73d11b1a637804bf2dbb49), [`8d7c1f7`](https://github.com/LedgerHQ/ledger-live/commit/8d7c1f7a92489647399b0e780d4bb926508e8554), [`19da1c2`](https://github.com/LedgerHQ/ledger-live/commit/19da1c2756211d76373ab59cb6302bd8e7f1d4f8), [`ec733ba`](https://github.com/LedgerHQ/ledger-live/commit/ec733bab33c12b12d306f0704475685b80070905), [`8b39aa7`](https://github.com/LedgerHQ/ledger-live/commit/8b39aa7ca9e58ed3b028b133495fd729a1843332), [`b10973c`](https://github.com/LedgerHQ/ledger-live/commit/b10973cdbcaf810f5dcde2ef7a9737437d79ee26), [`85b0d42`](https://github.com/LedgerHQ/ledger-live/commit/85b0d421cec63eab83a0e15fae0228cb96e95fed), [`607e4be`](https://github.com/LedgerHQ/ledger-live/commit/607e4be33145c102debce1606224b08579888aa8), [`0b57e76`](https://github.com/LedgerHQ/ledger-live/commit/0b57e7631fadf0e1ecd08d0c6302bf0ac728173b), [`958aaa4`](https://github.com/LedgerHQ/ledger-live/commit/958aaa480d9d42d71bf4dc46b2e5710ad9848152), [`6d86fd9`](https://github.com/LedgerHQ/ledger-live/commit/6d86fd922576160235343776846dd03eabddbd72), [`c96d73f`](https://github.com/LedgerHQ/ledger-live/commit/c96d73fed0a75a9c208f78d51c34b742703a7dda), [`7744980`](https://github.com/LedgerHQ/ledger-live/commit/774498090411f1a6d6c06395dda1fc7cd24adf24), [`ae0f8e4`](https://github.com/LedgerHQ/ledger-live/commit/ae0f8e4fb7fed90b7b110769b4bef54642fc24cf), [`9ab92be`](https://github.com/LedgerHQ/ledger-live/commit/9ab92be96e675b5223c2977958521fbd6d170fe7), [`3dfd7ff`](https://github.com/LedgerHQ/ledger-live/commit/3dfd7ff812cdc9c16af980d9729960f37397c37d), [`19e59ef`](https://github.com/LedgerHQ/ledger-live/commit/19e59ef4496ae4271031692e536408727b42f570), [`4095b90`](https://github.com/LedgerHQ/ledger-live/commit/4095b9024527c16454eff9d5c44ed825375296ea), [`77566c5`](https://github.com/LedgerHQ/ledger-live/commit/77566c5a3b5795f5938bd5daaa5f8d65934c56b8), [`a511849`](https://github.com/LedgerHQ/ledger-live/commit/a511849d299daaea57c3decb95d842cb7fa68673), [`6baa302`](https://github.com/LedgerHQ/ledger-live/commit/6baa302930df15d535c0f683897bf87bcf41df82), [`2e6d6a7`](https://github.com/LedgerHQ/ledger-live/commit/2e6d6a7d65edd18f90b8e6499128157ef9ea37a6), [`8a4658b`](https://github.com/LedgerHQ/ledger-live/commit/8a4658b2140ad4d91de7a1ae79a53f5b9e9b076d), [`f8d904d`](https://github.com/LedgerHQ/ledger-live/commit/f8d904de5607c103549f247428b5a4079f28c1c0), [`eb176c2`](https://github.com/LedgerHQ/ledger-live/commit/eb176c201d711f1d28f74de831c4a6cd0c2d4a50), [`b386019`](https://github.com/LedgerHQ/ledger-live/commit/b3860190aedc7691250e0abacf07ee7dd2962c91), [`2527f6b`](https://github.com/LedgerHQ/ledger-live/commit/2527f6b4d7147aab4809f26993e78b194f0044c6), [`a731c4c`](https://github.com/LedgerHQ/ledger-live/commit/a731c4cd492a968eb7baa981fdd8aaddedd21f25), [`b962966`](https://github.com/LedgerHQ/ledger-live/commit/b962966525517c5cfa7f1f8826f8f2b9162189e4), [`70a3dcb`](https://github.com/LedgerHQ/ledger-live/commit/70a3dcb535db2a44aa2b609567dc4c9d359ad710), [`f392f69`](https://github.com/LedgerHQ/ledger-live/commit/f392f6912f445cc2f7cf4dfcfd030fa3da76f736), [`cadf2e1`](https://github.com/LedgerHQ/ledger-live/commit/cadf2e1dfb09248d3f77d96f94ae774425dbca75), [`36e5168`](https://github.com/LedgerHQ/ledger-live/commit/36e5168397eaec2a5f425038392a4400f60571d0), [`94719b8`](https://github.com/LedgerHQ/ledger-live/commit/94719b88092b7ebb1c24f7bf983e2476c1428153), [`6ccabef`](https://github.com/LedgerHQ/ledger-live/commit/6ccabef8f3c4e8cc042299d531684595ebadcc55), [`3d4188a`](https://github.com/LedgerHQ/ledger-live/commit/3d4188a26021d33b950129d82cb55d2c2e8d4358), [`d9305e8`](https://github.com/LedgerHQ/ledger-live/commit/d9305e8a4d8364366aaba05dd698396d28b539dc), [`2c6a198`](https://github.com/LedgerHQ/ledger-live/commit/2c6a198ba28391695202a0787ce168c53768ff37)]:
  - @ledgerhq/live-common@34.52.0
  - @ledgerhq/cryptoassets@13.32.0
  - @ledgerhq/coin-evm@2.34.0
  - @ledgerhq/types-cryptoassets@7.30.0
  - @ledgerhq/coin-framework@6.8.0
  - @ledgerhq/coin-tester@0.11.0
  - @ledgerhq/types-live@6.88.0
  - @ledgerhq/live-signer-evm@0.10.0

## 1.10.0-next.3

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.52.0-next.3

## 1.10.0-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.52.0-next.2

## 1.10.0-next.1

### Patch Changes

- Updated dependencies [[`5b8a62e`](https://github.com/LedgerHQ/ledger-live/commit/5b8a62e244a13a384ae3e1c76bb5a5947eac614f)]:
  - @ledgerhq/live-common@34.52.0-next.1

## 1.10.0-next.0

### Minor Changes

- [#12431](https://github.com/LedgerHQ/ledger-live/pull/12431) [`4095b90`](https://github.com/LedgerHQ/ledger-live/commit/4095b9024527c16454eff9d5c44ed825375296ea) Thanks [@gre-ledger](https://github.com/gre-ledger)! - dedup ethers library

### Patch Changes

- Updated dependencies [[`a4bf9fb`](https://github.com/LedgerHQ/ledger-live/commit/a4bf9fbd766023028cb059ff033a21dbdc862115), [`49b5b77`](https://github.com/LedgerHQ/ledger-live/commit/49b5b7765718b13283d324bb77ad6f7403dd96ed), [`d576a0c`](https://github.com/LedgerHQ/ledger-live/commit/d576a0c5354fd3aaf2900432c0c847b7c205ae63), [`08ff5f2`](https://github.com/LedgerHQ/ledger-live/commit/08ff5f2ea791b3ffaeb715d40b7ade782e195a65), [`b4ceaff`](https://github.com/LedgerHQ/ledger-live/commit/b4ceaff2ecf68d8a14e09801c76ab0b014c45286), [`56ba896`](https://github.com/LedgerHQ/ledger-live/commit/56ba8964e2c4c35791073a9370944658387515bb), [`965692a`](https://github.com/LedgerHQ/ledger-live/commit/965692a3c88e114616e3f9c0e76ab2bfbb57a85f), [`919967c`](https://github.com/LedgerHQ/ledger-live/commit/919967c78195b7cd0ea43183c019b0b73e8d9a1f), [`da750a1`](https://github.com/LedgerHQ/ledger-live/commit/da750a16ee5f2c083114569b8ae3c708cceba06c), [`63e8f34`](https://github.com/LedgerHQ/ledger-live/commit/63e8f342f6b951ab77bb710b9971f033c05e579e), [`ccf788d`](https://github.com/LedgerHQ/ledger-live/commit/ccf788d7c0239ca95e76c3cc340f9a6bd09ea726), [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d), [`11eeb30`](https://github.com/LedgerHQ/ledger-live/commit/11eeb30e4279cdd6cf73d11b1a637804bf2dbb49), [`8d7c1f7`](https://github.com/LedgerHQ/ledger-live/commit/8d7c1f7a92489647399b0e780d4bb926508e8554), [`19da1c2`](https://github.com/LedgerHQ/ledger-live/commit/19da1c2756211d76373ab59cb6302bd8e7f1d4f8), [`ec733ba`](https://github.com/LedgerHQ/ledger-live/commit/ec733bab33c12b12d306f0704475685b80070905), [`8b39aa7`](https://github.com/LedgerHQ/ledger-live/commit/8b39aa7ca9e58ed3b028b133495fd729a1843332), [`b10973c`](https://github.com/LedgerHQ/ledger-live/commit/b10973cdbcaf810f5dcde2ef7a9737437d79ee26), [`85b0d42`](https://github.com/LedgerHQ/ledger-live/commit/85b0d421cec63eab83a0e15fae0228cb96e95fed), [`607e4be`](https://github.com/LedgerHQ/ledger-live/commit/607e4be33145c102debce1606224b08579888aa8), [`0b57e76`](https://github.com/LedgerHQ/ledger-live/commit/0b57e7631fadf0e1ecd08d0c6302bf0ac728173b), [`958aaa4`](https://github.com/LedgerHQ/ledger-live/commit/958aaa480d9d42d71bf4dc46b2e5710ad9848152), [`6d86fd9`](https://github.com/LedgerHQ/ledger-live/commit/6d86fd922576160235343776846dd03eabddbd72), [`c96d73f`](https://github.com/LedgerHQ/ledger-live/commit/c96d73fed0a75a9c208f78d51c34b742703a7dda), [`7744980`](https://github.com/LedgerHQ/ledger-live/commit/774498090411f1a6d6c06395dda1fc7cd24adf24), [`ae0f8e4`](https://github.com/LedgerHQ/ledger-live/commit/ae0f8e4fb7fed90b7b110769b4bef54642fc24cf), [`9ab92be`](https://github.com/LedgerHQ/ledger-live/commit/9ab92be96e675b5223c2977958521fbd6d170fe7), [`3dfd7ff`](https://github.com/LedgerHQ/ledger-live/commit/3dfd7ff812cdc9c16af980d9729960f37397c37d), [`19e59ef`](https://github.com/LedgerHQ/ledger-live/commit/19e59ef4496ae4271031692e536408727b42f570), [`4095b90`](https://github.com/LedgerHQ/ledger-live/commit/4095b9024527c16454eff9d5c44ed825375296ea), [`77566c5`](https://github.com/LedgerHQ/ledger-live/commit/77566c5a3b5795f5938bd5daaa5f8d65934c56b8), [`a511849`](https://github.com/LedgerHQ/ledger-live/commit/a511849d299daaea57c3decb95d842cb7fa68673), [`6baa302`](https://github.com/LedgerHQ/ledger-live/commit/6baa302930df15d535c0f683897bf87bcf41df82), [`2e6d6a7`](https://github.com/LedgerHQ/ledger-live/commit/2e6d6a7d65edd18f90b8e6499128157ef9ea37a6), [`8a4658b`](https://github.com/LedgerHQ/ledger-live/commit/8a4658b2140ad4d91de7a1ae79a53f5b9e9b076d), [`f8d904d`](https://github.com/LedgerHQ/ledger-live/commit/f8d904de5607c103549f247428b5a4079f28c1c0), [`eb176c2`](https://github.com/LedgerHQ/ledger-live/commit/eb176c201d711f1d28f74de831c4a6cd0c2d4a50), [`b386019`](https://github.com/LedgerHQ/ledger-live/commit/b3860190aedc7691250e0abacf07ee7dd2962c91), [`2527f6b`](https://github.com/LedgerHQ/ledger-live/commit/2527f6b4d7147aab4809f26993e78b194f0044c6), [`a731c4c`](https://github.com/LedgerHQ/ledger-live/commit/a731c4cd492a968eb7baa981fdd8aaddedd21f25), [`b962966`](https://github.com/LedgerHQ/ledger-live/commit/b962966525517c5cfa7f1f8826f8f2b9162189e4), [`70a3dcb`](https://github.com/LedgerHQ/ledger-live/commit/70a3dcb535db2a44aa2b609567dc4c9d359ad710), [`f392f69`](https://github.com/LedgerHQ/ledger-live/commit/f392f6912f445cc2f7cf4dfcfd030fa3da76f736), [`cadf2e1`](https://github.com/LedgerHQ/ledger-live/commit/cadf2e1dfb09248d3f77d96f94ae774425dbca75), [`36e5168`](https://github.com/LedgerHQ/ledger-live/commit/36e5168397eaec2a5f425038392a4400f60571d0), [`94719b8`](https://github.com/LedgerHQ/ledger-live/commit/94719b88092b7ebb1c24f7bf983e2476c1428153), [`6ccabef`](https://github.com/LedgerHQ/ledger-live/commit/6ccabef8f3c4e8cc042299d531684595ebadcc55), [`3d4188a`](https://github.com/LedgerHQ/ledger-live/commit/3d4188a26021d33b950129d82cb55d2c2e8d4358), [`d9305e8`](https://github.com/LedgerHQ/ledger-live/commit/d9305e8a4d8364366aaba05dd698396d28b539dc), [`2c6a198`](https://github.com/LedgerHQ/ledger-live/commit/2c6a198ba28391695202a0787ce168c53768ff37)]:
  - @ledgerhq/live-common@34.52.0-next.0
  - @ledgerhq/cryptoassets@13.32.0-next.0
  - @ledgerhq/coin-evm@2.34.0-next.0
  - @ledgerhq/types-cryptoassets@7.30.0-next.0
  - @ledgerhq/coin-framework@6.8.0-next.0
  - @ledgerhq/coin-tester@0.11.0-next.0
  - @ledgerhq/types-live@6.88.0-next.0
  - @ledgerhq/live-signer-evm@0.10.0-next.0

## 1.9.0

### Minor Changes

- [#12186](https://github.com/LedgerHQ/ledger-live/pull/12186) [`a9aacdb`](https://github.com/LedgerHQ/ledger-live/commit/a9aacdb330700f0a294833f7d77de17f179229b2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated `findTokenByTicker` function and related internal state. This function was ambiguous when multiple tokens shared the same ticker across different blockchains. Use `findTokenById` or `findTokenByAddressInCurrency` instead for more precise token lookup.

- [#12269](https://github.com/LedgerHQ/ledger-live/pull/12269) [`7593ade`](https://github.com/LedgerHQ/ledger-live/commit/7593ade7fcaa06779673b5f563d96174ecdf6e78) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - doc(coin-tester-evm): add missing dependency in README

- [#12015](https://github.com/LedgerHQ/ledger-live/pull/12015) [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b) Thanks [@Justkant](https://github.com/Justkant)! - feat: new signRawTransaction to support any XRP transaction with wallet-api

- [#12185](https://github.com/LedgerHQ/ledger-live/pull/12185) [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated findTokenByAddress in favor of findTokenByAddressInCurrency

  Removed the deprecated `findTokenByAddress` function which had ambiguous behavior when multiple tokens shared the same contract address across different blockchains. The function has been fully replaced with `findTokenByAddressInCurrency` which requires both the token address and parent currency ID, providing more precise token lookup.

  This includes:

  - Removal of `findTokenByAddress` function from cryptoassets package
  - Removal of `tokensByAddress` state dictionary
  - Update all usages to `findTokenByAddressInCurrency` across the codebase
  - Update CryptoAssetsStore interface to remove the deprecated method

- [#12196](https://github.com/LedgerHQ/ledger-live/pull/12196) [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated getTokenById and hasTokenId functions

### Patch Changes

- Updated dependencies [[`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18), [`ea16f59`](https://github.com/LedgerHQ/ledger-live/commit/ea16f592e85019a1b77287a7f2b975c6fcffc74c), [`3691bed`](https://github.com/LedgerHQ/ledger-live/commit/3691bed5f5706f010037f54e2396ad71e48cf208), [`764d835`](https://github.com/LedgerHQ/ledger-live/commit/764d835ea88eb6cdb76a6bfb9c8764653e76f690), [`b88faa1`](https://github.com/LedgerHQ/ledger-live/commit/b88faa18e2f5cd309b54fc3157a44db606846cc5), [`731e501`](https://github.com/LedgerHQ/ledger-live/commit/731e501919d3f5110e53cc51112b506a15dbffe9), [`5098fd4`](https://github.com/LedgerHQ/ledger-live/commit/5098fd44f8c8aa883cabefe691c090f83ca936d5), [`949d5be`](https://github.com/LedgerHQ/ledger-live/commit/949d5be90316148f38701a96dbc75d6a4bc020cc), [`2bdc741`](https://github.com/LedgerHQ/ledger-live/commit/2bdc741cf7ae42ca2a7d0eebbe9515d9fdd69603), [`cfe65ca`](https://github.com/LedgerHQ/ledger-live/commit/cfe65cafa268be4e53197ee163ce78f28ed72592), [`a9aacdb`](https://github.com/LedgerHQ/ledger-live/commit/a9aacdb330700f0a294833f7d77de17f179229b2), [`3979c07`](https://github.com/LedgerHQ/ledger-live/commit/3979c0715e4f54165c89d00ebe1441e064e1a110), [`0c7d867`](https://github.com/LedgerHQ/ledger-live/commit/0c7d8673ac49a90d0a491e7236731a74dcb4d7e1), [`e50f35a`](https://github.com/LedgerHQ/ledger-live/commit/e50f35a0c3b23c7176e465c1fafc0e3340f5527c), [`f1f3845`](https://github.com/LedgerHQ/ledger-live/commit/f1f3845942e4cbce9c585dc65f6170ddbc319f19), [`f83881e`](https://github.com/LedgerHQ/ledger-live/commit/f83881ea7b2da6ee04df3535b779d014fd5d9227), [`04fc7da`](https://github.com/LedgerHQ/ledger-live/commit/04fc7daed03fde65ac8c1ec4c0e28d784e16337a), [`9b7f62c`](https://github.com/LedgerHQ/ledger-live/commit/9b7f62c93fc74250f21c7102cf1c42a91f0f3644), [`53e4b19`](https://github.com/LedgerHQ/ledger-live/commit/53e4b19f556cbfd325816a70736552f09aa29df8), [`c6a676f`](https://github.com/LedgerHQ/ledger-live/commit/c6a676ff80581ac19b896adf44d54812983b72da), [`7556e73`](https://github.com/LedgerHQ/ledger-live/commit/7556e73e2ddc110d2c888fb25203689ee187e6af), [`b0454f6`](https://github.com/LedgerHQ/ledger-live/commit/b0454f6f94948530c169641b5a5845dd33886c96), [`7e0dfed`](https://github.com/LedgerHQ/ledger-live/commit/7e0dfedc7c06af31763bb7216cd89b94a395c304), [`b5fc1bd`](https://github.com/LedgerHQ/ledger-live/commit/b5fc1bd28fff091241905fec5ff8dc8af4c99b79), [`39866a1`](https://github.com/LedgerHQ/ledger-live/commit/39866a175244519013894ce816013fff1fc4d100), [`cc743a7`](https://github.com/LedgerHQ/ledger-live/commit/cc743a7c36c2a19c13497dd0e5e55f985448d053), [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b), [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33), [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6), [`8645f01`](https://github.com/LedgerHQ/ledger-live/commit/8645f016191d29a55f6b0ca6e4b1d1909fd35445), [`1d325fa`](https://github.com/LedgerHQ/ledger-live/commit/1d325fa224e341a44593e0a8424f8346dd2ec4c0), [`1d9860c`](https://github.com/LedgerHQ/ledger-live/commit/1d9860cd1688131d391579955b40c6710b667db8), [`73d673c`](https://github.com/LedgerHQ/ledger-live/commit/73d673cfd588a07a360df74553a879ba630c2250), [`73d3fbd`](https://github.com/LedgerHQ/ledger-live/commit/73d3fbdc4cc74fa1905efedff9709467d337021c), [`c56dece`](https://github.com/LedgerHQ/ledger-live/commit/c56dece6b87835d55baf90277c9141d40df2d92a), [`8998d5f`](https://github.com/LedgerHQ/ledger-live/commit/8998d5f164092c17c409e65d0cf54f40728717ed), [`475296a`](https://github.com/LedgerHQ/ledger-live/commit/475296a4b0cc13a2c375f282e9d9b4b263fa8533), [`d2b12e7`](https://github.com/LedgerHQ/ledger-live/commit/d2b12e70bba9e772d078d1fe4d9c537b8d316a87), [`db25e21`](https://github.com/LedgerHQ/ledger-live/commit/db25e212b87dea426b153c6f1d988cead63c8c46), [`1587cf4`](https://github.com/LedgerHQ/ledger-live/commit/1587cf47cd9722b00cb3b51c898634e26f752487), [`f077f72`](https://github.com/LedgerHQ/ledger-live/commit/f077f7205667f4f7b82ae7584e80964c5ac7601a), [`c8dbf40`](https://github.com/LedgerHQ/ledger-live/commit/c8dbf402268359e225a94782420111e786f875fa), [`cab7d97`](https://github.com/LedgerHQ/ledger-live/commit/cab7d9794e7babb8220c6d339fb08e618e3d4202), [`86166a6`](https://github.com/LedgerHQ/ledger-live/commit/86166a6fe096d10f5e25fc323349348c2a243ae1), [`246b070`](https://github.com/LedgerHQ/ledger-live/commit/246b0701c1f375f3cdd847c5d2a8fe3c2060ef28)]:
  - @ledgerhq/live-common@34.51.0
  - @ledgerhq/cryptoassets@13.31.0
  - @ledgerhq/types-live@6.87.0
  - @ledgerhq/coin-evm@2.33.0
  - @ledgerhq/coin-framework@6.7.0
  - @ledgerhq/live-signer-evm@0.9.0
  - @ledgerhq/types-cryptoassets@7.29.0
  - @ledgerhq/coin-tester@0.10.1

## 1.9.0-next.4

### Patch Changes

- Updated dependencies [[`5098fd4`](https://github.com/LedgerHQ/ledger-live/commit/5098fd44f8c8aa883cabefe691c090f83ca936d5)]:
  - @ledgerhq/live-common@34.51.0-next.3

## 1.9.0-next.3

### Patch Changes

- Updated dependencies [[`73d3fbd`](https://github.com/LedgerHQ/ledger-live/commit/73d3fbdc4cc74fa1905efedff9709467d337021c)]:
  - @ledgerhq/live-common@34.51.0-next.2

## 1.9.0-next.2

### Minor Changes

- [#12269](https://github.com/LedgerHQ/ledger-live/pull/12269) [`7593ade`](https://github.com/LedgerHQ/ledger-live/commit/7593ade7fcaa06779673b5f563d96174ecdf6e78) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - doc(coin-tester-evm): add missing dependency in README

## 1.9.0-next.1

### Patch Changes

- Updated dependencies [[`b88faa1`](https://github.com/LedgerHQ/ledger-live/commit/b88faa18e2f5cd309b54fc3157a44db606846cc5)]:
  - @ledgerhq/types-live@6.87.0-next.1
  - @ledgerhq/live-common@34.51.0-next.1
  - @ledgerhq/coin-framework@6.7.0-next.1
  - @ledgerhq/coin-evm@2.33.0-next.1
  - @ledgerhq/coin-tester@0.10.1
  - @ledgerhq/cryptoassets@13.31.0-next.1
  - @ledgerhq/live-signer-evm@0.9.0-next.1

## 1.9.0-next.0

### Minor Changes

- [#12186](https://github.com/LedgerHQ/ledger-live/pull/12186) [`a9aacdb`](https://github.com/LedgerHQ/ledger-live/commit/a9aacdb330700f0a294833f7d77de17f179229b2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated `findTokenByTicker` function and related internal state. This function was ambiguous when multiple tokens shared the same ticker across different blockchains. Use `findTokenById` or `findTokenByAddressInCurrency` instead for more precise token lookup.

- [#12015](https://github.com/LedgerHQ/ledger-live/pull/12015) [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b) Thanks [@Justkant](https://github.com/Justkant)! - feat: new signRawTransaction to support any XRP transaction with wallet-api

- [#12185](https://github.com/LedgerHQ/ledger-live/pull/12185) [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated findTokenByAddress in favor of findTokenByAddressInCurrency

  Removed the deprecated `findTokenByAddress` function which had ambiguous behavior when multiple tokens shared the same contract address across different blockchains. The function has been fully replaced with `findTokenByAddressInCurrency` which requires both the token address and parent currency ID, providing more precise token lookup.

  This includes:

  - Removal of `findTokenByAddress` function from cryptoassets package
  - Removal of `tokensByAddress` state dictionary
  - Update all usages to `findTokenByAddressInCurrency` across the codebase
  - Update CryptoAssetsStore interface to remove the deprecated method

- [#12196](https://github.com/LedgerHQ/ledger-live/pull/12196) [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated getTokenById and hasTokenId functions

### Patch Changes

- Updated dependencies [[`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18), [`ea16f59`](https://github.com/LedgerHQ/ledger-live/commit/ea16f592e85019a1b77287a7f2b975c6fcffc74c), [`3691bed`](https://github.com/LedgerHQ/ledger-live/commit/3691bed5f5706f010037f54e2396ad71e48cf208), [`764d835`](https://github.com/LedgerHQ/ledger-live/commit/764d835ea88eb6cdb76a6bfb9c8764653e76f690), [`731e501`](https://github.com/LedgerHQ/ledger-live/commit/731e501919d3f5110e53cc51112b506a15dbffe9), [`949d5be`](https://github.com/LedgerHQ/ledger-live/commit/949d5be90316148f38701a96dbc75d6a4bc020cc), [`2bdc741`](https://github.com/LedgerHQ/ledger-live/commit/2bdc741cf7ae42ca2a7d0eebbe9515d9fdd69603), [`cfe65ca`](https://github.com/LedgerHQ/ledger-live/commit/cfe65cafa268be4e53197ee163ce78f28ed72592), [`a9aacdb`](https://github.com/LedgerHQ/ledger-live/commit/a9aacdb330700f0a294833f7d77de17f179229b2), [`3979c07`](https://github.com/LedgerHQ/ledger-live/commit/3979c0715e4f54165c89d00ebe1441e064e1a110), [`0c7d867`](https://github.com/LedgerHQ/ledger-live/commit/0c7d8673ac49a90d0a491e7236731a74dcb4d7e1), [`e50f35a`](https://github.com/LedgerHQ/ledger-live/commit/e50f35a0c3b23c7176e465c1fafc0e3340f5527c), [`7c444b5`](https://github.com/LedgerHQ/ledger-live/commit/7c444b51db86ef6611931ce05a7613c4cb714b77), [`f1f3845`](https://github.com/LedgerHQ/ledger-live/commit/f1f3845942e4cbce9c585dc65f6170ddbc319f19), [`f83881e`](https://github.com/LedgerHQ/ledger-live/commit/f83881ea7b2da6ee04df3535b779d014fd5d9227), [`04fc7da`](https://github.com/LedgerHQ/ledger-live/commit/04fc7daed03fde65ac8c1ec4c0e28d784e16337a), [`9b7f62c`](https://github.com/LedgerHQ/ledger-live/commit/9b7f62c93fc74250f21c7102cf1c42a91f0f3644), [`53e4b19`](https://github.com/LedgerHQ/ledger-live/commit/53e4b19f556cbfd325816a70736552f09aa29df8), [`c6a676f`](https://github.com/LedgerHQ/ledger-live/commit/c6a676ff80581ac19b896adf44d54812983b72da), [`7556e73`](https://github.com/LedgerHQ/ledger-live/commit/7556e73e2ddc110d2c888fb25203689ee187e6af), [`b0454f6`](https://github.com/LedgerHQ/ledger-live/commit/b0454f6f94948530c169641b5a5845dd33886c96), [`7e0dfed`](https://github.com/LedgerHQ/ledger-live/commit/7e0dfedc7c06af31763bb7216cd89b94a395c304), [`b5fc1bd`](https://github.com/LedgerHQ/ledger-live/commit/b5fc1bd28fff091241905fec5ff8dc8af4c99b79), [`39866a1`](https://github.com/LedgerHQ/ledger-live/commit/39866a175244519013894ce816013fff1fc4d100), [`cc743a7`](https://github.com/LedgerHQ/ledger-live/commit/cc743a7c36c2a19c13497dd0e5e55f985448d053), [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b), [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33), [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6), [`8645f01`](https://github.com/LedgerHQ/ledger-live/commit/8645f016191d29a55f6b0ca6e4b1d1909fd35445), [`1d325fa`](https://github.com/LedgerHQ/ledger-live/commit/1d325fa224e341a44593e0a8424f8346dd2ec4c0), [`1d9860c`](https://github.com/LedgerHQ/ledger-live/commit/1d9860cd1688131d391579955b40c6710b667db8), [`73d673c`](https://github.com/LedgerHQ/ledger-live/commit/73d673cfd588a07a360df74553a879ba630c2250), [`c56dece`](https://github.com/LedgerHQ/ledger-live/commit/c56dece6b87835d55baf90277c9141d40df2d92a), [`8998d5f`](https://github.com/LedgerHQ/ledger-live/commit/8998d5f164092c17c409e65d0cf54f40728717ed), [`475296a`](https://github.com/LedgerHQ/ledger-live/commit/475296a4b0cc13a2c375f282e9d9b4b263fa8533), [`d2b12e7`](https://github.com/LedgerHQ/ledger-live/commit/d2b12e70bba9e772d078d1fe4d9c537b8d316a87), [`db25e21`](https://github.com/LedgerHQ/ledger-live/commit/db25e212b87dea426b153c6f1d988cead63c8c46), [`1587cf4`](https://github.com/LedgerHQ/ledger-live/commit/1587cf47cd9722b00cb3b51c898634e26f752487), [`f077f72`](https://github.com/LedgerHQ/ledger-live/commit/f077f7205667f4f7b82ae7584e80964c5ac7601a), [`c8dbf40`](https://github.com/LedgerHQ/ledger-live/commit/c8dbf402268359e225a94782420111e786f875fa), [`cab7d97`](https://github.com/LedgerHQ/ledger-live/commit/cab7d9794e7babb8220c6d339fb08e618e3d4202), [`86166a6`](https://github.com/LedgerHQ/ledger-live/commit/86166a6fe096d10f5e25fc323349348c2a243ae1), [`246b070`](https://github.com/LedgerHQ/ledger-live/commit/246b0701c1f375f3cdd847c5d2a8fe3c2060ef28)]:
  - @ledgerhq/live-common@34.51.0-next.0
  - @ledgerhq/cryptoassets@13.31.0-next.0
  - @ledgerhq/coin-evm@2.33.0-next.0
  - @ledgerhq/types-live@6.87.0-next.0
  - @ledgerhq/coin-framework@6.7.0-next.0
  - @ledgerhq/live-signer-evm@0.9.0-next.0
  - @ledgerhq/types-cryptoassets@7.29.0-next.0
  - @ledgerhq/coin-tester@0.10.1

## 1.8.1

### Patch Changes

- Updated dependencies [[`5d3b6c0`](https://github.com/LedgerHQ/ledger-live/commit/5d3b6c01904d50e700e480150b64e9c6d8bcbc98), [`1efc340`](https://github.com/LedgerHQ/ledger-live/commit/1efc340299242edd73512d1931976458fc6b8201), [`e04d493`](https://github.com/LedgerHQ/ledger-live/commit/e04d49340c65c8b4608a37bb726d21350fdd32f1), [`a37c06f`](https://github.com/LedgerHQ/ledger-live/commit/a37c06f97b061a5db0dad3632bb5c3e8f293677c), [`777bf68`](https://github.com/LedgerHQ/ledger-live/commit/777bf6884e89bcbec9523fe17a7bc94ec0e5e624), [`ab0e1bc`](https://github.com/LedgerHQ/ledger-live/commit/ab0e1bcc97b66b750b6c29e618eb03ce6f25bb7b), [`7ec652c`](https://github.com/LedgerHQ/ledger-live/commit/7ec652c31d8d634385919478386fe560a62be3a5), [`980450f`](https://github.com/LedgerHQ/ledger-live/commit/980450ff9e57e1a150e137c7dea39ce5bcb36549), [`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed), [`e3b568d`](https://github.com/LedgerHQ/ledger-live/commit/e3b568d2cbeee6dcf19a7047ce9fa11a04b0ae2a), [`0d368f0`](https://github.com/LedgerHQ/ledger-live/commit/0d368f0e682b3bd3daafa6af5b396648a95b1488), [`f015ef3`](https://github.com/LedgerHQ/ledger-live/commit/f015ef32660905d00f55a45f451f38bc12aec9ba), [`72e4a96`](https://github.com/LedgerHQ/ledger-live/commit/72e4a96f7d5b6ce224bd369508e2b5686c126e30), [`f4fa9d5`](https://github.com/LedgerHQ/ledger-live/commit/f4fa9d57e494db378bb00b114870b164a57c7039), [`fe1abf6`](https://github.com/LedgerHQ/ledger-live/commit/fe1abf640cc1a30b2e78bf7aa4a12e983a068f2e), [`321e514`](https://github.com/LedgerHQ/ledger-live/commit/321e5145e94a34c4a348855deb1acce14cb90b18), [`c1c2539`](https://github.com/LedgerHQ/ledger-live/commit/c1c25396cfc4dbcd742cd9872f7b837becb1dfef), [`e3bcefb`](https://github.com/LedgerHQ/ledger-live/commit/e3bcefbf8a46c91388d6f936fd31d6ffcdc24756), [`49a8534`](https://github.com/LedgerHQ/ledger-live/commit/49a85340a9c4e5dd8dd07db87028fe48f307d1f6), [`e56c3a8`](https://github.com/LedgerHQ/ledger-live/commit/e56c3a855d038cac74bdef225b9d057653c9ca18), [`42f2449`](https://github.com/LedgerHQ/ledger-live/commit/42f244956720dfe13cf16334ef79064f651c67d0)]:
  - @ledgerhq/live-common@34.50.0
  - @ledgerhq/types-live@6.86.0
  - @ledgerhq/cryptoassets@13.30.0
  - @ledgerhq/types-cryptoassets@7.28.0
  - @ledgerhq/coin-evm@2.32.0
  - @ledgerhq/coin-framework@6.6.0
  - @ledgerhq/coin-tester@0.10.1
  - @ledgerhq/live-signer-evm@0.8.1

## 1.8.1-next.0

### Patch Changes

- Updated dependencies [[`5d3b6c0`](https://github.com/LedgerHQ/ledger-live/commit/5d3b6c01904d50e700e480150b64e9c6d8bcbc98), [`1efc340`](https://github.com/LedgerHQ/ledger-live/commit/1efc340299242edd73512d1931976458fc6b8201), [`e04d493`](https://github.com/LedgerHQ/ledger-live/commit/e04d49340c65c8b4608a37bb726d21350fdd32f1), [`a37c06f`](https://github.com/LedgerHQ/ledger-live/commit/a37c06f97b061a5db0dad3632bb5c3e8f293677c), [`777bf68`](https://github.com/LedgerHQ/ledger-live/commit/777bf6884e89bcbec9523fe17a7bc94ec0e5e624), [`ab0e1bc`](https://github.com/LedgerHQ/ledger-live/commit/ab0e1bcc97b66b750b6c29e618eb03ce6f25bb7b), [`7ec652c`](https://github.com/LedgerHQ/ledger-live/commit/7ec652c31d8d634385919478386fe560a62be3a5), [`980450f`](https://github.com/LedgerHQ/ledger-live/commit/980450ff9e57e1a150e137c7dea39ce5bcb36549), [`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed), [`e3b568d`](https://github.com/LedgerHQ/ledger-live/commit/e3b568d2cbeee6dcf19a7047ce9fa11a04b0ae2a), [`0d368f0`](https://github.com/LedgerHQ/ledger-live/commit/0d368f0e682b3bd3daafa6af5b396648a95b1488), [`f015ef3`](https://github.com/LedgerHQ/ledger-live/commit/f015ef32660905d00f55a45f451f38bc12aec9ba), [`72e4a96`](https://github.com/LedgerHQ/ledger-live/commit/72e4a96f7d5b6ce224bd369508e2b5686c126e30), [`f4fa9d5`](https://github.com/LedgerHQ/ledger-live/commit/f4fa9d57e494db378bb00b114870b164a57c7039), [`fe1abf6`](https://github.com/LedgerHQ/ledger-live/commit/fe1abf640cc1a30b2e78bf7aa4a12e983a068f2e), [`321e514`](https://github.com/LedgerHQ/ledger-live/commit/321e5145e94a34c4a348855deb1acce14cb90b18), [`c1c2539`](https://github.com/LedgerHQ/ledger-live/commit/c1c25396cfc4dbcd742cd9872f7b837becb1dfef), [`e3bcefb`](https://github.com/LedgerHQ/ledger-live/commit/e3bcefbf8a46c91388d6f936fd31d6ffcdc24756), [`49a8534`](https://github.com/LedgerHQ/ledger-live/commit/49a85340a9c4e5dd8dd07db87028fe48f307d1f6), [`e56c3a8`](https://github.com/LedgerHQ/ledger-live/commit/e56c3a855d038cac74bdef225b9d057653c9ca18), [`42f2449`](https://github.com/LedgerHQ/ledger-live/commit/42f244956720dfe13cf16334ef79064f651c67d0), [`77ffab2`](https://github.com/LedgerHQ/ledger-live/commit/77ffab2f5d08fb45449b6b8316b0947dd46286b1)]:
  - @ledgerhq/live-common@34.50.0-next.0
  - @ledgerhq/types-live@6.86.0-next.0
  - @ledgerhq/cryptoassets@13.30.0-next.0
  - @ledgerhq/types-cryptoassets@7.28.0-next.0
  - @ledgerhq/coin-evm@2.32.0-next.0
  - @ledgerhq/coin-framework@6.6.0-next.0
  - @ledgerhq/coin-tester@0.10.1-next.0
  - @ledgerhq/live-signer-evm@0.8.1-next.0

## 1.8.0

### Minor Changes

- [#11677](https://github.com/LedgerHQ/ledger-live/pull/11677) [`f8092e3`](https://github.com/LedgerHQ/ledger-live/commit/f8092e3b3b5df2e4a7b8ba9f83d393701854d7f7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-tester-evm): support the generic adapter

### Patch Changes

- Updated dependencies [[`d93c0aa`](https://github.com/LedgerHQ/ledger-live/commit/d93c0aab902bfba5b36ebdf707e88b5d3453dacb), [`289f623`](https://github.com/LedgerHQ/ledger-live/commit/289f623c2b9055a596647676499cd3c8b34117fa), [`2444623`](https://github.com/LedgerHQ/ledger-live/commit/244462341ee0d2d85a2e1370624500e565cb030a), [`aee931f`](https://github.com/LedgerHQ/ledger-live/commit/aee931fdc9d6028ddfcaea014b033822e178d7a0), [`e70a351`](https://github.com/LedgerHQ/ledger-live/commit/e70a351dc3298c59301cfff1939c7e3d16efa880), [`1d06127`](https://github.com/LedgerHQ/ledger-live/commit/1d06127d433c5e61482c1b49cca3c15aa6662499), [`9b8689a`](https://github.com/LedgerHQ/ledger-live/commit/9b8689ae2c44bdeccae26378e05cbf6899b83aec), [`e6de5d9`](https://github.com/LedgerHQ/ledger-live/commit/e6de5d906be3e33a1c62b6f80985eca53fae94f0), [`d56bebe`](https://github.com/LedgerHQ/ledger-live/commit/d56bebe672a1ed825697b371662dbff19dcc63d8), [`2d747cf`](https://github.com/LedgerHQ/ledger-live/commit/2d747cf63f120a6634c2e2adbe60c4e94d37fc71), [`c8fe586`](https://github.com/LedgerHQ/ledger-live/commit/c8fe586f1427d4d7a9fad092b51221ec8221399d), [`3840b29`](https://github.com/LedgerHQ/ledger-live/commit/3840b295fe6bef518b506c3d1d68f62d0137df22), [`af64263`](https://github.com/LedgerHQ/ledger-live/commit/af642634bd4536183f766323d0ec5b9b99841dc6), [`0108eaf`](https://github.com/LedgerHQ/ledger-live/commit/0108eafb64e36ce68f44e03cc3f66ccdb5ee5a92), [`65c128a`](https://github.com/LedgerHQ/ledger-live/commit/65c128a93f07857b421bed3696bc9984f860ada9), [`3b5576e`](https://github.com/LedgerHQ/ledger-live/commit/3b5576e0b67fedad0f5dbbd6b9546281af4e6111), [`6941aac`](https://github.com/LedgerHQ/ledger-live/commit/6941aac638dcc8d4fb03aa92f42d2a71d4089202), [`3c19e0d`](https://github.com/LedgerHQ/ledger-live/commit/3c19e0d23812b99ec709603493691c10170d1b42), [`f8092e3`](https://github.com/LedgerHQ/ledger-live/commit/f8092e3b3b5df2e4a7b8ba9f83d393701854d7f7), [`7d23713`](https://github.com/LedgerHQ/ledger-live/commit/7d23713789ff91bd93d0cdba7dbed27e4efec6ce), [`f671769`](https://github.com/LedgerHQ/ledger-live/commit/f6717696fcb2ad672a48fdd7f8654dedf11b4a65), [`c40c867`](https://github.com/LedgerHQ/ledger-live/commit/c40c867c790107270a7db63eeacdddc67dd22769), [`2a3a861`](https://github.com/LedgerHQ/ledger-live/commit/2a3a861cbd6530f863824d0bab8ba8a170211e34), [`13ac4d7`](https://github.com/LedgerHQ/ledger-live/commit/13ac4d7ed05f0fc448cc0a013688c917cb73e0f5), [`1c4bcb9`](https://github.com/LedgerHQ/ledger-live/commit/1c4bcb9e9082dedb37598b2b0a35be0665e80d20), [`6847918`](https://github.com/LedgerHQ/ledger-live/commit/6847918323d59e7ec089b8c70bef7f2d768a41c9), [`ed4c073`](https://github.com/LedgerHQ/ledger-live/commit/ed4c073b304d85355cf510551bcb225de4a3391c), [`f55291b`](https://github.com/LedgerHQ/ledger-live/commit/f55291b02f6a603e37eae2aee0c569e434982c21)]:
  - @ledgerhq/live-common@34.49.0
  - @ledgerhq/live-signer-evm@0.8.0
  - @ledgerhq/coin-evm@2.31.0
  - @ledgerhq/types-live@6.85.0
  - @ledgerhq/types-cryptoassets@7.27.0
  - @ledgerhq/cryptoassets@13.29.0
  - @ledgerhq/coin-framework@6.5.0
  - @ledgerhq/coin-tester@0.10.0

## 1.8.0-next.2

### Patch Changes

- Updated dependencies [[`1c4bcb9`](https://github.com/LedgerHQ/ledger-live/commit/1c4bcb9e9082dedb37598b2b0a35be0665e80d20)]:
  - @ledgerhq/live-common@34.49.0-next.2

## 1.8.0-next.1

### Patch Changes

- Updated dependencies [[`c40c867`](https://github.com/LedgerHQ/ledger-live/commit/c40c867c790107270a7db63eeacdddc67dd22769)]:
  - @ledgerhq/coin-evm@2.31.0-next.1
  - @ledgerhq/live-common@34.49.0-next.1
  - @ledgerhq/live-signer-evm@0.8.0-next.1

## 1.8.0-next.0

### Minor Changes

- [#11677](https://github.com/LedgerHQ/ledger-live/pull/11677) [`f8092e3`](https://github.com/LedgerHQ/ledger-live/commit/f8092e3b3b5df2e4a7b8ba9f83d393701854d7f7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-tester-evm): support the generic adapter

### Patch Changes

- Updated dependencies [[`d93c0aa`](https://github.com/LedgerHQ/ledger-live/commit/d93c0aab902bfba5b36ebdf707e88b5d3453dacb), [`289f623`](https://github.com/LedgerHQ/ledger-live/commit/289f623c2b9055a596647676499cd3c8b34117fa), [`2444623`](https://github.com/LedgerHQ/ledger-live/commit/244462341ee0d2d85a2e1370624500e565cb030a), [`aee931f`](https://github.com/LedgerHQ/ledger-live/commit/aee931fdc9d6028ddfcaea014b033822e178d7a0), [`e70a351`](https://github.com/LedgerHQ/ledger-live/commit/e70a351dc3298c59301cfff1939c7e3d16efa880), [`1d06127`](https://github.com/LedgerHQ/ledger-live/commit/1d06127d433c5e61482c1b49cca3c15aa6662499), [`9b8689a`](https://github.com/LedgerHQ/ledger-live/commit/9b8689ae2c44bdeccae26378e05cbf6899b83aec), [`e6de5d9`](https://github.com/LedgerHQ/ledger-live/commit/e6de5d906be3e33a1c62b6f80985eca53fae94f0), [`d56bebe`](https://github.com/LedgerHQ/ledger-live/commit/d56bebe672a1ed825697b371662dbff19dcc63d8), [`2d747cf`](https://github.com/LedgerHQ/ledger-live/commit/2d747cf63f120a6634c2e2adbe60c4e94d37fc71), [`c8fe586`](https://github.com/LedgerHQ/ledger-live/commit/c8fe586f1427d4d7a9fad092b51221ec8221399d), [`3840b29`](https://github.com/LedgerHQ/ledger-live/commit/3840b295fe6bef518b506c3d1d68f62d0137df22), [`af64263`](https://github.com/LedgerHQ/ledger-live/commit/af642634bd4536183f766323d0ec5b9b99841dc6), [`0108eaf`](https://github.com/LedgerHQ/ledger-live/commit/0108eafb64e36ce68f44e03cc3f66ccdb5ee5a92), [`65c128a`](https://github.com/LedgerHQ/ledger-live/commit/65c128a93f07857b421bed3696bc9984f860ada9), [`3b5576e`](https://github.com/LedgerHQ/ledger-live/commit/3b5576e0b67fedad0f5dbbd6b9546281af4e6111), [`6941aac`](https://github.com/LedgerHQ/ledger-live/commit/6941aac638dcc8d4fb03aa92f42d2a71d4089202), [`3c19e0d`](https://github.com/LedgerHQ/ledger-live/commit/3c19e0d23812b99ec709603493691c10170d1b42), [`f8092e3`](https://github.com/LedgerHQ/ledger-live/commit/f8092e3b3b5df2e4a7b8ba9f83d393701854d7f7), [`7d23713`](https://github.com/LedgerHQ/ledger-live/commit/7d23713789ff91bd93d0cdba7dbed27e4efec6ce), [`f671769`](https://github.com/LedgerHQ/ledger-live/commit/f6717696fcb2ad672a48fdd7f8654dedf11b4a65), [`2a3a861`](https://github.com/LedgerHQ/ledger-live/commit/2a3a861cbd6530f863824d0bab8ba8a170211e34), [`13ac4d7`](https://github.com/LedgerHQ/ledger-live/commit/13ac4d7ed05f0fc448cc0a013688c917cb73e0f5), [`6847918`](https://github.com/LedgerHQ/ledger-live/commit/6847918323d59e7ec089b8c70bef7f2d768a41c9), [`ed4c073`](https://github.com/LedgerHQ/ledger-live/commit/ed4c073b304d85355cf510551bcb225de4a3391c), [`f55291b`](https://github.com/LedgerHQ/ledger-live/commit/f55291b02f6a603e37eae2aee0c569e434982c21)]:
  - @ledgerhq/live-common@34.49.0-next.0
  - @ledgerhq/live-signer-evm@0.8.0-next.0
  - @ledgerhq/coin-evm@2.31.0-next.0
  - @ledgerhq/types-live@6.85.0-next.0
  - @ledgerhq/types-cryptoassets@7.27.0-next.0
  - @ledgerhq/cryptoassets@13.29.0-next.0
  - @ledgerhq/coin-framework@6.5.0-next.0
  - @ledgerhq/coin-tester@0.10.0-next.0

## 1.7.1

### Patch Changes

- Updated dependencies [[`ef18dc8`](https://github.com/LedgerHQ/ledger-live/commit/ef18dc8dff93b13ab7879fbe9666f68ee66a8466)]:
  - @ledgerhq/live-common@34.48.1

## 1.7.1-hotfix.0

### Patch Changes

- Updated dependencies [[`ef18dc8`](https://github.com/LedgerHQ/ledger-live/commit/ef18dc8dff93b13ab7879fbe9666f68ee66a8466)]:
  - @ledgerhq/live-common@34.48.1-hotfix.0

## 1.7.0

### Minor Changes

- [#11582](https://github.com/LedgerHQ/ledger-live/pull/11582) [`776fae2`](https://github.com/LedgerHQ/ledger-live/commit/776fae24bf98f4695ea729885259e6b1b0a2fc14) Thanks [@qperrot](https://github.com/qperrot)! - Update ethers library to v6.15.0

### Patch Changes

- Updated dependencies [[`284a2c7`](https://github.com/LedgerHQ/ledger-live/commit/284a2c7f571c8d8e622ba60bef24d186ce42605d), [`9d3eef6`](https://github.com/LedgerHQ/ledger-live/commit/9d3eef600242c6be51c4dd844dffe06150e9f0c4), [`c1209a7`](https://github.com/LedgerHQ/ledger-live/commit/c1209a70f6362fe8a52139ad5ad0b4705aac00fb), [`64b059c`](https://github.com/LedgerHQ/ledger-live/commit/64b059cc514e199320b0e668dfed647ac2b658a9), [`776fae2`](https://github.com/LedgerHQ/ledger-live/commit/776fae24bf98f4695ea729885259e6b1b0a2fc14), [`2b896f9`](https://github.com/LedgerHQ/ledger-live/commit/2b896f94d6fc53ef965ed567489ad96d913466d4), [`2b6fe2f`](https://github.com/LedgerHQ/ledger-live/commit/2b6fe2f1d068940aab624da7c8454b98bffbca3b), [`338d979`](https://github.com/LedgerHQ/ledger-live/commit/338d979bae349b185c52b1d8c9f6718a3d142526), [`58ef394`](https://github.com/LedgerHQ/ledger-live/commit/58ef39468870e56745a3a4bc95a1292a1e1f64ca), [`e3464bb`](https://github.com/LedgerHQ/ledger-live/commit/e3464bbaa0868537d8bd817152d4aaea4d99e4b2), [`2482195`](https://github.com/LedgerHQ/ledger-live/commit/24821957c838a304be60ff6e16798ef3cac987cd), [`228ed30`](https://github.com/LedgerHQ/ledger-live/commit/228ed3030601644e807e85a1693276b788b5cd2a), [`0051b62`](https://github.com/LedgerHQ/ledger-live/commit/0051b62ca8f7ddddc0bdc316a8734362aacfbb58), [`89fc31e`](https://github.com/LedgerHQ/ledger-live/commit/89fc31e8ecfc5e2fd679a2694b3514f8fb19d7b7), [`5336021`](https://github.com/LedgerHQ/ledger-live/commit/53360213fe1545cfac761d872c0bd7a592697279), [`6a1e8fe`](https://github.com/LedgerHQ/ledger-live/commit/6a1e8febd56e291559308eaad3d6562efe4b3ff1), [`ff22728`](https://github.com/LedgerHQ/ledger-live/commit/ff22728a61ab2cde6835991bf8ed115d4a39a1d0), [`6ebe1f9`](https://github.com/LedgerHQ/ledger-live/commit/6ebe1f9e8e565e91afbb7c9db943c98425aaa311), [`c190e2b`](https://github.com/LedgerHQ/ledger-live/commit/c190e2b104a9dd0dd693c2d72433b98115f4089f), [`0432d2a`](https://github.com/LedgerHQ/ledger-live/commit/0432d2aca30d74eb00abdc8427c4c34725f34b13), [`5e43b9f`](https://github.com/LedgerHQ/ledger-live/commit/5e43b9fab2c895e145bdddbf180fbf985e429f7b), [`a87922d`](https://github.com/LedgerHQ/ledger-live/commit/a87922dc99e4f2e4b40a46fd52ad08a71012fe94), [`b34a43c`](https://github.com/LedgerHQ/ledger-live/commit/b34a43c290929ccab9380c2c2853bd320d4630b9), [`25d8fdd`](https://github.com/LedgerHQ/ledger-live/commit/25d8fdde989e1a1c0cc6f16052c322d4e9d46d1f), [`c852de4`](https://github.com/LedgerHQ/ledger-live/commit/c852de40f63948ded6fb0abe6fc8104408391c5b), [`222bd7b`](https://github.com/LedgerHQ/ledger-live/commit/222bd7b69d32fd93562e9cb4bc1cf2840d0a0620), [`80a109a`](https://github.com/LedgerHQ/ledger-live/commit/80a109a5f8ecdbb22cf6fb3ec084398a7e54dcfb), [`4835688`](https://github.com/LedgerHQ/ledger-live/commit/48356882efadc15ed59f608e01b44cdcbc6637fb), [`d21e94b`](https://github.com/LedgerHQ/ledger-live/commit/d21e94b26c6084cd8dec614c7059673784d8faad), [`3489203`](https://github.com/LedgerHQ/ledger-live/commit/34892030dcfbd1a19a0eb0a8fcae9f8f01d3d2a9)]:
  - @ledgerhq/live-common@34.48.0
  - @ledgerhq/coin-evm@2.30.0
  - @ledgerhq/coin-framework@6.4.0
  - @ledgerhq/cryptoassets@13.28.0
  - @ledgerhq/types-live@6.84.0
  - @ledgerhq/coin-tester@0.9.3
  - @ledgerhq/live-signer-evm@0.7.5

## 1.7.0-next.0

### Minor Changes

- [#11582](https://github.com/LedgerHQ/ledger-live/pull/11582) [`776fae2`](https://github.com/LedgerHQ/ledger-live/commit/776fae24bf98f4695ea729885259e6b1b0a2fc14) Thanks [@qperrot](https://github.com/qperrot)! - Update ethers library to v6.15.0

### Patch Changes

- Updated dependencies [[`284a2c7`](https://github.com/LedgerHQ/ledger-live/commit/284a2c7f571c8d8e622ba60bef24d186ce42605d), [`9d3eef6`](https://github.com/LedgerHQ/ledger-live/commit/9d3eef600242c6be51c4dd844dffe06150e9f0c4), [`c1209a7`](https://github.com/LedgerHQ/ledger-live/commit/c1209a70f6362fe8a52139ad5ad0b4705aac00fb), [`64b059c`](https://github.com/LedgerHQ/ledger-live/commit/64b059cc514e199320b0e668dfed647ac2b658a9), [`776fae2`](https://github.com/LedgerHQ/ledger-live/commit/776fae24bf98f4695ea729885259e6b1b0a2fc14), [`2b896f9`](https://github.com/LedgerHQ/ledger-live/commit/2b896f94d6fc53ef965ed567489ad96d913466d4), [`2b6fe2f`](https://github.com/LedgerHQ/ledger-live/commit/2b6fe2f1d068940aab624da7c8454b98bffbca3b), [`338d979`](https://github.com/LedgerHQ/ledger-live/commit/338d979bae349b185c52b1d8c9f6718a3d142526), [`58ef394`](https://github.com/LedgerHQ/ledger-live/commit/58ef39468870e56745a3a4bc95a1292a1e1f64ca), [`e3464bb`](https://github.com/LedgerHQ/ledger-live/commit/e3464bbaa0868537d8bd817152d4aaea4d99e4b2), [`2482195`](https://github.com/LedgerHQ/ledger-live/commit/24821957c838a304be60ff6e16798ef3cac987cd), [`228ed30`](https://github.com/LedgerHQ/ledger-live/commit/228ed3030601644e807e85a1693276b788b5cd2a), [`0051b62`](https://github.com/LedgerHQ/ledger-live/commit/0051b62ca8f7ddddc0bdc316a8734362aacfbb58), [`89fc31e`](https://github.com/LedgerHQ/ledger-live/commit/89fc31e8ecfc5e2fd679a2694b3514f8fb19d7b7), [`5336021`](https://github.com/LedgerHQ/ledger-live/commit/53360213fe1545cfac761d872c0bd7a592697279), [`6a1e8fe`](https://github.com/LedgerHQ/ledger-live/commit/6a1e8febd56e291559308eaad3d6562efe4b3ff1), [`ff22728`](https://github.com/LedgerHQ/ledger-live/commit/ff22728a61ab2cde6835991bf8ed115d4a39a1d0), [`6ebe1f9`](https://github.com/LedgerHQ/ledger-live/commit/6ebe1f9e8e565e91afbb7c9db943c98425aaa311), [`c190e2b`](https://github.com/LedgerHQ/ledger-live/commit/c190e2b104a9dd0dd693c2d72433b98115f4089f), [`0432d2a`](https://github.com/LedgerHQ/ledger-live/commit/0432d2aca30d74eb00abdc8427c4c34725f34b13), [`5e43b9f`](https://github.com/LedgerHQ/ledger-live/commit/5e43b9fab2c895e145bdddbf180fbf985e429f7b), [`a87922d`](https://github.com/LedgerHQ/ledger-live/commit/a87922dc99e4f2e4b40a46fd52ad08a71012fe94), [`b34a43c`](https://github.com/LedgerHQ/ledger-live/commit/b34a43c290929ccab9380c2c2853bd320d4630b9), [`25d8fdd`](https://github.com/LedgerHQ/ledger-live/commit/25d8fdde989e1a1c0cc6f16052c322d4e9d46d1f), [`c852de4`](https://github.com/LedgerHQ/ledger-live/commit/c852de40f63948ded6fb0abe6fc8104408391c5b), [`222bd7b`](https://github.com/LedgerHQ/ledger-live/commit/222bd7b69d32fd93562e9cb4bc1cf2840d0a0620), [`80a109a`](https://github.com/LedgerHQ/ledger-live/commit/80a109a5f8ecdbb22cf6fb3ec084398a7e54dcfb), [`4835688`](https://github.com/LedgerHQ/ledger-live/commit/48356882efadc15ed59f608e01b44cdcbc6637fb), [`d21e94b`](https://github.com/LedgerHQ/ledger-live/commit/d21e94b26c6084cd8dec614c7059673784d8faad), [`3489203`](https://github.com/LedgerHQ/ledger-live/commit/34892030dcfbd1a19a0eb0a8fcae9f8f01d3d2a9)]:
  - @ledgerhq/live-common@34.48.0-next.0
  - @ledgerhq/coin-evm@2.30.0-next.0
  - @ledgerhq/coin-framework@6.4.0-next.0
  - @ledgerhq/cryptoassets@13.28.0-next.0
  - @ledgerhq/types-live@6.84.0-next.0
  - @ledgerhq/coin-tester@0.9.3-next.0
  - @ledgerhq/live-signer-evm@0.7.5-next.0

## 1.6.0

### Minor Changes

- [#11313](https://github.com/LedgerHQ/ledger-live/pull/11313) [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Update EVM createBridge function signature for CAL lazy loading

### Patch Changes

- Updated dependencies [[`12277dc`](https://github.com/LedgerHQ/ledger-live/commit/12277dcb478f24152060e3e11e2eb37d650b5b60), [`212f772`](https://github.com/LedgerHQ/ledger-live/commit/212f772b17dc3db97009ebe62912f8f183c1ef2e), [`acdc089`](https://github.com/LedgerHQ/ledger-live/commit/acdc089f934461dd2fdfdfd61aa907f1520a5d7b), [`a9a0c18`](https://github.com/LedgerHQ/ledger-live/commit/a9a0c18d91cac8d4bb805d558d3d0bd50337d98a), [`64dcecb`](https://github.com/LedgerHQ/ledger-live/commit/64dcecb1a971fc250e80344ba6d42b815ddd18c9), [`9fcc4eb`](https://github.com/LedgerHQ/ledger-live/commit/9fcc4eb5cd6e96e772daa154bd87ae374f925ddc), [`a6a97f1`](https://github.com/LedgerHQ/ledger-live/commit/a6a97f1daeaf3d90e69fe12d23d59cf4d4c7d78b), [`e9fa7aa`](https://github.com/LedgerHQ/ledger-live/commit/e9fa7aa8c8d0414416ec7c12acf30b7623b2eda3), [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f), [`b6af1d7`](https://github.com/LedgerHQ/ledger-live/commit/b6af1d7d4bc8aba35497242f6863620c7080162c), [`2834ca4`](https://github.com/LedgerHQ/ledger-live/commit/2834ca443fe9071979d3b506e4ca4fbc17aeca7b), [`e8899f0`](https://github.com/LedgerHQ/ledger-live/commit/e8899f0dac12c6ca9c655c121eeb907f6bbad844), [`8936f39`](https://github.com/LedgerHQ/ledger-live/commit/8936f390edbe9cbc36ac6590b01562daf5c580e1), [`2a4070b`](https://github.com/LedgerHQ/ledger-live/commit/2a4070b594271007fa47dc7451b612008a233006), [`23cd759`](https://github.com/LedgerHQ/ledger-live/commit/23cd7596d34692e5ca75b1aebaedb7c8d5f34927), [`0356d19`](https://github.com/LedgerHQ/ledger-live/commit/0356d1904dbb5e856970fa7e7ebb206eed7b4c5d), [`516176d`](https://github.com/LedgerHQ/ledger-live/commit/516176d18c7f53961799e92e8804c4a756684266), [`bc8932d`](https://github.com/LedgerHQ/ledger-live/commit/bc8932d4c906f2aca99eacc5af89016d4784e6b8), [`c5bb247`](https://github.com/LedgerHQ/ledger-live/commit/c5bb24705c4463eeb519adc79b3b3dfb03ed4487)]:
  - @ledgerhq/types-cryptoassets@7.26.0
  - @ledgerhq/cryptoassets@13.27.0
  - @ledgerhq/live-common@34.47.0
  - @ledgerhq/coin-evm@2.29.0
  - @ledgerhq/coin-framework@6.3.0
  - @ledgerhq/types-live@6.83.0
  - @ledgerhq/live-config@3.2.0
  - @ledgerhq/coin-tester@0.9.2
  - @ledgerhq/live-signer-evm@0.7.4

## 1.6.0-next.0

### Minor Changes

- [#11313](https://github.com/LedgerHQ/ledger-live/pull/11313) [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Update EVM createBridge function signature for CAL lazy loading

### Patch Changes

- Updated dependencies [[`12277dc`](https://github.com/LedgerHQ/ledger-live/commit/12277dcb478f24152060e3e11e2eb37d650b5b60), [`212f772`](https://github.com/LedgerHQ/ledger-live/commit/212f772b17dc3db97009ebe62912f8f183c1ef2e), [`acdc089`](https://github.com/LedgerHQ/ledger-live/commit/acdc089f934461dd2fdfdfd61aa907f1520a5d7b), [`a9a0c18`](https://github.com/LedgerHQ/ledger-live/commit/a9a0c18d91cac8d4bb805d558d3d0bd50337d98a), [`64dcecb`](https://github.com/LedgerHQ/ledger-live/commit/64dcecb1a971fc250e80344ba6d42b815ddd18c9), [`9fcc4eb`](https://github.com/LedgerHQ/ledger-live/commit/9fcc4eb5cd6e96e772daa154bd87ae374f925ddc), [`a6a97f1`](https://github.com/LedgerHQ/ledger-live/commit/a6a97f1daeaf3d90e69fe12d23d59cf4d4c7d78b), [`e9fa7aa`](https://github.com/LedgerHQ/ledger-live/commit/e9fa7aa8c8d0414416ec7c12acf30b7623b2eda3), [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f), [`b6af1d7`](https://github.com/LedgerHQ/ledger-live/commit/b6af1d7d4bc8aba35497242f6863620c7080162c), [`2834ca4`](https://github.com/LedgerHQ/ledger-live/commit/2834ca443fe9071979d3b506e4ca4fbc17aeca7b), [`e8899f0`](https://github.com/LedgerHQ/ledger-live/commit/e8899f0dac12c6ca9c655c121eeb907f6bbad844), [`8936f39`](https://github.com/LedgerHQ/ledger-live/commit/8936f390edbe9cbc36ac6590b01562daf5c580e1), [`2a4070b`](https://github.com/LedgerHQ/ledger-live/commit/2a4070b594271007fa47dc7451b612008a233006), [`23cd759`](https://github.com/LedgerHQ/ledger-live/commit/23cd7596d34692e5ca75b1aebaedb7c8d5f34927), [`0356d19`](https://github.com/LedgerHQ/ledger-live/commit/0356d1904dbb5e856970fa7e7ebb206eed7b4c5d), [`516176d`](https://github.com/LedgerHQ/ledger-live/commit/516176d18c7f53961799e92e8804c4a756684266), [`bc8932d`](https://github.com/LedgerHQ/ledger-live/commit/bc8932d4c906f2aca99eacc5af89016d4784e6b8), [`c5bb247`](https://github.com/LedgerHQ/ledger-live/commit/c5bb24705c4463eeb519adc79b3b3dfb03ed4487)]:
  - @ledgerhq/types-cryptoassets@7.26.0-next.0
  - @ledgerhq/cryptoassets@13.27.0-next.0
  - @ledgerhq/live-common@34.47.0-next.0
  - @ledgerhq/coin-evm@2.29.0-next.0
  - @ledgerhq/coin-framework@6.3.0-next.0
  - @ledgerhq/types-live@6.83.0-next.0
  - @ledgerhq/live-config@3.2.0-next.0
  - @ledgerhq/coin-tester@0.9.2-next.0
  - @ledgerhq/live-signer-evm@0.7.2-next.0

## 1.5.3

### Patch Changes

- Updated dependencies [[`458f80d`](https://github.com/LedgerHQ/ledger-live/commit/458f80d2d8cf202bde2feb35239a35299e48fa7c)]:
  - @ledgerhq/live-common@34.46.2
  - @ledgerhq/live-signer-evm@0.7.3

## 1.5.3-hotfix.0

### Patch Changes

- Updated dependencies [[`458f80d`](https://github.com/LedgerHQ/ledger-live/commit/458f80d2d8cf202bde2feb35239a35299e48fa7c)]:
  - @ledgerhq/live-common@34.46.2-hotfix.0
  - @ledgerhq/live-signer-evm@0.7.3-hotfix.0

## 1.5.2

### Patch Changes

- Updated dependencies [[`9f9c22a`](https://github.com/LedgerHQ/ledger-live/commit/9f9c22a72e3cbdbcb641f9a2fd771a4e9ad3f87b)]:
  - @ledgerhq/live-signer-evm@0.7.2
  - @ledgerhq/live-common@34.46.1

## 1.5.2-hotfix.0

### Patch Changes

- Updated dependencies [[`9f9c22a`](https://github.com/LedgerHQ/ledger-live/commit/9f9c22a72e3cbdbcb641f9a2fd771a4e9ad3f87b)]:
  - @ledgerhq/live-signer-evm@0.7.2-hotfix.0
  - @ledgerhq/live-common@34.46.1-hotfix.0

## 1.5.1

### Patch Changes

- Updated dependencies [[`589e0e6`](https://github.com/LedgerHQ/ledger-live/commit/589e0e62092359f48b2a7d22d1d8ecf363ac04b1), [`1f1cbeb`](https://github.com/LedgerHQ/ledger-live/commit/1f1cbeb4485fb4b85b76ffe040c632d049f4e0c4), [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199), [`d41fc9c`](https://github.com/LedgerHQ/ledger-live/commit/d41fc9c458050ef1234c04af9642321c41cecda1), [`fabdc2d`](https://github.com/LedgerHQ/ledger-live/commit/fabdc2d34fc43302fc31514073fcc74e83d0ee93), [`2fb3986`](https://github.com/LedgerHQ/ledger-live/commit/2fb3986b56c80c331fef5ddf3e1b5988a3245b07), [`d41fc9c`](https://github.com/LedgerHQ/ledger-live/commit/d41fc9c458050ef1234c04af9642321c41cecda1), [`67ec10b`](https://github.com/LedgerHQ/ledger-live/commit/67ec10b773b4a6b512a8a6485940fa0abd41c3ef), [`15c776d`](https://github.com/LedgerHQ/ledger-live/commit/15c776d5d12b275abf09c04d532f350959ef4856), [`a3fcd55`](https://github.com/LedgerHQ/ledger-live/commit/a3fcd55fdea8c6ffbbb818825382cc96637fe8f5), [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199), [`31dceca`](https://github.com/LedgerHQ/ledger-live/commit/31dcecad24abdaa8a77208e82532c47728c11180)]:
  - @ledgerhq/coin-evm@2.28.0
  - @ledgerhq/cryptoassets@13.26.0
  - @ledgerhq/live-common@34.46.0
  - @ledgerhq/coin-framework@6.2.0
  - @ledgerhq/types-live@6.82.0
  - @ledgerhq/live-signer-evm@0.7.1
  - @ledgerhq/coin-tester@0.9.1

## 1.5.1-next.0

### Patch Changes

- Updated dependencies [[`589e0e6`](https://github.com/LedgerHQ/ledger-live/commit/589e0e62092359f48b2a7d22d1d8ecf363ac04b1), [`1f1cbeb`](https://github.com/LedgerHQ/ledger-live/commit/1f1cbeb4485fb4b85b76ffe040c632d049f4e0c4), [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199), [`d41fc9c`](https://github.com/LedgerHQ/ledger-live/commit/d41fc9c458050ef1234c04af9642321c41cecda1), [`fabdc2d`](https://github.com/LedgerHQ/ledger-live/commit/fabdc2d34fc43302fc31514073fcc74e83d0ee93), [`2fb3986`](https://github.com/LedgerHQ/ledger-live/commit/2fb3986b56c80c331fef5ddf3e1b5988a3245b07), [`d41fc9c`](https://github.com/LedgerHQ/ledger-live/commit/d41fc9c458050ef1234c04af9642321c41cecda1), [`67ec10b`](https://github.com/LedgerHQ/ledger-live/commit/67ec10b773b4a6b512a8a6485940fa0abd41c3ef), [`15c776d`](https://github.com/LedgerHQ/ledger-live/commit/15c776d5d12b275abf09c04d532f350959ef4856), [`a3fcd55`](https://github.com/LedgerHQ/ledger-live/commit/a3fcd55fdea8c6ffbbb818825382cc96637fe8f5), [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199), [`31dceca`](https://github.com/LedgerHQ/ledger-live/commit/31dcecad24abdaa8a77208e82532c47728c11180)]:
  - @ledgerhq/coin-evm@2.28.0-next.0
  - @ledgerhq/cryptoassets@13.26.0-next.0
  - @ledgerhq/live-common@34.46.0-next.0
  - @ledgerhq/coin-framework@6.2.0-next.0
  - @ledgerhq/types-live@6.82.0-next.0
  - @ledgerhq/live-signer-evm@0.7.1-next.0
  - @ledgerhq/coin-tester@0.9.1-next.0

## 1.5.0

### Minor Changes

- [#11223](https://github.com/LedgerHQ/ledger-live/pull/11223) [`9868c13`](https://github.com/LedgerHQ/ledger-live/commit/9868c1358cb80de41a70e876ab2285fb8102e9a6) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-tester-evm): adapt for generic adapter

### Patch Changes

- Updated dependencies [[`f5f652e`](https://github.com/LedgerHQ/ledger-live/commit/f5f652e308477ff38176e5782eaf0e1bb96956ba), [`0c8486e`](https://github.com/LedgerHQ/ledger-live/commit/0c8486ea830e9e2abf1dfc5d108117e1db733072), [`4cc85de`](https://github.com/LedgerHQ/ledger-live/commit/4cc85de8d28a3a0c28d095449b155f0e3e739caa), [`f8c5aaf`](https://github.com/LedgerHQ/ledger-live/commit/f8c5aafb44f3e9ad7c00f808778a66cfa853e7b8), [`f6ca949`](https://github.com/LedgerHQ/ledger-live/commit/f6ca949d03801ac1a0815f89906b17e5f4625821), [`4ba9d04`](https://github.com/LedgerHQ/ledger-live/commit/4ba9d04975b17d9d25f2c60dca87bdd71638d7d1), [`9868c13`](https://github.com/LedgerHQ/ledger-live/commit/9868c1358cb80de41a70e876ab2285fb8102e9a6), [`5e8bfda`](https://github.com/LedgerHQ/ledger-live/commit/5e8bfda844f0c53f0340d2ca7017e6314a657bc8), [`a8b4f57`](https://github.com/LedgerHQ/ledger-live/commit/a8b4f57bf7d82e6c2444a65901e927c3c3d64412), [`6746cf0`](https://github.com/LedgerHQ/ledger-live/commit/6746cf0f61be566026b5d53d2dc648db543354d2), [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d), [`dd2110a`](https://github.com/LedgerHQ/ledger-live/commit/dd2110a4259614eb39c62991d3cf92cae745d710)]:
  - @ledgerhq/live-common@34.45.0
  - @ledgerhq/cryptoassets@13.25.0
  - @ledgerhq/coin-evm@2.27.0
  - @ledgerhq/coin-tester@0.9.0
  - @ledgerhq/coin-framework@6.1.0
  - @ledgerhq/types-live@6.81.0
  - @ledgerhq/live-signer-evm@0.7.0

## 1.5.0-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@34.45.0-next.2

## 1.5.0-next.1

### Patch Changes

- Updated dependencies [[`dd2110a`](https://github.com/LedgerHQ/ledger-live/commit/dd2110a4259614eb39c62991d3cf92cae745d710)]:
  - @ledgerhq/live-common@34.45.0-next.1

## 1.5.0-next.0

### Minor Changes

- [#11223](https://github.com/LedgerHQ/ledger-live/pull/11223) [`9868c13`](https://github.com/LedgerHQ/ledger-live/commit/9868c1358cb80de41a70e876ab2285fb8102e9a6) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-tester-evm): adapt for generic adapter

### Patch Changes

- Updated dependencies [[`f5f652e`](https://github.com/LedgerHQ/ledger-live/commit/f5f652e308477ff38176e5782eaf0e1bb96956ba), [`0c8486e`](https://github.com/LedgerHQ/ledger-live/commit/0c8486ea830e9e2abf1dfc5d108117e1db733072), [`4cc85de`](https://github.com/LedgerHQ/ledger-live/commit/4cc85de8d28a3a0c28d095449b155f0e3e739caa), [`f8c5aaf`](https://github.com/LedgerHQ/ledger-live/commit/f8c5aafb44f3e9ad7c00f808778a66cfa853e7b8), [`f6ca949`](https://github.com/LedgerHQ/ledger-live/commit/f6ca949d03801ac1a0815f89906b17e5f4625821), [`4ba9d04`](https://github.com/LedgerHQ/ledger-live/commit/4ba9d04975b17d9d25f2c60dca87bdd71638d7d1), [`9868c13`](https://github.com/LedgerHQ/ledger-live/commit/9868c1358cb80de41a70e876ab2285fb8102e9a6), [`5e8bfda`](https://github.com/LedgerHQ/ledger-live/commit/5e8bfda844f0c53f0340d2ca7017e6314a657bc8), [`a8b4f57`](https://github.com/LedgerHQ/ledger-live/commit/a8b4f57bf7d82e6c2444a65901e927c3c3d64412), [`6746cf0`](https://github.com/LedgerHQ/ledger-live/commit/6746cf0f61be566026b5d53d2dc648db543354d2), [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d)]:
  - @ledgerhq/live-common@34.45.0-next.0
  - @ledgerhq/cryptoassets@13.25.0-next.0
  - @ledgerhq/coin-evm@2.27.0-next.0
  - @ledgerhq/coin-tester@0.9.0-next.0
  - @ledgerhq/coin-framework@6.1.0-next.0
  - @ledgerhq/types-live@6.81.0-next.0
  - @ledgerhq/live-signer-evm@0.7.0-next.0

## 1.4.0

### Minor Changes

- [#11073](https://github.com/LedgerHQ/ledger-live/pull/11073) [`b5cbffa`](https://github.com/LedgerHQ/ledger-live/commit/b5cbffac207569027e241db761a6aa70b3b1b636) Thanks [@Canestin](https://github.com/Canestin)! - update sonic manager app name

- [#11109](https://github.com/LedgerHQ/ledger-live/pull/11109) [`20321d1`](https://github.com/LedgerHQ/ledger-live/commit/20321d178231b09811df1da758f07f6516a91448) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - test(coin-tester-evm): unskip Polygon scenarii

- [#11027](https://github.com/LedgerHQ/ledger-live/pull/11027) [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Replace CoinFmk cryptoassets lib calls

### Patch Changes

- Updated dependencies [[`b5cbffa`](https://github.com/LedgerHQ/ledger-live/commit/b5cbffac207569027e241db761a6aa70b3b1b636), [`2da9b4a`](https://github.com/LedgerHQ/ledger-live/commit/2da9b4a5dd9fec3fea188fc9fa107b2c3479d1be), [`5bb2111`](https://github.com/LedgerHQ/ledger-live/commit/5bb2111d6a0c84cd0d6508bbf33d184bc89f9da3), [`cf29b89`](https://github.com/LedgerHQ/ledger-live/commit/cf29b897219b6ea7963decf8e8dc0916cfb087b2), [`417e4fc`](https://github.com/LedgerHQ/ledger-live/commit/417e4fc8b92ebc95542ca915e14023fdb62497bb), [`9c200a4`](https://github.com/LedgerHQ/ledger-live/commit/9c200a44f0d8d0cb3995b64a85adbaa750c2452d), [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa), [`8b0b4ef`](https://github.com/LedgerHQ/ledger-live/commit/8b0b4efaf2c0968cfb60c0cecebca9c575b00748)]:
  - @ledgerhq/cryptoassets@13.24.0
  - @ledgerhq/coin-tester@0.8.0
  - @ledgerhq/types-cryptoassets@7.25.0
  - @ledgerhq/types-live@6.80.0
  - @ledgerhq/coin-evm@2.26.0
  - @ledgerhq/coin-framework@6.0.0
  - @ledgerhq/live-signer-evm@0.6.3

## 1.4.0-next.0

### Minor Changes

- [#11073](https://github.com/LedgerHQ/ledger-live/pull/11073) [`b5cbffa`](https://github.com/LedgerHQ/ledger-live/commit/b5cbffac207569027e241db761a6aa70b3b1b636) Thanks [@Canestin](https://github.com/Canestin)! - update sonic manager app name

- [#11109](https://github.com/LedgerHQ/ledger-live/pull/11109) [`20321d1`](https://github.com/LedgerHQ/ledger-live/commit/20321d178231b09811df1da758f07f6516a91448) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - test(coin-tester-evm): unskip Polygon scenarii

- [#11027](https://github.com/LedgerHQ/ledger-live/pull/11027) [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Replace CoinFmk cryptoassets lib calls

### Patch Changes

- Updated dependencies [[`b5cbffa`](https://github.com/LedgerHQ/ledger-live/commit/b5cbffac207569027e241db761a6aa70b3b1b636), [`2da9b4a`](https://github.com/LedgerHQ/ledger-live/commit/2da9b4a5dd9fec3fea188fc9fa107b2c3479d1be), [`5bb2111`](https://github.com/LedgerHQ/ledger-live/commit/5bb2111d6a0c84cd0d6508bbf33d184bc89f9da3), [`cf29b89`](https://github.com/LedgerHQ/ledger-live/commit/cf29b897219b6ea7963decf8e8dc0916cfb087b2), [`417e4fc`](https://github.com/LedgerHQ/ledger-live/commit/417e4fc8b92ebc95542ca915e14023fdb62497bb), [`9c200a4`](https://github.com/LedgerHQ/ledger-live/commit/9c200a44f0d8d0cb3995b64a85adbaa750c2452d), [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa), [`8b0b4ef`](https://github.com/LedgerHQ/ledger-live/commit/8b0b4efaf2c0968cfb60c0cecebca9c575b00748)]:
  - @ledgerhq/cryptoassets@13.24.0-next.0
  - @ledgerhq/coin-tester@0.8.0-next.0
  - @ledgerhq/types-cryptoassets@7.25.0-next.0
  - @ledgerhq/types-live@6.80.0-next.0
  - @ledgerhq/coin-evm@2.26.0-next.0
  - @ledgerhq/coin-framework@6.0.0-next.0
  - @ledgerhq/live-signer-evm@0.6.3-next.0

## 1.3.3

### Patch Changes

- Updated dependencies [[`4eee376`](https://github.com/LedgerHQ/ledger-live/commit/4eee3767b513dfb58a156cf2ce8086e31a7d55bf), [`72c2a6c`](https://github.com/LedgerHQ/ledger-live/commit/72c2a6c91cfee66fac3505774ba16049fba1c0cf), [`6312f3a`](https://github.com/LedgerHQ/ledger-live/commit/6312f3a039e3018dfd78d231fa91ecf8fc82a118), [`431725f`](https://github.com/LedgerHQ/ledger-live/commit/431725f3e23a1342a94c6b566d9be7728ff37fff), [`8423a9f`](https://github.com/LedgerHQ/ledger-live/commit/8423a9fbba0d54d18ff35c0519a82829fc8042e0), [`6792990`](https://github.com/LedgerHQ/ledger-live/commit/6792990d8130ec297192bb7d6b98aef024e81dfa), [`d5f6793`](https://github.com/LedgerHQ/ledger-live/commit/d5f6793c6ae52178e93a19efc75931994bf930a8), [`132af3d`](https://github.com/LedgerHQ/ledger-live/commit/132af3db5863fb6e54587dd53d4db7b0ec19259e)]:
  - @ledgerhq/types-live@6.79.0
  - @ledgerhq/cryptoassets@13.23.0
  - @ledgerhq/coin-evm@2.25.0
  - @ledgerhq/types-cryptoassets@7.24.0
  - @ledgerhq/coin-framework@5.8.0
  - @ledgerhq/coin-tester@0.7.1
  - @ledgerhq/live-signer-evm@0.6.2

## 1.3.3-next.1

### Patch Changes

- Updated dependencies [[`8423a9f`](https://github.com/LedgerHQ/ledger-live/commit/8423a9fbba0d54d18ff35c0519a82829fc8042e0)]:
  - @ledgerhq/types-live@6.79.0-next.1
  - @ledgerhq/coin-framework@5.8.0-next.1
  - @ledgerhq/coin-evm@2.25.0-next.1
  - @ledgerhq/coin-tester@0.7.1
  - @ledgerhq/live-signer-evm@0.6.2-next.1

## 1.3.3-next.0

### Patch Changes

- Updated dependencies [[`4eee376`](https://github.com/LedgerHQ/ledger-live/commit/4eee3767b513dfb58a156cf2ce8086e31a7d55bf), [`72c2a6c`](https://github.com/LedgerHQ/ledger-live/commit/72c2a6c91cfee66fac3505774ba16049fba1c0cf), [`6312f3a`](https://github.com/LedgerHQ/ledger-live/commit/6312f3a039e3018dfd78d231fa91ecf8fc82a118), [`431725f`](https://github.com/LedgerHQ/ledger-live/commit/431725f3e23a1342a94c6b566d9be7728ff37fff), [`6792990`](https://github.com/LedgerHQ/ledger-live/commit/6792990d8130ec297192bb7d6b98aef024e81dfa), [`d5f6793`](https://github.com/LedgerHQ/ledger-live/commit/d5f6793c6ae52178e93a19efc75931994bf930a8), [`132af3d`](https://github.com/LedgerHQ/ledger-live/commit/132af3db5863fb6e54587dd53d4db7b0ec19259e)]:
  - @ledgerhq/types-live@6.79.0-next.0
  - @ledgerhq/cryptoassets@13.23.0-next.0
  - @ledgerhq/coin-evm@2.25.0-next.0
  - @ledgerhq/types-cryptoassets@7.24.0-next.0
  - @ledgerhq/coin-framework@5.8.0-next.0
  - @ledgerhq/coin-tester@0.7.1
  - @ledgerhq/live-signer-evm@0.6.2-next.0

## 1.3.2

### Patch Changes

- Updated dependencies [[`f4e4632`](https://github.com/LedgerHQ/ledger-live/commit/f4e4632119cc0c33e327df9faa9d4951128818c0)]:
  - @ledgerhq/live-signer-evm@0.6.1

## 1.3.2-hotfix.0

### Patch Changes

- Updated dependencies [[`f4e4632`](https://github.com/LedgerHQ/ledger-live/commit/f4e4632119cc0c33e327df9faa9d4951128818c0)]:
  - @ledgerhq/live-signer-evm@0.6.1-hotfix.0

## 1.3.1

### Patch Changes

- Updated dependencies [[`49f233a`](https://github.com/LedgerHQ/ledger-live/commit/49f233ad988568d7db8780fc5ab7762ec5cef92e), [`2f95ad0`](https://github.com/LedgerHQ/ledger-live/commit/2f95ad048a482a8627a3cc511c94db4845152c9b), [`bf0607b`](https://github.com/LedgerHQ/ledger-live/commit/bf0607b191eb0c0ad30568dcf643a529be677da2), [`6ece1b8`](https://github.com/LedgerHQ/ledger-live/commit/6ece1b80ed05f9dab6541702e40a43b51887f958), [`582a016`](https://github.com/LedgerHQ/ledger-live/commit/582a016c79d80936e3ec5a22b16c79071d788ffe), [`bb7e311`](https://github.com/LedgerHQ/ledger-live/commit/bb7e31139763b9fd943bf237d2c6260d6aef24ab), [`0e32a4e`](https://github.com/LedgerHQ/ledger-live/commit/0e32a4e5482ad2d3002483632770a2d7981b7a5a), [`9fd5b54`](https://github.com/LedgerHQ/ledger-live/commit/9fd5b5449f1d15fc559e966e9d71e2ad6573547c), [`769b0ed`](https://github.com/LedgerHQ/ledger-live/commit/769b0ed64b3a4c0388546ec00966d1185f3aea68), [`63cdeb1`](https://github.com/LedgerHQ/ledger-live/commit/63cdeb1ea20fe0c16b623546ce00f3fe26b7ec80), [`4a2c078`](https://github.com/LedgerHQ/ledger-live/commit/4a2c0785883c025859a4b5ef8ac2083ddfd0d604), [`9c11b2c`](https://github.com/LedgerHQ/ledger-live/commit/9c11b2c7a9165fad82f9d15deecd2b77fdb00713), [`49f233a`](https://github.com/LedgerHQ/ledger-live/commit/49f233ad988568d7db8780fc5ab7762ec5cef92e)]:
  - @ledgerhq/live-signer-evm@0.6.0
  - @ledgerhq/coin-evm@2.24.0
  - @ledgerhq/cryptoassets@13.22.0
  - @ledgerhq/coin-framework@5.7.0
  - @ledgerhq/types-live@6.78.0
  - @ledgerhq/coin-tester@0.7.1

## 1.3.1-next.0

### Patch Changes

- Updated dependencies [[`49f233a`](https://github.com/LedgerHQ/ledger-live/commit/49f233ad988568d7db8780fc5ab7762ec5cef92e), [`2f95ad0`](https://github.com/LedgerHQ/ledger-live/commit/2f95ad048a482a8627a3cc511c94db4845152c9b), [`bf0607b`](https://github.com/LedgerHQ/ledger-live/commit/bf0607b191eb0c0ad30568dcf643a529be677da2), [`6ece1b8`](https://github.com/LedgerHQ/ledger-live/commit/6ece1b80ed05f9dab6541702e40a43b51887f958), [`582a016`](https://github.com/LedgerHQ/ledger-live/commit/582a016c79d80936e3ec5a22b16c79071d788ffe), [`bb7e311`](https://github.com/LedgerHQ/ledger-live/commit/bb7e31139763b9fd943bf237d2c6260d6aef24ab), [`0e32a4e`](https://github.com/LedgerHQ/ledger-live/commit/0e32a4e5482ad2d3002483632770a2d7981b7a5a), [`9fd5b54`](https://github.com/LedgerHQ/ledger-live/commit/9fd5b5449f1d15fc559e966e9d71e2ad6573547c), [`769b0ed`](https://github.com/LedgerHQ/ledger-live/commit/769b0ed64b3a4c0388546ec00966d1185f3aea68), [`63cdeb1`](https://github.com/LedgerHQ/ledger-live/commit/63cdeb1ea20fe0c16b623546ce00f3fe26b7ec80), [`4a2c078`](https://github.com/LedgerHQ/ledger-live/commit/4a2c0785883c025859a4b5ef8ac2083ddfd0d604), [`9c11b2c`](https://github.com/LedgerHQ/ledger-live/commit/9c11b2c7a9165fad82f9d15deecd2b77fdb00713), [`49f233a`](https://github.com/LedgerHQ/ledger-live/commit/49f233ad988568d7db8780fc5ab7762ec5cef92e)]:
  - @ledgerhq/live-signer-evm@0.6.0-next.0
  - @ledgerhq/coin-evm@2.24.0-next.0
  - @ledgerhq/cryptoassets@13.22.0-next.0
  - @ledgerhq/coin-framework@5.7.0-next.0
  - @ledgerhq/types-live@6.78.0-next.0
  - @ledgerhq/coin-tester@0.7.1-next.0

## 1.3.0

### Minor Changes

- [#10811](https://github.com/LedgerHQ/ledger-live/pull/10811) [`ad01130`](https://github.com/LedgerHQ/ledger-live/commit/ad01130147094f0bf71691fdd31d243db7bcf791) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm): remove cyclic imports

### Patch Changes

- Updated dependencies [[`ad01130`](https://github.com/LedgerHQ/ledger-live/commit/ad01130147094f0bf71691fdd31d243db7bcf791), [`d053a79`](https://github.com/LedgerHQ/ledger-live/commit/d053a7969ac7976ea6d10955c3cfa47621be1b32), [`90b023d`](https://github.com/LedgerHQ/ledger-live/commit/90b023d9a6db34fef865abf96ab31a5e0bcef42a), [`2f38d03`](https://github.com/LedgerHQ/ledger-live/commit/2f38d032ec8e8481e4ff3b37f33aa4eb3872b542), [`0232f73`](https://github.com/LedgerHQ/ledger-live/commit/0232f73efa73eb3a16c306f25dd110e12b9c1fb7), [`c57bdbe`](https://github.com/LedgerHQ/ledger-live/commit/c57bdbe55941a2f49eb4e8e33abc9fc697e4a3ba)]:
  - @ledgerhq/coin-evm@2.23.0
  - @ledgerhq/types-live@6.77.0
  - @ledgerhq/coin-framework@5.6.0
  - @ledgerhq/live-signer-evm@0.5.6
  - @ledgerhq/coin-tester@0.7.0

## 1.3.0-next.0

### Minor Changes

- [#10811](https://github.com/LedgerHQ/ledger-live/pull/10811) [`ad01130`](https://github.com/LedgerHQ/ledger-live/commit/ad01130147094f0bf71691fdd31d243db7bcf791) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm): remove cyclic imports

### Patch Changes

- Updated dependencies [[`ad01130`](https://github.com/LedgerHQ/ledger-live/commit/ad01130147094f0bf71691fdd31d243db7bcf791), [`d053a79`](https://github.com/LedgerHQ/ledger-live/commit/d053a7969ac7976ea6d10955c3cfa47621be1b32), [`90b023d`](https://github.com/LedgerHQ/ledger-live/commit/90b023d9a6db34fef865abf96ab31a5e0bcef42a), [`2f38d03`](https://github.com/LedgerHQ/ledger-live/commit/2f38d032ec8e8481e4ff3b37f33aa4eb3872b542), [`0232f73`](https://github.com/LedgerHQ/ledger-live/commit/0232f73efa73eb3a16c306f25dd110e12b9c1fb7), [`c57bdbe`](https://github.com/LedgerHQ/ledger-live/commit/c57bdbe55941a2f49eb4e8e33abc9fc697e4a3ba)]:
  - @ledgerhq/coin-evm@2.23.0-next.0
  - @ledgerhq/types-live@6.77.0-next.0
  - @ledgerhq/coin-framework@5.6.0-next.0
  - @ledgerhq/live-signer-evm@0.5.6-next.0
  - @ledgerhq/coin-tester@0.7.0

## 1.2.0

### Minor Changes

- [#10743](https://github.com/LedgerHQ/ledger-live/pull/10743) [`539ac89`](https://github.com/LedgerHQ/ledger-live/commit/539ac893ff233a7d90dfcd205c39e1403680a837) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-tester-evm): update Sonic url in coin tester

### Patch Changes

- Updated dependencies [[`c6005ce`](https://github.com/LedgerHQ/ledger-live/commit/c6005ce8545acb596c2ff7770a0df848378ee83b), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`c3c2069`](https://github.com/LedgerHQ/ledger-live/commit/c3c2069976c43ebca2bce7896036efd071a22814), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`9d646eb`](https://github.com/LedgerHQ/ledger-live/commit/9d646eb6ca28b41af950b264c7d799a7ad536207)]:
  - @ledgerhq/cryptoassets@13.21.0
  - @ledgerhq/types-live@6.76.0
  - @ledgerhq/coin-framework@5.5.0
  - @ledgerhq/coin-evm@2.22.6
  - @ledgerhq/coin-tester@0.7.0
  - @ledgerhq/live-signer-evm@0.5.5

## 1.2.0-next.0

### Minor Changes

- [#10743](https://github.com/LedgerHQ/ledger-live/pull/10743) [`539ac89`](https://github.com/LedgerHQ/ledger-live/commit/539ac893ff233a7d90dfcd205c39e1403680a837) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-tester-evm): update Sonic url in coin tester

### Patch Changes

- Updated dependencies [[`c6005ce`](https://github.com/LedgerHQ/ledger-live/commit/c6005ce8545acb596c2ff7770a0df848378ee83b), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`c3c2069`](https://github.com/LedgerHQ/ledger-live/commit/c3c2069976c43ebca2bce7896036efd071a22814), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`9d646eb`](https://github.com/LedgerHQ/ledger-live/commit/9d646eb6ca28b41af950b264c7d799a7ad536207)]:
  - @ledgerhq/cryptoassets@13.21.0-next.0
  - @ledgerhq/types-live@6.76.0-next.0
  - @ledgerhq/coin-framework@5.5.0-next.0
  - @ledgerhq/coin-evm@2.22.6-next.0
  - @ledgerhq/coin-tester@0.7.0
  - @ledgerhq/live-signer-evm@0.5.5-next.0

## 1.1.11

### Patch Changes

- Updated dependencies [[`2274597`](https://github.com/LedgerHQ/ledger-live/commit/227459709ec157b7e49db4e75c52525e15acd8d2), [`7a1b8c8`](https://github.com/LedgerHQ/ledger-live/commit/7a1b8c8e59383efb02676cfe647c5889a31372bc), [`95bcad3`](https://github.com/LedgerHQ/ledger-live/commit/95bcad3cc17aa7b4139a8ae3b08ecfb15a2fbcdc), [`5735489`](https://github.com/LedgerHQ/ledger-live/commit/5735489ddcee66110fc0cccc6bdd696876b8be4d)]:
  - @ledgerhq/types-live@6.75.0
  - @ledgerhq/cryptoassets@13.20.0
  - @ledgerhq/coin-framework@5.4.1
  - @ledgerhq/coin-evm@2.22.5
  - @ledgerhq/coin-tester@0.7.0
  - @ledgerhq/live-signer-evm@0.5.4

## 1.1.11-next.0

### Patch Changes

- Updated dependencies [[`2274597`](https://github.com/LedgerHQ/ledger-live/commit/227459709ec157b7e49db4e75c52525e15acd8d2), [`7a1b8c8`](https://github.com/LedgerHQ/ledger-live/commit/7a1b8c8e59383efb02676cfe647c5889a31372bc), [`95bcad3`](https://github.com/LedgerHQ/ledger-live/commit/95bcad3cc17aa7b4139a8ae3b08ecfb15a2fbcdc), [`5735489`](https://github.com/LedgerHQ/ledger-live/commit/5735489ddcee66110fc0cccc6bdd696876b8be4d)]:
  - @ledgerhq/types-live@6.75.0-next.0
  - @ledgerhq/cryptoassets@13.20.0-next.0
  - @ledgerhq/coin-framework@5.4.1-next.0
  - @ledgerhq/coin-evm@2.22.5-next.0
  - @ledgerhq/coin-tester@0.7.0
  - @ledgerhq/live-signer-evm@0.5.4-next.0

## 1.1.10

### Patch Changes

- Updated dependencies [[`e65c386`](https://github.com/LedgerHQ/ledger-live/commit/e65c386cfb3e53e3ee9f501dc08971a93eb5cf81), [`9ceee03`](https://github.com/LedgerHQ/ledger-live/commit/9ceee03c33c41bb035fe64f9303acd36872536b6), [`98eb2eb`](https://github.com/LedgerHQ/ledger-live/commit/98eb2ebce8e12742a68b8f54ba625d63c4958087), [`4d9aaf5`](https://github.com/LedgerHQ/ledger-live/commit/4d9aaf583060a22cd1343b23d9b5c1ee3c02abb4), [`5739a67`](https://github.com/LedgerHQ/ledger-live/commit/5739a67975dfc2509d5abd4ff13ea36af010f93e), [`e9739d1`](https://github.com/LedgerHQ/ledger-live/commit/e9739d19946376dd7a8a5f10471594f267f3a95f)]:
  - @ledgerhq/coin-tester@0.7.0
  - @ledgerhq/types-live@6.74.0
  - @ledgerhq/coin-framework@5.4.0
  - @ledgerhq/cryptoassets@13.19.0
  - @ledgerhq/coin-evm@2.22.4
  - @ledgerhq/live-signer-evm@0.5.3

## 1.1.10-next.0

### Patch Changes

- Updated dependencies [[`e65c386`](https://github.com/LedgerHQ/ledger-live/commit/e65c386cfb3e53e3ee9f501dc08971a93eb5cf81), [`9ceee03`](https://github.com/LedgerHQ/ledger-live/commit/9ceee03c33c41bb035fe64f9303acd36872536b6), [`98eb2eb`](https://github.com/LedgerHQ/ledger-live/commit/98eb2ebce8e12742a68b8f54ba625d63c4958087), [`4d9aaf5`](https://github.com/LedgerHQ/ledger-live/commit/4d9aaf583060a22cd1343b23d9b5c1ee3c02abb4), [`5739a67`](https://github.com/LedgerHQ/ledger-live/commit/5739a67975dfc2509d5abd4ff13ea36af010f93e), [`e9739d1`](https://github.com/LedgerHQ/ledger-live/commit/e9739d19946376dd7a8a5f10471594f267f3a95f)]:
  - @ledgerhq/coin-tester@0.7.0-next.0
  - @ledgerhq/types-live@6.74.0-next.0
  - @ledgerhq/coin-framework@5.4.0-next.0
  - @ledgerhq/cryptoassets@13.19.0-next.0
  - @ledgerhq/coin-evm@2.22.4-next.0
  - @ledgerhq/live-signer-evm@0.5.3-next.0

## 1.1.9

### Patch Changes

- Updated dependencies [[`18bc0d4`](https://github.com/LedgerHQ/ledger-live/commit/18bc0d4a27696491400df6ce26b915a88b56792f), [`99385c9`](https://github.com/LedgerHQ/ledger-live/commit/99385c9a7ecac9328ffa29c039e8c0cf2317c431), [`b7d3d59`](https://github.com/LedgerHQ/ledger-live/commit/b7d3d59d299c3d3541d598536651b9047fda4526), [`e04d215`](https://github.com/LedgerHQ/ledger-live/commit/e04d21576919fa21cb3ab6e1c4e8e50fb6c17eca), [`1535307`](https://github.com/LedgerHQ/ledger-live/commit/1535307f78d345d7f652ac2c91c8a67e62fedef2)]:
  - @ledgerhq/coin-framework@5.3.0
  - @ledgerhq/types-live@6.73.0
  - @ledgerhq/coin-evm@2.22.3
  - @ledgerhq/cryptoassets@13.18.1
  - @ledgerhq/coin-tester@0.6.0
  - @ledgerhq/live-signer-evm@0.5.2

## 1.1.9-next.1

### Patch Changes

- Updated dependencies [[`99385c9`](https://github.com/LedgerHQ/ledger-live/commit/99385c9a7ecac9328ffa29c039e8c0cf2317c431)]:
  - @ledgerhq/coin-framework@5.3.0-next.1
  - @ledgerhq/coin-evm@2.22.3-next.1
  - @ledgerhq/live-signer-evm@0.5.2-next.1

## 1.1.9-next.0

### Patch Changes

- Updated dependencies [[`18bc0d4`](https://github.com/LedgerHQ/ledger-live/commit/18bc0d4a27696491400df6ce26b915a88b56792f), [`b7d3d59`](https://github.com/LedgerHQ/ledger-live/commit/b7d3d59d299c3d3541d598536651b9047fda4526), [`e04d215`](https://github.com/LedgerHQ/ledger-live/commit/e04d21576919fa21cb3ab6e1c4e8e50fb6c17eca), [`1535307`](https://github.com/LedgerHQ/ledger-live/commit/1535307f78d345d7f652ac2c91c8a67e62fedef2)]:
  - @ledgerhq/coin-framework@5.3.0-next.0
  - @ledgerhq/types-live@6.73.0-next.0
  - @ledgerhq/coin-evm@2.22.3-next.0
  - @ledgerhq/cryptoassets@13.18.1-next.0
  - @ledgerhq/coin-tester@0.6.0
  - @ledgerhq/live-signer-evm@0.5.2-next.0

## 1.1.8

### Patch Changes

- Updated dependencies [[`4ddfe60`](https://github.com/LedgerHQ/ledger-live/commit/4ddfe6060ab8e4e5c0bb89da91e08a02d8ca50e6), [`f42f353`](https://github.com/LedgerHQ/ledger-live/commit/f42f353a593d0a1cd0a237648765080c85d0eea7), [`1a4e5e5`](https://github.com/LedgerHQ/ledger-live/commit/1a4e5e5913fe5e12d6127b36f3849e4c81e5e50e)]:
  - @ledgerhq/types-live@6.72.0
  - @ledgerhq/coin-framework@5.2.0
  - @ledgerhq/coin-tester@0.6.0
  - @ledgerhq/coin-evm@2.22.2
  - @ledgerhq/live-signer-evm@0.5.1

## 1.1.8-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@5.2.0-next.2
  - @ledgerhq/coin-evm@2.22.2-next.2
  - @ledgerhq/live-signer-evm@0.5.1-next.2
  - @ledgerhq/coin-tester@0.6.0-next.2

## 1.1.8-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@5.2.0-next.1
  - @ledgerhq/coin-evm@2.22.2-next.1
  - @ledgerhq/live-signer-evm@0.5.1-next.1
  - @ledgerhq/coin-tester@0.6.0-next.1

## 1.1.8-next.0

### Patch Changes

- Updated dependencies [[`4ddfe60`](https://github.com/LedgerHQ/ledger-live/commit/4ddfe6060ab8e4e5c0bb89da91e08a02d8ca50e6), [`f42f353`](https://github.com/LedgerHQ/ledger-live/commit/f42f353a593d0a1cd0a237648765080c85d0eea7), [`1a4e5e5`](https://github.com/LedgerHQ/ledger-live/commit/1a4e5e5913fe5e12d6127b36f3849e4c81e5e50e)]:
  - @ledgerhq/types-live@6.72.0-next.0
  - @ledgerhq/coin-framework@5.2.0-next.0
  - @ledgerhq/coin-tester@0.6.0-next.0
  - @ledgerhq/coin-evm@2.22.2-next.0
  - @ledgerhq/live-signer-evm@0.5.1-next.0

## 1.1.7

### Patch Changes

- Updated dependencies [[`0104847`](https://github.com/LedgerHQ/ledger-live/commit/0104847fa980dddc56ee31c24de15f31f6b9f33d), [`0104847`](https://github.com/LedgerHQ/ledger-live/commit/0104847fa980dddc56ee31c24de15f31f6b9f33d), [`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47), [`6253e0e`](https://github.com/LedgerHQ/ledger-live/commit/6253e0e3efcd1a29543cda55c9a5269f97aa770f), [`eff3c94`](https://github.com/LedgerHQ/ledger-live/commit/eff3c94c1eded61518097a4544c3f5b25db1e28a)]:
  - @ledgerhq/live-signer-evm@0.5.0
  - @ledgerhq/cryptoassets@13.18.0
  - @ledgerhq/coin-framework@5.1.0
  - @ledgerhq/types-live@6.71.0
  - @ledgerhq/coin-evm@2.22.1
  - @ledgerhq/coin-tester@0.5.1

## 1.1.7-next.0

### Patch Changes

- Updated dependencies [[`0104847`](https://github.com/LedgerHQ/ledger-live/commit/0104847fa980dddc56ee31c24de15f31f6b9f33d), [`0104847`](https://github.com/LedgerHQ/ledger-live/commit/0104847fa980dddc56ee31c24de15f31f6b9f33d), [`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47), [`6253e0e`](https://github.com/LedgerHQ/ledger-live/commit/6253e0e3efcd1a29543cda55c9a5269f97aa770f), [`eff3c94`](https://github.com/LedgerHQ/ledger-live/commit/eff3c94c1eded61518097a4544c3f5b25db1e28a)]:
  - @ledgerhq/live-signer-evm@0.5.0-next.0
  - @ledgerhq/cryptoassets@13.18.0-next.0
  - @ledgerhq/coin-framework@5.1.0-next.0
  - @ledgerhq/types-live@6.71.0-next.0
  - @ledgerhq/coin-evm@2.22.1-next.0
  - @ledgerhq/coin-tester@0.5.1-next.0

## 1.1.6

### Patch Changes

- Updated dependencies [[`f92f49a`](https://github.com/LedgerHQ/ledger-live/commit/f92f49a003767b83b94955e920cfac8cd565c162), [`5657584`](https://github.com/LedgerHQ/ledger-live/commit/565758426688c9604c7958183ec5b3d4e35ffbe4)]:
  - @ledgerhq/cryptoassets@13.17.0
  - @ledgerhq/coin-evm@2.22.0
  - @ledgerhq/coin-framework@5.0.2
  - @ledgerhq/live-signer-evm@0.4.2

## 1.1.6-next.0

### Patch Changes

- Updated dependencies [[`f92f49a`](https://github.com/LedgerHQ/ledger-live/commit/f92f49a003767b83b94955e920cfac8cd565c162), [`5657584`](https://github.com/LedgerHQ/ledger-live/commit/565758426688c9604c7958183ec5b3d4e35ffbe4)]:
  - @ledgerhq/cryptoassets@13.17.0-next.0
  - @ledgerhq/coin-evm@2.22.0-next.0
  - @ledgerhq/coin-framework@5.0.2-next.0
  - @ledgerhq/live-signer-evm@0.4.1-next.0

## 1.1.5

### Patch Changes

- Updated dependencies [[`6abef9a`](https://github.com/LedgerHQ/ledger-live/commit/6abef9a8cb62df478dcf9ba9be36bbd566e133a1), [`6abef9a`](https://github.com/LedgerHQ/ledger-live/commit/6abef9a8cb62df478dcf9ba9be36bbd566e133a1), [`612a274`](https://github.com/LedgerHQ/ledger-live/commit/612a274abd1692aa9fab450854ab12ff90f6e41e)]:
  - @ledgerhq/live-signer-evm@0.4.1

## 1.1.5-hotfix.0

### Patch Changes

- Updated dependencies [[`6abef9a`](https://github.com/LedgerHQ/ledger-live/commit/6abef9a8cb62df478dcf9ba9be36bbd566e133a1), [`6abef9a`](https://github.com/LedgerHQ/ledger-live/commit/6abef9a8cb62df478dcf9ba9be36bbd566e133a1), [`612a274`](https://github.com/LedgerHQ/ledger-live/commit/612a274abd1692aa9fab450854ab12ff90f6e41e)]:
  - @ledgerhq/live-signer-evm@0.4.1-hotfix.0

## 1.1.4

### Patch Changes

- Updated dependencies [[`a7ba19c`](https://github.com/LedgerHQ/ledger-live/commit/a7ba19cfa5a895572edfcf036a10d2af83efdf38), [`91fe526`](https://github.com/LedgerHQ/ledger-live/commit/91fe526be2710f0fb18b4d035a5d8de630b3d4b5)]:
  - @ledgerhq/types-live@6.70.0
  - @ledgerhq/coin-evm@2.21.0
  - @ledgerhq/live-signer-evm@0.4.0
  - @ledgerhq/coin-framework@5.0.1
  - @ledgerhq/coin-tester@0.5.0

## 1.1.4-next.0

### Patch Changes

- Updated dependencies [[`a7ba19c`](https://github.com/LedgerHQ/ledger-live/commit/a7ba19cfa5a895572edfcf036a10d2af83efdf38), [`91fe526`](https://github.com/LedgerHQ/ledger-live/commit/91fe526be2710f0fb18b4d035a5d8de630b3d4b5)]:
  - @ledgerhq/types-live@6.70.0-next.0
  - @ledgerhq/coin-evm@2.21.0-next.0
  - @ledgerhq/live-signer-evm@0.4.0-next.0
  - @ledgerhq/coin-framework@5.0.1-next.0
  - @ledgerhq/coin-tester@0.5.0

## 1.1.3

### Patch Changes

- Updated dependencies [[`a11fd0b`](https://github.com/LedgerHQ/ledger-live/commit/a11fd0bbb687edc9e279bd4d63352658cae92c63), [`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431), [`b599ac4`](https://github.com/LedgerHQ/ledger-live/commit/b599ac4697688459aad15371f9efea58f331dc33), [`1d72da9`](https://github.com/LedgerHQ/ledger-live/commit/1d72da911a56d5b25fb6464e60ac236927823ce4)]:
  - @ledgerhq/coin-evm@2.20.0
  - @ledgerhq/types-cryptoassets@7.23.0
  - @ledgerhq/cryptoassets@13.16.0
  - @ledgerhq/types-live@6.69.0
  - @ledgerhq/coin-framework@5.0.0
  - @ledgerhq/live-signer-evm@0.3.2
  - @ledgerhq/coin-tester@0.5.0

## 1.1.3-next.0

### Patch Changes

- Updated dependencies [[`a11fd0b`](https://github.com/LedgerHQ/ledger-live/commit/a11fd0bbb687edc9e279bd4d63352658cae92c63), [`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431), [`b599ac4`](https://github.com/LedgerHQ/ledger-live/commit/b599ac4697688459aad15371f9efea58f331dc33), [`1d72da9`](https://github.com/LedgerHQ/ledger-live/commit/1d72da911a56d5b25fb6464e60ac236927823ce4)]:
  - @ledgerhq/coin-evm@2.20.0-next.0
  - @ledgerhq/types-cryptoassets@7.23.0-next.0
  - @ledgerhq/cryptoassets@13.16.0-next.0
  - @ledgerhq/types-live@6.69.0-next.0
  - @ledgerhq/coin-framework@5.0.0-next.0
  - @ledgerhq/live-signer-evm@0.3.2-next.0
  - @ledgerhq/coin-tester@0.5.0

## 1.1.2

### Patch Changes

- Updated dependencies [[`cf2bf99`](https://github.com/LedgerHQ/ledger-live/commit/cf2bf99ba44e6eaf20e16cb320c0b22068340601)]:
  - @ledgerhq/coin-framework@4.0.0
  - @ledgerhq/coin-evm@2.19.1
  - @ledgerhq/live-signer-evm@0.3.1

## 1.1.2-next.0

### Patch Changes

- Updated dependencies [[`cf2bf99`](https://github.com/LedgerHQ/ledger-live/commit/cf2bf99ba44e6eaf20e16cb320c0b22068340601)]:
  - @ledgerhq/coin-framework@4.0.0-next.0
  - @ledgerhq/coin-evm@2.19.1-next.0
  - @ledgerhq/live-signer-evm@0.3.1-next.0

## 1.1.1

### Patch Changes

- Updated dependencies [[`9a208c3`](https://github.com/LedgerHQ/ledger-live/commit/9a208c39aec129b3aff2105991ffc18be05fd3f5), [`9009235`](https://github.com/LedgerHQ/ledger-live/commit/9009235cf52e83c0626acaec0959bfb3837404aa), [`95dbd60`](https://github.com/LedgerHQ/ledger-live/commit/95dbd60c06b02fe6fd50bc2ec0883096858d1f23)]:
  - @ledgerhq/types-live@6.68.0
  - @ledgerhq/coin-evm@2.19.0
  - @ledgerhq/live-signer-evm@0.3.0
  - @ledgerhq/coin-framework@3.0.1
  - @ledgerhq/coin-tester@0.5.0

## 1.1.1-next.0

### Patch Changes

- Updated dependencies [[`9a208c3`](https://github.com/LedgerHQ/ledger-live/commit/9a208c39aec129b3aff2105991ffc18be05fd3f5), [`9009235`](https://github.com/LedgerHQ/ledger-live/commit/9009235cf52e83c0626acaec0959bfb3837404aa), [`95dbd60`](https://github.com/LedgerHQ/ledger-live/commit/95dbd60c06b02fe6fd50bc2ec0883096858d1f23)]:
  - @ledgerhq/types-live@6.68.0-next.0
  - @ledgerhq/coin-evm@2.19.0-next.0
  - @ledgerhq/live-signer-evm@0.3.0-next.0
  - @ledgerhq/coin-framework@3.0.1-next.0
  - @ledgerhq/coin-tester@0.5.0

## 1.1.0

### Minor Changes

- [#9919](https://github.com/LedgerHQ/ledger-live/pull/9919) [`5d6d223`](https://github.com/LedgerHQ/ledger-live/commit/5d6d223fe1691200911e81c8d83eec7b4ae0cd65) Thanks [@qperrot](https://github.com/qperrot)! - Move all coin tester into its own coin tester modules

- [#9775](https://github.com/LedgerHQ/ledger-live/pull/9775) [`fe89dd5`](https://github.com/LedgerHQ/ledger-live/commit/fe89dd51cd35000c7b661d6364fe78f88bbf6c62) Thanks [@Canestin](https://github.com/Canestin)! - extract coin-tester-evm module

### Patch Changes

- Updated dependencies [[`5d6d223`](https://github.com/LedgerHQ/ledger-live/commit/5d6d223fe1691200911e81c8d83eec7b4ae0cd65), [`6f61972`](https://github.com/LedgerHQ/ledger-live/commit/6f619728e200270a674ffb13b10375765b55ae4b), [`73722cc`](https://github.com/LedgerHQ/ledger-live/commit/73722ccbc93712103ff4ea33ab5c0c294400eef8), [`3f8a531`](https://github.com/LedgerHQ/ledger-live/commit/3f8a53196dfb80d084056e0d896e09869c8ff949), [`8d36e9b`](https://github.com/LedgerHQ/ledger-live/commit/8d36e9b2474a4c600427f357adad04f99a89e13d), [`fe89dd5`](https://github.com/LedgerHQ/ledger-live/commit/fe89dd51cd35000c7b661d6364fe78f88bbf6c62), [`b580b04`](https://github.com/LedgerHQ/ledger-live/commit/b580b04e02392a706534c2fceba192ae3b6242ef), [`1e56618`](https://github.com/LedgerHQ/ledger-live/commit/1e56618a3c31e7980074072e0aae9422c145f4b3), [`4c6b682`](https://github.com/LedgerHQ/ledger-live/commit/4c6b682b9929334a7be13212a69f2c6a614f372c), [`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81)]:
  - @ledgerhq/coin-tester@0.5.0
  - @ledgerhq/types-live@6.67.0
  - @ledgerhq/coin-evm@2.18.0
  - @ledgerhq/coin-framework@3.0.0
  - @ledgerhq/cryptoassets@13.15.0
  - @ledgerhq/types-cryptoassets@7.22.0
  - @ledgerhq/live-signer-evm@0.2.5

## 1.1.0-next.0

### Minor Changes

- [#9919](https://github.com/LedgerHQ/ledger-live/pull/9919) [`5d6d223`](https://github.com/LedgerHQ/ledger-live/commit/5d6d223fe1691200911e81c8d83eec7b4ae0cd65) Thanks [@qperrot](https://github.com/qperrot)! - Move all coin tester into its own coin tester modules

- [#9775](https://github.com/LedgerHQ/ledger-live/pull/9775) [`fe89dd5`](https://github.com/LedgerHQ/ledger-live/commit/fe89dd51cd35000c7b661d6364fe78f88bbf6c62) Thanks [@Canestin](https://github.com/Canestin)! - extract coin-tester-evm module

### Patch Changes

- Updated dependencies [[`5d6d223`](https://github.com/LedgerHQ/ledger-live/commit/5d6d223fe1691200911e81c8d83eec7b4ae0cd65), [`6f61972`](https://github.com/LedgerHQ/ledger-live/commit/6f619728e200270a674ffb13b10375765b55ae4b), [`73722cc`](https://github.com/LedgerHQ/ledger-live/commit/73722ccbc93712103ff4ea33ab5c0c294400eef8), [`3f8a531`](https://github.com/LedgerHQ/ledger-live/commit/3f8a53196dfb80d084056e0d896e09869c8ff949), [`8d36e9b`](https://github.com/LedgerHQ/ledger-live/commit/8d36e9b2474a4c600427f357adad04f99a89e13d), [`fe89dd5`](https://github.com/LedgerHQ/ledger-live/commit/fe89dd51cd35000c7b661d6364fe78f88bbf6c62), [`b580b04`](https://github.com/LedgerHQ/ledger-live/commit/b580b04e02392a706534c2fceba192ae3b6242ef), [`1e56618`](https://github.com/LedgerHQ/ledger-live/commit/1e56618a3c31e7980074072e0aae9422c145f4b3), [`4c6b682`](https://github.com/LedgerHQ/ledger-live/commit/4c6b682b9929334a7be13212a69f2c6a614f372c), [`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81)]:
  - @ledgerhq/coin-tester@0.5.0-next.0
  - @ledgerhq/types-live@6.67.0-next.0
  - @ledgerhq/coin-evm@2.18.0-next.0
  - @ledgerhq/coin-framework@3.0.0-next.0
  - @ledgerhq/cryptoassets@13.15.0-next.0
  - @ledgerhq/types-cryptoassets@7.22.0-next.0
  - @ledgerhq/live-signer-evm@0.2.5-next.0
