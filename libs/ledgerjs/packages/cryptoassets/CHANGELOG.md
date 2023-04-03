# @ledgerhq/cryptoassets

## 9.2.0

### Minor Changes

- [#2297](https://github.com/LedgerHQ/ledger-live/pull/2297) [`f364721cd9`](https://github.com/LedgerHQ/ledger-live/commit/f364721cd9c1681141b62cd807796e0a0a45efe4) Thanks [@Sheng-Long](https://github.com/Sheng-Long)! - Update Hedera explorer links

- [#2942](https://github.com/LedgerHQ/ledger-live/pull/2942) [`0ca89a8067`](https://github.com/LedgerHQ/ledger-live/commit/0ca89a80678743e9462aaf977448e759924a56b2) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Update Cardano Xray token

- [#3015](https://github.com/LedgerHQ/ledger-live/pull/3015) [`9bb21e26a8`](https://github.com/LedgerHQ/ledger-live/commit/9bb21e26a88a2db7093a3d5cc75ab03d12b25ffb) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Updating songbird rpc node

- [#2929](https://github.com/LedgerHQ/ledger-live/pull/2929) [`170f608de3`](https://github.com/LedgerHQ/ledger-live/commit/170f608de311f320795793b4606b063a3ce96def) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

## 9.2.0-next.0

### Minor Changes

- [#2297](https://github.com/LedgerHQ/ledger-live/pull/2297) [`f364721cd9`](https://github.com/LedgerHQ/ledger-live/commit/f364721cd9c1681141b62cd807796e0a0a45efe4) Thanks [@Sheng-Long](https://github.com/Sheng-Long)! - Update Hedera explorer links

- [#2942](https://github.com/LedgerHQ/ledger-live/pull/2942) [`0ca89a8067`](https://github.com/LedgerHQ/ledger-live/commit/0ca89a80678743e9462aaf977448e759924a56b2) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Update Cardano Xray token

- [#3015](https://github.com/LedgerHQ/ledger-live/pull/3015) [`9bb21e26a8`](https://github.com/LedgerHQ/ledger-live/commit/9bb21e26a88a2db7093a3d5cc75ab03d12b25ffb) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Updating songbird rpc node

- [#2929](https://github.com/LedgerHQ/ledger-live/pull/2929) [`170f608de3`](https://github.com/LedgerHQ/ledger-live/commit/170f608de311f320795793b4606b063a3ce96def) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

## 9.1.0

### Minor Changes

- [#2765](https://github.com/LedgerHQ/ledger-live/pull/2765) [`900ef4f528`](https://github.com/LedgerHQ/ledger-live/commit/900ef4f528c3b2359d666fbb76073978d5f9c840) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

## 9.1.0-next.0

### Minor Changes

- [#2765](https://github.com/LedgerHQ/ledger-live/pull/2765) [`900ef4f528`](https://github.com/LedgerHQ/ledger-live/commit/900ef4f528c3b2359d666fbb76073978d5f9c840) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

## 9.0.0

### Major Changes

- [#1991](https://github.com/LedgerHQ/ledger-live/pull/1991) [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7) Thanks [@valpinkman](https://github.com/valpinkman)! - Remove the support for imports ending with `/` mapping to the `index.js` file.

  For instance:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/";
  ```

  Should be rewritten to:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
  ```

  This trailing slash is poorly supported by some tools like `vite.js` and was meant as a transitional change.
  Time has come to remove the support for thos shorthand.

### Minor Changes

- [#2328](https://github.com/LedgerHQ/ledger-live/pull/2328) [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add chain id based ERC20 and signatures files to exported data

- [#2535](https://github.com/LedgerHQ/ledger-live/pull/2535) [`725000b4ed`](https://github.com/LedgerHQ/ledger-live/commit/725000b4ed37a2669f3a0cd70ca2b5d0b1d4825e) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

### Patch Changes

- [#2548](https://github.com/LedgerHQ/ledger-live/pull/2548) [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - cosmos_testnet cleanup

## 9.0.0-next.0

### Major Changes

- [#1991](https://github.com/LedgerHQ/ledger-live/pull/1991) [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7) Thanks [@valpinkman](https://github.com/valpinkman)! - Remove the support for imports ending with `/` mapping to the `index.js` file.

  For instance:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/";
  ```

  Should be rewritten to:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
  ```

  This trailing slash is poorly supported by some tools like `vite.js` and was meant as a transitional change.
  Time has come to remove the support for thos shorthand.

### Minor Changes

- [#2328](https://github.com/LedgerHQ/ledger-live/pull/2328) [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add chain id based ERC20 and signatures files to exported data

- [#2535](https://github.com/LedgerHQ/ledger-live/pull/2535) [`725000b4ed`](https://github.com/LedgerHQ/ledger-live/commit/725000b4ed37a2669f3a0cd70ca2b5d0b1d4825e) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

### Patch Changes

- [#2548](https://github.com/LedgerHQ/ledger-live/pull/2548) [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - cosmos_testnet cleanup

## 8.0.0

### Major Changes

- [#2444](https://github.com/LedgerHQ/ledger-live/pull/2444) [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add explorerId for v4 explorer endpoints

### Minor Changes

- [#1782](https://github.com/LedgerHQ/ledger-live/pull/1782) [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - merge osmosis into cosmos family

* [#2418](https://github.com/LedgerHQ/ledger-live/pull/2418) [`0e7ff249f7`](https://github.com/LedgerHQ/ledger-live/commit/0e7ff249f7e1160ff3888e52767ef91151efbedd) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

## 8.0.0-next.0

### Major Changes

- [#2444](https://github.com/LedgerHQ/ledger-live/pull/2444) [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add explorerId for v4 explorer endpoints

### Minor Changes

- [#1782](https://github.com/LedgerHQ/ledger-live/pull/1782) [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - merge osmosis into cosmos family

* [#2418](https://github.com/LedgerHQ/ledger-live/pull/2418) [`0e7ff249f7`](https://github.com/LedgerHQ/ledger-live/commit/0e7ff249f7e1160ff3888e52767ef91151efbedd) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

## 7.3.0

### Minor Changes

- [#1661](https://github.com/LedgerHQ/ledger-live/pull/1661) [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add ESDT UTK token.

## 7.3.0-next.0

### Minor Changes

- [#1661](https://github.com/LedgerHQ/ledger-live/pull/1661) [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add ESDT UTK token.

## 7.2.0

### Minor Changes

- [#2260](https://github.com/LedgerHQ/ledger-live/pull/2260) [`3200794498`](https://github.com/LedgerHQ/ledger-live/commit/32007944989d1e89162a63e9862bd64066d6216b) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

* [#2141](https://github.com/LedgerHQ/ledger-live/pull/2141) [`04a939310a`](https://github.com/LedgerHQ/ledger-live/commit/04a939310a52a7e0ebf0814286e6ad135c8c8cfa) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

### Patch Changes

- [#2121](https://github.com/LedgerHQ/ledger-live/pull/2121) [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea) Thanks [@lvndry](https://github.com/lvndry)! - set stakenet as a terminated currency

## 7.2.0-next.0

### Minor Changes

- [#2260](https://github.com/LedgerHQ/ledger-live/pull/2260) [`3200794498`](https://github.com/LedgerHQ/ledger-live/commit/32007944989d1e89162a63e9862bd64066d6216b) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

* [#2141](https://github.com/LedgerHQ/ledger-live/pull/2141) [`04a939310a`](https://github.com/LedgerHQ/ledger-live/commit/04a939310a52a7e0ebf0814286e6ad135c8c8cfa) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update CAL

### Patch Changes

- [#2121](https://github.com/LedgerHQ/ledger-live/pull/2121) [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea) Thanks [@lvndry](https://github.com/lvndry)! - set stakenet as a terminated currency

## 7.1.0

### Minor Changes

- [#1805](https://github.com/LedgerHQ/ledger-live/pull/1805) [`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Explorer views and yoctoNEAR added to NEAR entry

## 7.1.0-next.0

### Minor Changes

- [#1805](https://github.com/LedgerHQ/ledger-live/pull/1805) [`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Explorer views and yoctoNEAR added to NEAR entry

## 7.0.0

### Major Changes

- [#1778](https://github.com/LedgerHQ/ledger-live/pull/1778) [`9100363270`](https://github.com/LedgerHQ/ledger-live/commit/91003632704d11fc327517a582ac6d7009c05bd3) Thanks [@valpinkman](https://github.com/valpinkman)! - Breaking: Moved `data` folder in `src` so it can be compiled by TS (also changed files to Typescript)

### Minor Changes

- [#1845](https://github.com/LedgerHQ/ledger-live/pull/1845) [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - 20221117 CAL update

* [#1845](https://github.com/LedgerHQ/ledger-live/pull/1845) [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update

- [#1845](https://github.com/LedgerHQ/ledger-live/pull/1845) [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - LIVE-4719 update CAL

## 7.0.0-next.0

### Major Changes

- [#1778](https://github.com/LedgerHQ/ledger-live/pull/1778) [`9100363270`](https://github.com/LedgerHQ/ledger-live/commit/91003632704d11fc327517a582ac6d7009c05bd3) Thanks [@valpinkman](https://github.com/valpinkman)! - Breaking: Moved `data` folder in `src` so it can be compiled by TS (also changed files to Typescript)

### Minor Changes

- [#1845](https://github.com/LedgerHQ/ledger-live/pull/1845) [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - 20221117 CAL update

* [#1845](https://github.com/LedgerHQ/ledger-live/pull/1845) [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update

- [#1845](https://github.com/LedgerHQ/ledger-live/pull/1845) [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - LIVE-4719 update CAL

## 6.37.0

### Minor Changes

- [#1662](https://github.com/LedgerHQ/ledger-live/pull/1662) [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Ethereum currency to london fork

* [#1211](https://github.com/LedgerHQ/ledger-live/pull/1211) [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add EIP712 CAL and CAL importer

- [#1616](https://github.com/LedgerHQ/ledger-live/pull/1616) [`5b8315df30`](https://github.com/LedgerHQ/ledger-live/commit/5b8315df306d72e8b0191aa5136760142f9d3447) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - 20221019 CAL update

* [#1800](https://github.com/LedgerHQ/ledger-live/pull/1800) [`bef0a76d27`](https://github.com/LedgerHQ/ledger-live/commit/bef0a76d276f6a8d322e890ceaedc266a710b06a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - 20221114 CAL update

- [#1650](https://github.com/LedgerHQ/ledger-live/pull/1650) [`ab40db1288`](https://github.com/LedgerHQ/ledger-live/commit/ab40db1288bf4a795819a8a636821dbccf33073a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - 20221021 CAL update

### Patch Changes

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

## 6.37.0-next.0

### Minor Changes

- [#1662](https://github.com/LedgerHQ/ledger-live/pull/1662) [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Ethereum currency to london fork

* [#1211](https://github.com/LedgerHQ/ledger-live/pull/1211) [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add EIP712 CAL and CAL importer

- [#1616](https://github.com/LedgerHQ/ledger-live/pull/1616) [`5b8315df30`](https://github.com/LedgerHQ/ledger-live/commit/5b8315df306d72e8b0191aa5136760142f9d3447) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - 20221019 CAL update

* [#1800](https://github.com/LedgerHQ/ledger-live/pull/1800) [`bef0a76d27`](https://github.com/LedgerHQ/ledger-live/commit/bef0a76d276f6a8d322e890ceaedc266a710b06a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - 20221114 CAL update

- [#1650](https://github.com/LedgerHQ/ledger-live/pull/1650) [`ab40db1288`](https://github.com/LedgerHQ/ledger-live/commit/ab40db1288bf4a795819a8a636821dbccf33073a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - 20221021 CAL update

### Patch Changes

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

## 6.36.1

### Patch Changes

- [#1561](https://github.com/LedgerHQ/ledger-live/pull/1561) [`627f928b9d`](https://github.com/LedgerHQ/ledger-live/commit/627f928b9dc93f072f47b85d09e34c41b1948d0b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Disable countervalue for Cardano tokens unsupported in CoinGecko

## 6.36.1-next.0

### Patch Changes

- [#1561](https://github.com/LedgerHQ/ledger-live/pull/1561) [`627f928b9d`](https://github.com/LedgerHQ/ledger-live/commit/627f928b9dc93f072f47b85d09e34c41b1948d0b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Disable countervalue for Cardano tokens unsupported in CoinGecko

## 6.36.0

### Minor Changes

- [#1442](https://github.com/LedgerHQ/ledger-live/pull/1442) [`d3dc2c6877`](https://github.com/LedgerHQ/ledger-live/commit/d3dc2c6877fbdcaf68e442a781798d752fc5152d) Thanks [@sarneijim](https://github.com/sarneijim)! - Add bep20 exchange

### Patch Changes

- [#1419](https://github.com/LedgerHQ/ledger-live/pull/1419) [`2100b9fb81`](https://github.com/LedgerHQ/ledger-live/commit/2100b9fb81a4fd04f65b96561c0a7d618658843a) Thanks [@gre](https://github.com/gre)! - Introduce tests to ensure we define abandonseed values for coin we support

## 6.36.0-next.0

### Minor Changes

- [#1442](https://github.com/LedgerHQ/ledger-live/pull/1442) [`d3dc2c6877`](https://github.com/LedgerHQ/ledger-live/commit/d3dc2c6877fbdcaf68e442a781798d752fc5152d) Thanks [@sarneijim](https://github.com/sarneijim)! - Add bep20 exchange

### Patch Changes

- [#1419](https://github.com/LedgerHQ/ledger-live/pull/1419) [`2100b9fb81`](https://github.com/LedgerHQ/ledger-live/commit/2100b9fb81a4fd04f65b96561c0a7d618658843a) Thanks [@gre](https://github.com/gre)! - Introduce tests to ensure we define abandonseed values for coin we support

## 6.35.1

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

## 6.35.1-next.0

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

## 6.35.0

### Minor Changes

- [#1257](https://github.com/LedgerHQ/ledger-live/pull/1257) [`4f66046ef7`](https://github.com/LedgerHQ/ledger-live/commit/4f66046ef78ebcd14e6d63639f54834e90e6547a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - 20220912 CAL update

### Patch Changes

- [#1304](https://github.com/LedgerHQ/ledger-live/pull/1304) [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fixing currency inferences in cryptoassets, and reorder currencies as a temporary fix for the ticker/managerAppName collisions' side effects

## 6.35.0-next.0

### Minor Changes

- [#1257](https://github.com/LedgerHQ/ledger-live/pull/1257) [`4f66046ef7`](https://github.com/LedgerHQ/ledger-live/commit/4f66046ef78ebcd14e6d63639f54834e90e6547a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - 20220912 CAL update

### Patch Changes

- [#1304](https://github.com/LedgerHQ/ledger-live/pull/1304) [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fixing currency inferences in cryptoassets, and reorder currencies as a temporary fix for the ticker/managerAppName collisions' side effects

## 6.34.0

### Minor Changes

- [#669](https://github.com/LedgerHQ/ledger-live/pull/669) [`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754) Thanks [@andyhass](https://github.com/andyhass)! - Add Celo Staking

* [#995](https://github.com/LedgerHQ/ledger-live/pull/995) [`e80336b28`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220830

- [#995](https://github.com/LedgerHQ/ledger-live/pull/995) [`e80336b28`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220819

* [#810](https://github.com/LedgerHQ/ledger-live/pull/810) [`5dd957b3c`](https://github.com/LedgerHQ/ledger-live/commit/5dd957b3cb893668f044497d25b6eee69b05b2f0) Thanks [@balthazar](https://github.com/balthazar)! - Update ZIL&TT explorer and color

### Patch Changes

- [#1023](https://github.com/LedgerHQ/ledger-live/pull/1023) [`318e80452`](https://github.com/LedgerHQ/ledger-live/commit/318e80452569a0f91c4363ae50d2664419251dbd) Thanks [@gre](https://github.com/gre)! - Fixes testnet currencies to be \$0 valued on countervalues

## 6.34.0-next.1

### Minor Changes

- [#669](https://github.com/LedgerHQ/ledger-live/pull/669) [`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754) Thanks [@andyhass](https://github.com/andyhass)! - Add Celo Staking

## 6.34.0-next.0

### Minor Changes

- [#995](https://github.com/LedgerHQ/ledger-live/pull/995) [`e80336b284`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220830

* [#995](https://github.com/LedgerHQ/ledger-live/pull/995) [`e80336b284`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220819

- [#810](https://github.com/LedgerHQ/ledger-live/pull/810) [`5dd957b3cb`](https://github.com/LedgerHQ/ledger-live/commit/5dd957b3cb893668f044497d25b6eee69b05b2f0) Thanks [@balthazar](https://github.com/balthazar)! - Update ZIL&TT explorer and color

### Patch Changes

- [#1023](https://github.com/LedgerHQ/ledger-live/pull/1023) [`318e804525`](https://github.com/LedgerHQ/ledger-live/commit/318e80452569a0f91c4363ae50d2664419251dbd) Thanks [@gre](https://github.com/gre)! - Fixes testnet currencies to be \$0 valued on countervalues

## 6.32.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

* [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

- [#887](https://github.com/LedgerHQ/ledger-live/pull/887) [`e2a9cfad63`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220809

## 6.33.0

### Minor Changes

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

## 6.33.0-next.0

### Minor Changes

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

## 6.32.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

* [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

- [#887](https://github.com/LedgerHQ/ledger-live/pull/887) [`e2a9cfad63`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220809

## 6.32.0-next.1

### Minor Changes

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e89`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

## 6.32.0-next.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

* [#887](https://github.com/LedgerHQ/ledger-live/pull/887) [`e2a9cfad6`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220809

## 6.31.0

### Minor Changes

- [#702](https://github.com/LedgerHQ/ledger-live/pull/702) [`3eeb1e18c`](https://github.com/LedgerHQ/ledger-live/commit/3eeb1e18c883eca22201fb0d882799e2f6667b58) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220721

## 6.31.0-next.0

### Minor Changes

- [#702](https://github.com/LedgerHQ/ledger-live/pull/702) [`3eeb1e18c`](https://github.com/LedgerHQ/ledger-live/commit/3eeb1e18c883eca22201fb0d882799e2f6667b58) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220721

## 6.30.0

### Minor Changes

- [#604](https://github.com/LedgerHQ/ledger-live/pull/604) [`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b) Thanks [@gre](https://github.com/gre)! - Set Goerli currency on coinType=60 per eth accepted convention

* [#462](https://github.com/LedgerHQ/ledger-live/pull/462) [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Cardano tokens in LLD

- [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

## 6.30.0-next.2

### Minor Changes

- [#462](https://github.com/LedgerHQ/ledger-live/pull/462) [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Cardano tokens in LLD

## 6.30.0-next.1

### Minor Changes

- [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

## 6.30.0-next.0

### Minor Changes

- [#604](https://github.com/LedgerHQ/ledger-live/pull/604) [`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b) Thanks [@gre](https://github.com/gre)! - Set Goerli currency on coinType=60 per eth accepted convention

## 6.29.0

### Minor Changes

- [#479](https://github.com/LedgerHQ/ledger-live/pull/479) [`6e956f22b`](https://github.com/LedgerHQ/ledger-live/commit/6e956f22bdf96f7a902b48a8cd231a34053d459b) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - Update CAL

## 6.29.0-next.0

### Minor Changes

- 6e956f22b: Update CAL
