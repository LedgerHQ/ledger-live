# @ledgerhq/wallet-cli

## 1.0.1

### Patch Changes

- Refresh README documentation for the stable v1 release and add agent guidance for wallet-cli command usage.

## 1.0.0

### Major Changes

- Promote wallet-cli to its first stable `1.0.0` release.
- Add npm binary publishing support for the wallet-cli wrapper and platform packages.
- Add swap quote and execute flows, including session management, `from`/`to` execution inputs, provider filtering, Changelly mapping to `changelly_v2`, token-to-token swaps, and supported currency data in quotes.
- `account discover` no longer exposes the raw V1 descriptor. Human output shows the session label in bold as the primary identifier; JSON output replaces descriptor strings with `{ label, freshAddress }` objects.
- Reject raw account descriptors as CLI arguments, require session labels from `account discover`, and reject extended private keys in descriptor parsing.
- Add token support for supported currencies.
- Add status and genuine check commands.
- Update wallet-cli for the `alpaca` to `coin-service` rename.
- Rename `AlpacaApi` references to `CoinModuleApi`.
- Await async operation serialization bridge calls.
- Update the wallet-cli skill file with swap coverage.
- Fix wallet CLI USB interruption and DMK teardown handling.

### Patch Changes

- Fix swap execution to keep the Exchange app session open across the full pipeline.
- Harden swap execute flags and zero-amount rate output.
- Fix `--no-verify` and other `--no-<flag>` negations being silently ignored.
- Route human stderr messages through the shared writer for consistent capture.
- Remove provider fee and network fee fields from swap CLI quotes.
- Remove dry-run mode from swap execute.
- Bundle `THIRD_PARTY_NOTICES.md` to satisfy upstream attribution.
- Ship the Apache-2.0 `LICENSE` file in wrapper and platform tarballs.

## 0.3.0

### Minor Changes

- [#16756](https://github.com/LedgerHQ/ledger-live/pull/16756) [`c36f57c`](https://github.com/LedgerHQ/ledger-live/commit/c36f57cc1b0ab17d2234beb5ab971cc3aa0babd0) Thanks [@Justkant](https://github.com/Justkant)! - Fix Windows WebUSB reconnect handling in wallet-cli

- [#16435](https://github.com/LedgerHQ/ledger-live/pull/16435) [`7d06007`](https://github.com/LedgerHQ/ledger-live/commit/7d06007c5ac3ba52551f7d602eb1dcd24759cb41) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix `send --dry-run` and `--rbf` boolean flag parsing; add `--data` option for EVM calldata

- [#16886](https://github.com/LedgerHQ/ledger-live/pull/16886) [`ce53342`](https://github.com/LedgerHQ/ledger-live/commit/ce53342114bded3d66f1b5668f03d4dcd81d8bce) Thanks [@Justkant](https://github.com/Justkant)! - Fix Windows WebUSB discovery when devices are connected after wallet-cli startup

- [#16881](https://github.com/LedgerHQ/ledger-live/pull/16881) [`c28ab41`](https://github.com/LedgerHQ/ledger-live/commit/c28ab4147ab73fec30bb9bb63df6d8d84f894410) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix Solana token send (e.g. USDC) crashing with "Resolution provided without a deviceModelId"

- [#16683](https://github.com/LedgerHQ/ledger-live/pull/16683) [`72ae5ec`](https://github.com/LedgerHQ/ledger-live/commit/72ae5ec62aa2457e99b2cb11444b8d7aeb1fc3b6) Thanks [@Justkant](https://github.com/Justkant)! - Improve wallet-cli device state handling and output consistency

- [#16906](https://github.com/LedgerHQ/ledger-live/pull/16906) [`da54ba3`](https://github.com/LedgerHQ/ledger-live/commit/da54ba3c89c7d83a49286d784b1abc27ba1bf32b) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix getQuote types

- [#16598](https://github.com/LedgerHQ/ledger-live/pull/16598) [`509e3fc`](https://github.com/LedgerHQ/ledger-live/commit/509e3fc04ccb3ecf9279c68c6c8d008b9473db21) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add session layer: `account discover` now persists found accounts to `~/.local/state/ledger-wallet-cli/session.yaml`. All `--account` flags accept session labels (e.g. `ethereum-1`) in addition to full descriptors. New `session view` and `session reset` commands.

### Patch Changes

- Updated dependencies [[`5ddf2f0`](https://github.com/LedgerHQ/ledger-live/commit/5ddf2f01fed8d74275aeeb292a7c5ec3e346af04), [`ec88011`](https://github.com/LedgerHQ/ledger-live/commit/ec88011f8ac95632d218e1a78ecfe93f7a4f20ab), [`53182fc`](https://github.com/LedgerHQ/ledger-live/commit/53182fc7a44263443775420afee4a12f29369870), [`ee83c6b`](https://github.com/LedgerHQ/ledger-live/commit/ee83c6bc4e0a449a7db517987a857c54b6b9c53c), [`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`7b63096`](https://github.com/LedgerHQ/ledger-live/commit/7b630968f16eeb18f04d499441a23e5587e59137), [`2def56d`](https://github.com/LedgerHQ/ledger-live/commit/2def56d641c0d08f5b1c57d35b068c114faf7c24), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`177494c`](https://github.com/LedgerHQ/ledger-live/commit/177494c5020375e49eaea26cead9cbbd14cd63be), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`05b5ea0`](https://github.com/LedgerHQ/ledger-live/commit/05b5ea0579f0325c669805711b298f2eb0bd6434), [`e9886ec`](https://github.com/LedgerHQ/ledger-live/commit/e9886ec8f6a5835a745b4e3c25920cae4f1bb11f), [`054a8e8`](https://github.com/LedgerHQ/ledger-live/commit/054a8e8c7d4e1be511232a53a015d0bcc111e62e), [`aa867e1`](https://github.com/LedgerHQ/ledger-live/commit/aa867e1f5191569c13daf0261572ee0e976f58f2), [`78557fd`](https://github.com/LedgerHQ/ledger-live/commit/78557fdbee0b7c7702fc20d8a89ac62525c9aef7), [`0d11df6`](https://github.com/LedgerHQ/ledger-live/commit/0d11df6ef8dc781171071824ad1c39e3beed7730), [`5457ea4`](https://github.com/LedgerHQ/ledger-live/commit/5457ea4d13f10341403fdfec2d1fbef64cc14682), [`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25), [`add6026`](https://github.com/LedgerHQ/ledger-live/commit/add60262f879ec9288802a687f31fcc476b81ff9), [`263f6f5`](https://github.com/LedgerHQ/ledger-live/commit/263f6f5d4a5586adfff0e8a9c89de7e0276430d5), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`8bf2ba7`](https://github.com/LedgerHQ/ledger-live/commit/8bf2ba7039d42a8c50394e3ac10685be79698f91), [`7915844`](https://github.com/LedgerHQ/ledger-live/commit/7915844a237bfa98db947c42c8c0085a40840dd7), [`46b7bc6`](https://github.com/LedgerHQ/ledger-live/commit/46b7bc6c78f316c75feabb7172665b1c1a6b87e7), [`bc99a32`](https://github.com/LedgerHQ/ledger-live/commit/bc99a32703ac5b4a30de79c2eebac0f1936a7f83), [`5690acc`](https://github.com/LedgerHQ/ledger-live/commit/5690accdbdfd6939eb4e91f6b0b93e351cb33e5c), [`82a3565`](https://github.com/LedgerHQ/ledger-live/commit/82a35656fe999624004b7f166339433d024f1619), [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7), [`8e645a0`](https://github.com/LedgerHQ/ledger-live/commit/8e645a06e3e5037812e920d462d51ae615bd6ae7), [`ab344cb`](https://github.com/LedgerHQ/ledger-live/commit/ab344cb9b820fd96fd36c04077cbbb34b7d765d5), [`a0106e4`](https://github.com/LedgerHQ/ledger-live/commit/a0106e4302776fccc0381125d4e5be4fee0e409b), [`8ddc772`](https://github.com/LedgerHQ/ledger-live/commit/8ddc772661cdfb9e89df3e7954532658dddf35ca), [`561b86b`](https://github.com/LedgerHQ/ledger-live/commit/561b86be1f972908ae950e362912519e3904917d), [`d0e4008`](https://github.com/LedgerHQ/ledger-live/commit/d0e40084a958eddb422954f37b8bbf406910d3c6), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`e4f79db`](https://github.com/LedgerHQ/ledger-live/commit/e4f79dbd58b47a02f2cc8229f9fe2866f3c8dbec), [`4135055`](https://github.com/LedgerHQ/ledger-live/commit/4135055cd19e68b064f27454c536fcc5b047ffbb), [`537b277`](https://github.com/LedgerHQ/ledger-live/commit/537b277c998887dd762887f1102e50f9791c6152), [`8097fbc`](https://github.com/LedgerHQ/ledger-live/commit/8097fbc6d8bc422c42f74d92877bb5bed300a2e2), [`a22ac3e`](https://github.com/LedgerHQ/ledger-live/commit/a22ac3e225f7de60a6bc1906922a60080d1a8dcb), [`c323402`](https://github.com/LedgerHQ/ledger-live/commit/c3234025d77a1acefdbf57c7774f0d12bf34f63f), [`4daea73`](https://github.com/LedgerHQ/ledger-live/commit/4daea739d928bbd0c3c3c575ad97e30907acaeb5), [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6), [`772a16e`](https://github.com/LedgerHQ/ledger-live/commit/772a16eb188ac03fb9c3c509282ea58b7a840831), [`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9), [`7f80800`](https://github.com/LedgerHQ/ledger-live/commit/7f80800b3949541e54a6000cfe9398844e23ccff), [`ef08282`](https://github.com/LedgerHQ/ledger-live/commit/ef08282513f27162b3ebc411315b29f6bd1a367d), [`05c7997`](https://github.com/LedgerHQ/ledger-live/commit/05c7997780ff8aa30ab7c16eb1e8a59563b44482), [`3fee08f`](https://github.com/LedgerHQ/ledger-live/commit/3fee08faa998082e23de114574920d0c6d1ea84d), [`02d837c`](https://github.com/LedgerHQ/ledger-live/commit/02d837c6cbb4387e3957eee11cc8b4512a70fe97), [`2d5ee2b`](https://github.com/LedgerHQ/ledger-live/commit/2d5ee2bc8380e1ec8e30f2818d234527b0f2b006), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`df992ba`](https://github.com/LedgerHQ/ledger-live/commit/df992ba149c629f70290506045e11944821874a5), [`b8800ee`](https://github.com/LedgerHQ/ledger-live/commit/b8800ee391b24bd878a2a5e8b86008b9f3142786), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/live-common@34.71.0
  - @ledgerhq/types-live@6.107.0
  - @ledgerhq/coin-evm@3.6.0
  - @ledgerhq/coin-bitcoin@0.40.0
  - @ledgerhq/ledger-wallet-framework@1.4.0
  - @ledgerhq/coin-solana@0.52.0
  - @ledgerhq/live-env@2.34.0
  - @ledgerhq/errors@6.35.0
  - @ledgerhq/live-dmk-shared@0.23.0
  - @shared/schema-primitives@0.2.0
  - @ledgerhq/cryptoassets@13.47.0
  - @ledgerhq/live-wallet@0.25.3
  - @ledgerhq/hw-transport@6.35.2

## 0.3.0-next.1

### Patch Changes

- Updated dependencies [[`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9)]:
  - @ledgerhq/cryptoassets@13.47.0-next.1
  - @ledgerhq/ledger-wallet-framework@1.4.0-next.1
  - @ledgerhq/live-common@34.71.0-next.1
  - @ledgerhq/coin-bitcoin@0.40.0-next.1
  - @ledgerhq/coin-evm@3.6.0-next.1
  - @ledgerhq/coin-solana@0.52.0-next.1
  - @ledgerhq/live-wallet@0.25.3-next.1

## 0.3.0-next.0

### Minor Changes

- [#16756](https://github.com/LedgerHQ/ledger-live/pull/16756) [`c36f57c`](https://github.com/LedgerHQ/ledger-live/commit/c36f57cc1b0ab17d2234beb5ab971cc3aa0babd0) Thanks [@Justkant](https://github.com/Justkant)! - Fix Windows WebUSB reconnect handling in wallet-cli

- [#16435](https://github.com/LedgerHQ/ledger-live/pull/16435) [`7d06007`](https://github.com/LedgerHQ/ledger-live/commit/7d06007c5ac3ba52551f7d602eb1dcd24759cb41) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix `send --dry-run` and `--rbf` boolean flag parsing; add `--data` option for EVM calldata

- [#16886](https://github.com/LedgerHQ/ledger-live/pull/16886) [`ce53342`](https://github.com/LedgerHQ/ledger-live/commit/ce53342114bded3d66f1b5668f03d4dcd81d8bce) Thanks [@Justkant](https://github.com/Justkant)! - Fix Windows WebUSB discovery when devices are connected after wallet-cli startup

- [#16881](https://github.com/LedgerHQ/ledger-live/pull/16881) [`c28ab41`](https://github.com/LedgerHQ/ledger-live/commit/c28ab4147ab73fec30bb9bb63df6d8d84f894410) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix Solana token send (e.g. USDC) crashing with "Resolution provided without a deviceModelId"

- [#16683](https://github.com/LedgerHQ/ledger-live/pull/16683) [`72ae5ec`](https://github.com/LedgerHQ/ledger-live/commit/72ae5ec62aa2457e99b2cb11444b8d7aeb1fc3b6) Thanks [@Justkant](https://github.com/Justkant)! - Improve wallet-cli device state handling and output consistency

- [#16906](https://github.com/LedgerHQ/ledger-live/pull/16906) [`da54ba3`](https://github.com/LedgerHQ/ledger-live/commit/da54ba3c89c7d83a49286d784b1abc27ba1bf32b) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix getQuote types

- [#16598](https://github.com/LedgerHQ/ledger-live/pull/16598) [`509e3fc`](https://github.com/LedgerHQ/ledger-live/commit/509e3fc04ccb3ecf9279c68c6c8d008b9473db21) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add session layer: `account discover` now persists found accounts to `~/.local/state/ledger-wallet-cli/session.yaml`. All `--account` flags accept session labels (e.g. `ethereum-1`) in addition to full descriptors. New `session view` and `session reset` commands.

### Patch Changes

- Updated dependencies [[`5ddf2f0`](https://github.com/LedgerHQ/ledger-live/commit/5ddf2f01fed8d74275aeeb292a7c5ec3e346af04), [`ec88011`](https://github.com/LedgerHQ/ledger-live/commit/ec88011f8ac95632d218e1a78ecfe93f7a4f20ab), [`53182fc`](https://github.com/LedgerHQ/ledger-live/commit/53182fc7a44263443775420afee4a12f29369870), [`ee83c6b`](https://github.com/LedgerHQ/ledger-live/commit/ee83c6bc4e0a449a7db517987a857c54b6b9c53c), [`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`7b63096`](https://github.com/LedgerHQ/ledger-live/commit/7b630968f16eeb18f04d499441a23e5587e59137), [`2def56d`](https://github.com/LedgerHQ/ledger-live/commit/2def56d641c0d08f5b1c57d35b068c114faf7c24), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`177494c`](https://github.com/LedgerHQ/ledger-live/commit/177494c5020375e49eaea26cead9cbbd14cd63be), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`05b5ea0`](https://github.com/LedgerHQ/ledger-live/commit/05b5ea0579f0325c669805711b298f2eb0bd6434), [`e9886ec`](https://github.com/LedgerHQ/ledger-live/commit/e9886ec8f6a5835a745b4e3c25920cae4f1bb11f), [`054a8e8`](https://github.com/LedgerHQ/ledger-live/commit/054a8e8c7d4e1be511232a53a015d0bcc111e62e), [`aa867e1`](https://github.com/LedgerHQ/ledger-live/commit/aa867e1f5191569c13daf0261572ee0e976f58f2), [`78557fd`](https://github.com/LedgerHQ/ledger-live/commit/78557fdbee0b7c7702fc20d8a89ac62525c9aef7), [`0d11df6`](https://github.com/LedgerHQ/ledger-live/commit/0d11df6ef8dc781171071824ad1c39e3beed7730), [`5457ea4`](https://github.com/LedgerHQ/ledger-live/commit/5457ea4d13f10341403fdfec2d1fbef64cc14682), [`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25), [`add6026`](https://github.com/LedgerHQ/ledger-live/commit/add60262f879ec9288802a687f31fcc476b81ff9), [`263f6f5`](https://github.com/LedgerHQ/ledger-live/commit/263f6f5d4a5586adfff0e8a9c89de7e0276430d5), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`8bf2ba7`](https://github.com/LedgerHQ/ledger-live/commit/8bf2ba7039d42a8c50394e3ac10685be79698f91), [`7915844`](https://github.com/LedgerHQ/ledger-live/commit/7915844a237bfa98db947c42c8c0085a40840dd7), [`46b7bc6`](https://github.com/LedgerHQ/ledger-live/commit/46b7bc6c78f316c75feabb7172665b1c1a6b87e7), [`bc99a32`](https://github.com/LedgerHQ/ledger-live/commit/bc99a32703ac5b4a30de79c2eebac0f1936a7f83), [`5690acc`](https://github.com/LedgerHQ/ledger-live/commit/5690accdbdfd6939eb4e91f6b0b93e351cb33e5c), [`82a3565`](https://github.com/LedgerHQ/ledger-live/commit/82a35656fe999624004b7f166339433d024f1619), [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7), [`8e645a0`](https://github.com/LedgerHQ/ledger-live/commit/8e645a06e3e5037812e920d462d51ae615bd6ae7), [`ab344cb`](https://github.com/LedgerHQ/ledger-live/commit/ab344cb9b820fd96fd36c04077cbbb34b7d765d5), [`a0106e4`](https://github.com/LedgerHQ/ledger-live/commit/a0106e4302776fccc0381125d4e5be4fee0e409b), [`8ddc772`](https://github.com/LedgerHQ/ledger-live/commit/8ddc772661cdfb9e89df3e7954532658dddf35ca), [`561b86b`](https://github.com/LedgerHQ/ledger-live/commit/561b86be1f972908ae950e362912519e3904917d), [`d0e4008`](https://github.com/LedgerHQ/ledger-live/commit/d0e40084a958eddb422954f37b8bbf406910d3c6), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`e4f79db`](https://github.com/LedgerHQ/ledger-live/commit/e4f79dbd58b47a02f2cc8229f9fe2866f3c8dbec), [`4135055`](https://github.com/LedgerHQ/ledger-live/commit/4135055cd19e68b064f27454c536fcc5b047ffbb), [`537b277`](https://github.com/LedgerHQ/ledger-live/commit/537b277c998887dd762887f1102e50f9791c6152), [`8097fbc`](https://github.com/LedgerHQ/ledger-live/commit/8097fbc6d8bc422c42f74d92877bb5bed300a2e2), [`a22ac3e`](https://github.com/LedgerHQ/ledger-live/commit/a22ac3e225f7de60a6bc1906922a60080d1a8dcb), [`c323402`](https://github.com/LedgerHQ/ledger-live/commit/c3234025d77a1acefdbf57c7774f0d12bf34f63f), [`4daea73`](https://github.com/LedgerHQ/ledger-live/commit/4daea739d928bbd0c3c3c575ad97e30907acaeb5), [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6), [`772a16e`](https://github.com/LedgerHQ/ledger-live/commit/772a16eb188ac03fb9c3c509282ea58b7a840831), [`7f80800`](https://github.com/LedgerHQ/ledger-live/commit/7f80800b3949541e54a6000cfe9398844e23ccff), [`ef08282`](https://github.com/LedgerHQ/ledger-live/commit/ef08282513f27162b3ebc411315b29f6bd1a367d), [`05c7997`](https://github.com/LedgerHQ/ledger-live/commit/05c7997780ff8aa30ab7c16eb1e8a59563b44482), [`3fee08f`](https://github.com/LedgerHQ/ledger-live/commit/3fee08faa998082e23de114574920d0c6d1ea84d), [`02d837c`](https://github.com/LedgerHQ/ledger-live/commit/02d837c6cbb4387e3957eee11cc8b4512a70fe97), [`2d5ee2b`](https://github.com/LedgerHQ/ledger-live/commit/2d5ee2bc8380e1ec8e30f2818d234527b0f2b006), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`df992ba`](https://github.com/LedgerHQ/ledger-live/commit/df992ba149c629f70290506045e11944821874a5), [`b8800ee`](https://github.com/LedgerHQ/ledger-live/commit/b8800ee391b24bd878a2a5e8b86008b9f3142786), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/live-common@34.71.0-next.0
  - @ledgerhq/types-live@6.107.0-next.0
  - @ledgerhq/coin-evm@3.6.0-next.0
  - @ledgerhq/coin-bitcoin@0.40.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.4.0-next.0
  - @ledgerhq/coin-solana@0.52.0-next.0
  - @ledgerhq/live-env@2.34.0-next.0
  - @ledgerhq/errors@6.35.0-next.0
  - @ledgerhq/live-dmk-shared@0.23.0-next.0
  - @shared/schema-primitives@0.2.0-next.0
  - @ledgerhq/cryptoassets@13.47.0-next.0
  - @ledgerhq/live-wallet@0.25.3-next.0
  - @ledgerhq/hw-transport@6.35.2-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1
  - @ledgerhq/live-common@34.70.1
  - @ledgerhq/coin-bitcoin@0.39.1
  - @ledgerhq/coin-evm@3.5.1
  - @ledgerhq/coin-solana@0.51.2
  - @ledgerhq/ledger-wallet-framework@1.3.2
  - @ledgerhq/cryptoassets@13.46.2
  - @ledgerhq/hw-transport@6.35.2
  - @ledgerhq/live-wallet@0.25.3
  - @ledgerhq/live-dmk-shared@0.22.3

## 0.2.1-hotfix.0

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1-hotfix.0
  - @ledgerhq/live-common@34.70.1-hotfix.0
  - @ledgerhq/coin-bitcoin@0.39.1-hotfix.0
  - @ledgerhq/coin-evm@3.5.1-hotfix.0
  - @ledgerhq/coin-solana@0.51.2-hotfix.0
  - @ledgerhq/ledger-wallet-framework@1.3.2-hotfix.0
  - @ledgerhq/cryptoassets@13.46.2-hotfix.0
  - @ledgerhq/hw-transport@6.35.2-hotfix.0
  - @ledgerhq/live-wallet@0.25.3-hotfix.0
  - @ledgerhq/live-dmk-shared@0.22.3-hotfix.0

## 0.2.0

### Minor Changes

- [#16470](https://github.com/LedgerHQ/ledger-live/pull/16470) [`e671ee0`](https://github.com/LedgerHQ/ledger-live/commit/e671ee0781983bbddfc3dffbbf386e680d3888ac) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove direct runtime imports of `@ledgerhq/coin-*` packages from shared live-common code (`account/helpers`, `operation`, `bridge/generic-alpaca/validateAddress`); all coin-specific behaviour is now deferred via the `coinModuleLoaders` registry. wallet-cli no longer needs the tronweb proto polyfill as a side effect.

- [#16507](https://github.com/LedgerHQ/ledger-live/pull/16507) [`070336d`](https://github.com/LedgerHQ/ledger-live/commit/070336d7156850df82ab16ca3d09d6afd6398c91) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix bare boolean flags (`--dry-run`, `--rbf`, `--verify`) being silently ignored. Previously `--dry-run` without an explicit value routed the send command to the full sign-and-broadcast path; now it correctly activates the dry-run path. Root cause: missing `argumentKind: "flag"` on all boolean options.

- [#16428](https://github.com/LedgerHQ/ledger-live/pull/16428) [`20a622b`](https://github.com/LedgerHQ/ledger-live/commit/20a622b84b69ceffda6451fced071d759424532d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix JSON mode error output: route error envelopes to stdout (not stderr) so they are captured reliably on all platforms, use correct `{ ok: false, error: { command, message } }` envelope shape, and ensure invalid descriptor errors are caught by the error boundary

- [#16386](https://github.com/LedgerHQ/ledger-live/pull/16386) [`542fa64`](https://github.com/LedgerHQ/ledger-live/commit/542fa64145d67864c080459577577dcfeb2cf5d4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add optional `data` (0x-prefixed hex calldata) field to `EvmTransactionIntentSchema`, enabling arbitrary EVM contract interactions. The bridge adapter propagates it to the live-common EVM transaction's `data: Buffer` field.

- [#16392](https://github.com/LedgerHQ/ledger-live/pull/16392) [`e39bb03`](https://github.com/LedgerHQ/ledger-live/commit/e39bb0304c12cd32389e005e1ce02254f86b72ee) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add `account fresh-address` command: resolves the fresh receive address from a V1 descriptor without requiring a device. For address-based chains (EVM, Solana) the address is extracted directly — no sync. For UTXO chains (Bitcoin) the bridge sync finds the next unused address.

- [#16416](https://github.com/LedgerHQ/ledger-live/pull/16416) [`24915a2`](https://github.com/LedgerHQ/ledger-live/commit/24915a29c6b1bb4c8b0b435dabf889443721cc33) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Refactor: shared option definitions and unified CommandOutput abstraction across all commands

### Patch Changes

- Updated dependencies [[`292828a`](https://github.com/LedgerHQ/ledger-live/commit/292828a9797e39f6524f84a0f1064381013e2c77), [`c764fc7`](https://github.com/LedgerHQ/ledger-live/commit/c764fc74b2a0d28a6cd1ec1892968b5eb9845b14), [`e671ee0`](https://github.com/LedgerHQ/ledger-live/commit/e671ee0781983bbddfc3dffbbf386e680d3888ac), [`12eb67a`](https://github.com/LedgerHQ/ledger-live/commit/12eb67ae64f08b589c2009c977895a557d1c156f), [`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95), [`b7cdf0e`](https://github.com/LedgerHQ/ledger-live/commit/b7cdf0e7c6faca170af3bfed9042165c74517ae4), [`317c479`](https://github.com/LedgerHQ/ledger-live/commit/317c479353be58645e9581175081619d76a9b5c3), [`2374fcf`](https://github.com/LedgerHQ/ledger-live/commit/2374fcf74a240431baab4f2c73bbb1c913a0f7d5), [`b661cd9`](https://github.com/LedgerHQ/ledger-live/commit/b661cd965e9634840e2ebafb2fbbd1b1328ce98f), [`c51170a`](https://github.com/LedgerHQ/ledger-live/commit/c51170a8d615d5eb3b10b0572d4960e0d36ebc6b), [`8ade8bd`](https://github.com/LedgerHQ/ledger-live/commit/8ade8bdfb0826dc1dbea50a3aa4682cab52ee7b6), [`3e00c6c`](https://github.com/LedgerHQ/ledger-live/commit/3e00c6c2c70497cdb41ae939e97c57bb0911e46c), [`178bda8`](https://github.com/LedgerHQ/ledger-live/commit/178bda8455ef6aca48eaa00ccc0c37adf582d86f), [`093017c`](https://github.com/LedgerHQ/ledger-live/commit/093017c2743cc634dfe328f5d28c35df1eae6429), [`025b4ae`](https://github.com/LedgerHQ/ledger-live/commit/025b4aececb5752ec6a0b4e29562716597308a54), [`e377079`](https://github.com/LedgerHQ/ledger-live/commit/e3770793670b73d4409bd5be2081ca922e8679ac), [`e23ca29`](https://github.com/LedgerHQ/ledger-live/commit/e23ca29bb4fd553ff7612d1ea4d9f0e70f7fe0c7), [`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee), [`c619afb`](https://github.com/LedgerHQ/ledger-live/commit/c619afb939fb32c6c669fc700493fce8f2bde49d), [`9099298`](https://github.com/LedgerHQ/ledger-live/commit/9099298c0fed96aea636b4c31f5d36d7d1f57f85), [`1e47a25`](https://github.com/LedgerHQ/ledger-live/commit/1e47a25b02490fef7896d31c41c8609765939f97), [`5c4efa6`](https://github.com/LedgerHQ/ledger-live/commit/5c4efa6c748a7fab0e14bd8b8c975e71ed77756a), [`4afb1f9`](https://github.com/LedgerHQ/ledger-live/commit/4afb1f982d535c6fc8166281ff4fa1ed03569265), [`8dbf2f3`](https://github.com/LedgerHQ/ledger-live/commit/8dbf2f3808af7a5f1ffe279fc99d0b64350779ef)]:
  - @ledgerhq/live-common@34.70.0
  - @ledgerhq/coin-evm@3.5.0
  - @ledgerhq/types-live@6.106.0
  - @ledgerhq/coin-bitcoin@0.39.0
  - @ledgerhq/coin-solana@0.51.1
  - @ledgerhq/ledger-wallet-framework@1.3.1
  - @ledgerhq/cryptoassets@13.46.1
  - @ledgerhq/live-wallet@0.25.2

## 0.2.0-next.1

### Patch Changes

- Updated dependencies [[`3e00c6c`](https://github.com/LedgerHQ/ledger-live/commit/3e00c6c2c70497cdb41ae939e97c57bb0911e46c)]:
  - @ledgerhq/live-common@34.70.0-next.1

## 0.2.0-next.0

### Minor Changes

- [#16470](https://github.com/LedgerHQ/ledger-live/pull/16470) [`e671ee0`](https://github.com/LedgerHQ/ledger-live/commit/e671ee0781983bbddfc3dffbbf386e680d3888ac) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove direct runtime imports of `@ledgerhq/coin-*` packages from shared live-common code (`account/helpers`, `operation`, `bridge/generic-alpaca/validateAddress`); all coin-specific behaviour is now deferred via the `coinModuleLoaders` registry. wallet-cli no longer needs the tronweb proto polyfill as a side effect.

- [#16507](https://github.com/LedgerHQ/ledger-live/pull/16507) [`070336d`](https://github.com/LedgerHQ/ledger-live/commit/070336d7156850df82ab16ca3d09d6afd6398c91) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix bare boolean flags (`--dry-run`, `--rbf`, `--verify`) being silently ignored. Previously `--dry-run` without an explicit value routed the send command to the full sign-and-broadcast path; now it correctly activates the dry-run path. Root cause: missing `argumentKind: "flag"` on all boolean options.

- [#16428](https://github.com/LedgerHQ/ledger-live/pull/16428) [`20a622b`](https://github.com/LedgerHQ/ledger-live/commit/20a622b84b69ceffda6451fced071d759424532d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix JSON mode error output: route error envelopes to stdout (not stderr) so they are captured reliably on all platforms, use correct `{ ok: false, error: { command, message } }` envelope shape, and ensure invalid descriptor errors are caught by the error boundary

- [#16386](https://github.com/LedgerHQ/ledger-live/pull/16386) [`542fa64`](https://github.com/LedgerHQ/ledger-live/commit/542fa64145d67864c080459577577dcfeb2cf5d4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add optional `data` (0x-prefixed hex calldata) field to `EvmTransactionIntentSchema`, enabling arbitrary EVM contract interactions. The bridge adapter propagates it to the live-common EVM transaction's `data: Buffer` field.

- [#16392](https://github.com/LedgerHQ/ledger-live/pull/16392) [`e39bb03`](https://github.com/LedgerHQ/ledger-live/commit/e39bb0304c12cd32389e005e1ce02254f86b72ee) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add `account fresh-address` command: resolves the fresh receive address from a V1 descriptor without requiring a device. For address-based chains (EVM, Solana) the address is extracted directly — no sync. For UTXO chains (Bitcoin) the bridge sync finds the next unused address.

- [#16416](https://github.com/LedgerHQ/ledger-live/pull/16416) [`24915a2`](https://github.com/LedgerHQ/ledger-live/commit/24915a29c6b1bb4c8b0b435dabf889443721cc33) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Refactor: shared option definitions and unified CommandOutput abstraction across all commands

### Patch Changes

- Updated dependencies [[`292828a`](https://github.com/LedgerHQ/ledger-live/commit/292828a9797e39f6524f84a0f1064381013e2c77), [`c764fc7`](https://github.com/LedgerHQ/ledger-live/commit/c764fc74b2a0d28a6cd1ec1892968b5eb9845b14), [`e671ee0`](https://github.com/LedgerHQ/ledger-live/commit/e671ee0781983bbddfc3dffbbf386e680d3888ac), [`12eb67a`](https://github.com/LedgerHQ/ledger-live/commit/12eb67ae64f08b589c2009c977895a557d1c156f), [`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95), [`b7cdf0e`](https://github.com/LedgerHQ/ledger-live/commit/b7cdf0e7c6faca170af3bfed9042165c74517ae4), [`317c479`](https://github.com/LedgerHQ/ledger-live/commit/317c479353be58645e9581175081619d76a9b5c3), [`2374fcf`](https://github.com/LedgerHQ/ledger-live/commit/2374fcf74a240431baab4f2c73bbb1c913a0f7d5), [`b661cd9`](https://github.com/LedgerHQ/ledger-live/commit/b661cd965e9634840e2ebafb2fbbd1b1328ce98f), [`c51170a`](https://github.com/LedgerHQ/ledger-live/commit/c51170a8d615d5eb3b10b0572d4960e0d36ebc6b), [`8ade8bd`](https://github.com/LedgerHQ/ledger-live/commit/8ade8bdfb0826dc1dbea50a3aa4682cab52ee7b6), [`178bda8`](https://github.com/LedgerHQ/ledger-live/commit/178bda8455ef6aca48eaa00ccc0c37adf582d86f), [`093017c`](https://github.com/LedgerHQ/ledger-live/commit/093017c2743cc634dfe328f5d28c35df1eae6429), [`025b4ae`](https://github.com/LedgerHQ/ledger-live/commit/025b4aececb5752ec6a0b4e29562716597308a54), [`e377079`](https://github.com/LedgerHQ/ledger-live/commit/e3770793670b73d4409bd5be2081ca922e8679ac), [`e23ca29`](https://github.com/LedgerHQ/ledger-live/commit/e23ca29bb4fd553ff7612d1ea4d9f0e70f7fe0c7), [`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee), [`c619afb`](https://github.com/LedgerHQ/ledger-live/commit/c619afb939fb32c6c669fc700493fce8f2bde49d), [`9099298`](https://github.com/LedgerHQ/ledger-live/commit/9099298c0fed96aea636b4c31f5d36d7d1f57f85), [`1e47a25`](https://github.com/LedgerHQ/ledger-live/commit/1e47a25b02490fef7896d31c41c8609765939f97), [`5c4efa6`](https://github.com/LedgerHQ/ledger-live/commit/5c4efa6c748a7fab0e14bd8b8c975e71ed77756a), [`4afb1f9`](https://github.com/LedgerHQ/ledger-live/commit/4afb1f982d535c6fc8166281ff4fa1ed03569265), [`8dbf2f3`](https://github.com/LedgerHQ/ledger-live/commit/8dbf2f3808af7a5f1ffe279fc99d0b64350779ef)]:
  - @ledgerhq/live-common@34.70.0-next.0
  - @ledgerhq/coin-evm@3.5.0-next.0
  - @ledgerhq/types-live@6.106.0-next.0
  - @ledgerhq/coin-bitcoin@0.39.0-next.0
  - @ledgerhq/coin-solana@0.51.1-next.0
  - @ledgerhq/ledger-wallet-framework@1.3.1-next.0
  - @ledgerhq/cryptoassets@13.46.1-next.0
  - @ledgerhq/live-wallet@0.25.2-next.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`648956f`](https://github.com/LedgerHQ/ledger-live/commit/648956f027b02a76a6624fe64e5b2e152c7abc04), [`3d310a6`](https://github.com/LedgerHQ/ledger-live/commit/3d310a6b00dd1742fbd292545b8aa87b736932b4), [`44b4abc`](https://github.com/LedgerHQ/ledger-live/commit/44b4abc85fd456f1f364e7213add739d79321ccc), [`ad5a37d`](https://github.com/LedgerHQ/ledger-live/commit/ad5a37d077dced734defcd464f120825e7bbf5e9), [`0b3f80f`](https://github.com/LedgerHQ/ledger-live/commit/0b3f80f20a2fbf25875ab7ebce3924722099a5ab), [`710b0b2`](https://github.com/LedgerHQ/ledger-live/commit/710b0b214795f81272aa773d6427c184c386b660), [`242028a`](https://github.com/LedgerHQ/ledger-live/commit/242028aafdaca520aeb4a9b818c9f91f2d35ab43), [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8), [`13faa62`](https://github.com/LedgerHQ/ledger-live/commit/13faa62f0c2c7b6102c4ba33bdfed77354403860), [`966b159`](https://github.com/LedgerHQ/ledger-live/commit/966b159634bee81955c8b07b7fa5d98bb3a9cb07), [`206730c`](https://github.com/LedgerHQ/ledger-live/commit/206730c71ded9a6ea54254ad39da796c38f4c7ee), [`0d745c6`](https://github.com/LedgerHQ/ledger-live/commit/0d745c68eab72411201843d8aa20c127fc98d189), [`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01), [`1cee996`](https://github.com/LedgerHQ/ledger-live/commit/1cee9961e8bcf46793fa11fc86ce9ae32883f860), [`8733fc5`](https://github.com/LedgerHQ/ledger-live/commit/8733fc55b61d0c76776674f80b9899344da38508), [`560708f`](https://github.com/LedgerHQ/ledger-live/commit/560708fafbb61c0f1aac5763bfb2b27ec201e2bf), [`5e17255`](https://github.com/LedgerHQ/ledger-live/commit/5e172557f706459cdda9f684cf56d13bbc968986), [`02831f2`](https://github.com/LedgerHQ/ledger-live/commit/02831f222367ffe67858b7a3c3984c495d0ebb29), [`78acbfa`](https://github.com/LedgerHQ/ledger-live/commit/78acbfae7319c5b3fb1453f8727e2210e895669c), [`5082f0d`](https://github.com/LedgerHQ/ledger-live/commit/5082f0d7dd1a9e73b97b2226782c63a579ca4331), [`936164c`](https://github.com/LedgerHQ/ledger-live/commit/936164cfa7d0dd2ef97deb16004a211598eeab37), [`1bd0cac`](https://github.com/LedgerHQ/ledger-live/commit/1bd0cac7957422fa06e18424e9e2706c39072078), [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb), [`3b83607`](https://github.com/LedgerHQ/ledger-live/commit/3b83607a045142a8408784c92b57d8bde01445df), [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb), [`de99bc1`](https://github.com/LedgerHQ/ledger-live/commit/de99bc14f09e699af591dc6acf12f9547d792dfd), [`367c7e0`](https://github.com/LedgerHQ/ledger-live/commit/367c7e03f07b3f2ae96927fc33d12e35ffe81621), [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9), [`139cdbf`](https://github.com/LedgerHQ/ledger-live/commit/139cdbfd48120247ff54f5f7863ce866a6a755d0), [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58), [`37fe0e0`](https://github.com/LedgerHQ/ledger-live/commit/37fe0e0011efb6b9cf4e7a9d1ddb01768aa77798), [`946be6e`](https://github.com/LedgerHQ/ledger-live/commit/946be6e0111c79e77eb486619b4ad645523b1966), [`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d), [`bcc9607`](https://github.com/LedgerHQ/ledger-live/commit/bcc960793ca72aa4f05b46c726db9cba82a4b9a7), [`197fed7`](https://github.com/LedgerHQ/ledger-live/commit/197fed7554701e0bbe96c7c3f819d8dba297ba48), [`e83e793`](https://github.com/LedgerHQ/ledger-live/commit/e83e79399bf1d9b2edf9e6b242f18162dfa5a8a3), [`dc2ca09`](https://github.com/LedgerHQ/ledger-live/commit/dc2ca093de2957966455f15a94c470431783fbb4), [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754), [`0c78234`](https://github.com/LedgerHQ/ledger-live/commit/0c78234bfb672411b6950a874f4b50f864ac40b9), [`8a4b151`](https://github.com/LedgerHQ/ledger-live/commit/8a4b1511dcac3bbd6066996aecd4dedbaf1f24c0), [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839), [`b599228`](https://github.com/LedgerHQ/ledger-live/commit/b59922882b679b2e2a5069707a233d9cb6293881), [`93f3199`](https://github.com/LedgerHQ/ledger-live/commit/93f3199af5ba10f269e11b3ac37ffa77b8a05e0f), [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440), [`11cd80f`](https://github.com/LedgerHQ/ledger-live/commit/11cd80f7c262f3e44fbbb19a8b034e9767c02db6), [`46e78cf`](https://github.com/LedgerHQ/ledger-live/commit/46e78cf3a057a9de39a5abbb49fe779655db6507), [`cd59c95`](https://github.com/LedgerHQ/ledger-live/commit/cd59c95d04bd886114802ca887e1209d2191eaee), [`d9c2b45`](https://github.com/LedgerHQ/ledger-live/commit/d9c2b454793568993215c2be6e448cb2f90fdb6d), [`12ac92f`](https://github.com/LedgerHQ/ledger-live/commit/12ac92f7418f2248673257f9900490ade204d086), [`4e95387`](https://github.com/LedgerHQ/ledger-live/commit/4e953874f6c1ea274f54640cb50744c85dfc3e41), [`0e803da`](https://github.com/LedgerHQ/ledger-live/commit/0e803dac441988ba47d3c915c124319c1cfe0b86), [`f9c30a8`](https://github.com/LedgerHQ/ledger-live/commit/f9c30a86fcc8b1cc75149c7c8df2a5e166754226), [`2b02dbd`](https://github.com/LedgerHQ/ledger-live/commit/2b02dbd791a761890837c664e002d682ac335d0a), [`6da0c45`](https://github.com/LedgerHQ/ledger-live/commit/6da0c451d3099a7ce610eff343cae84442f4ac30), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21), [`5b0974a`](https://github.com/LedgerHQ/ledger-live/commit/5b0974a146ce57b30b48769cb512c1443aa7f97d)]:
  - @ledgerhq/coin-bitcoin@0.38.0
  - @ledgerhq/live-common@34.69.0
  - @ledgerhq/cryptoassets@13.46.0
  - @ledgerhq/coin-evm@3.4.0
  - @ledgerhq/coin-solana@0.51.0
  - @ledgerhq/types-live@6.105.0
  - @ledgerhq/live-env@2.33.0
  - @ledgerhq/ledger-wallet-framework@1.3.0
  - @ledgerhq/errors@6.34.0
  - @ledgerhq/live-wallet@0.25.1
  - @ledgerhq/hw-transport@6.35.1
  - @ledgerhq/live-dmk-shared@0.22.2

## 0.1.1-next.3

### Patch Changes

- Updated dependencies [[`0b3f80f`](https://github.com/LedgerHQ/ledger-live/commit/0b3f80f20a2fbf25875ab7ebce3924722099a5ab)]:
  - @ledgerhq/live-common@34.69.0-next.3
  - @ledgerhq/coin-evm@3.4.0-next.1

## 0.1.1-next.2

### Patch Changes

- Updated dependencies [[`de99bc1`](https://github.com/LedgerHQ/ledger-live/commit/de99bc14f09e699af591dc6acf12f9547d792dfd)]:
  - @ledgerhq/live-common@34.69.0-next.2

## 0.1.1-next.1

### Patch Changes

- Updated dependencies [[`4e95387`](https://github.com/LedgerHQ/ledger-live/commit/4e953874f6c1ea274f54640cb50744c85dfc3e41)]:
  - @ledgerhq/live-common@34.69.0-next.1

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`648956f`](https://github.com/LedgerHQ/ledger-live/commit/648956f027b02a76a6624fe64e5b2e152c7abc04), [`3d310a6`](https://github.com/LedgerHQ/ledger-live/commit/3d310a6b00dd1742fbd292545b8aa87b736932b4), [`44b4abc`](https://github.com/LedgerHQ/ledger-live/commit/44b4abc85fd456f1f364e7213add739d79321ccc), [`ad5a37d`](https://github.com/LedgerHQ/ledger-live/commit/ad5a37d077dced734defcd464f120825e7bbf5e9), [`710b0b2`](https://github.com/LedgerHQ/ledger-live/commit/710b0b214795f81272aa773d6427c184c386b660), [`242028a`](https://github.com/LedgerHQ/ledger-live/commit/242028aafdaca520aeb4a9b818c9f91f2d35ab43), [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8), [`13faa62`](https://github.com/LedgerHQ/ledger-live/commit/13faa62f0c2c7b6102c4ba33bdfed77354403860), [`966b159`](https://github.com/LedgerHQ/ledger-live/commit/966b159634bee81955c8b07b7fa5d98bb3a9cb07), [`206730c`](https://github.com/LedgerHQ/ledger-live/commit/206730c71ded9a6ea54254ad39da796c38f4c7ee), [`0d745c6`](https://github.com/LedgerHQ/ledger-live/commit/0d745c68eab72411201843d8aa20c127fc98d189), [`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01), [`1cee996`](https://github.com/LedgerHQ/ledger-live/commit/1cee9961e8bcf46793fa11fc86ce9ae32883f860), [`8733fc5`](https://github.com/LedgerHQ/ledger-live/commit/8733fc55b61d0c76776674f80b9899344da38508), [`560708f`](https://github.com/LedgerHQ/ledger-live/commit/560708fafbb61c0f1aac5763bfb2b27ec201e2bf), [`5e17255`](https://github.com/LedgerHQ/ledger-live/commit/5e172557f706459cdda9f684cf56d13bbc968986), [`02831f2`](https://github.com/LedgerHQ/ledger-live/commit/02831f222367ffe67858b7a3c3984c495d0ebb29), [`78acbfa`](https://github.com/LedgerHQ/ledger-live/commit/78acbfae7319c5b3fb1453f8727e2210e895669c), [`5082f0d`](https://github.com/LedgerHQ/ledger-live/commit/5082f0d7dd1a9e73b97b2226782c63a579ca4331), [`936164c`](https://github.com/LedgerHQ/ledger-live/commit/936164cfa7d0dd2ef97deb16004a211598eeab37), [`1bd0cac`](https://github.com/LedgerHQ/ledger-live/commit/1bd0cac7957422fa06e18424e9e2706c39072078), [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb), [`3b83607`](https://github.com/LedgerHQ/ledger-live/commit/3b83607a045142a8408784c92b57d8bde01445df), [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb), [`367c7e0`](https://github.com/LedgerHQ/ledger-live/commit/367c7e03f07b3f2ae96927fc33d12e35ffe81621), [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9), [`139cdbf`](https://github.com/LedgerHQ/ledger-live/commit/139cdbfd48120247ff54f5f7863ce866a6a755d0), [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58), [`37fe0e0`](https://github.com/LedgerHQ/ledger-live/commit/37fe0e0011efb6b9cf4e7a9d1ddb01768aa77798), [`946be6e`](https://github.com/LedgerHQ/ledger-live/commit/946be6e0111c79e77eb486619b4ad645523b1966), [`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d), [`bcc9607`](https://github.com/LedgerHQ/ledger-live/commit/bcc960793ca72aa4f05b46c726db9cba82a4b9a7), [`197fed7`](https://github.com/LedgerHQ/ledger-live/commit/197fed7554701e0bbe96c7c3f819d8dba297ba48), [`e83e793`](https://github.com/LedgerHQ/ledger-live/commit/e83e79399bf1d9b2edf9e6b242f18162dfa5a8a3), [`dc2ca09`](https://github.com/LedgerHQ/ledger-live/commit/dc2ca093de2957966455f15a94c470431783fbb4), [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754), [`0c78234`](https://github.com/LedgerHQ/ledger-live/commit/0c78234bfb672411b6950a874f4b50f864ac40b9), [`8a4b151`](https://github.com/LedgerHQ/ledger-live/commit/8a4b1511dcac3bbd6066996aecd4dedbaf1f24c0), [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839), [`b599228`](https://github.com/LedgerHQ/ledger-live/commit/b59922882b679b2e2a5069707a233d9cb6293881), [`93f3199`](https://github.com/LedgerHQ/ledger-live/commit/93f3199af5ba10f269e11b3ac37ffa77b8a05e0f), [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440), [`11cd80f`](https://github.com/LedgerHQ/ledger-live/commit/11cd80f7c262f3e44fbbb19a8b034e9767c02db6), [`46e78cf`](https://github.com/LedgerHQ/ledger-live/commit/46e78cf3a057a9de39a5abbb49fe779655db6507), [`cd59c95`](https://github.com/LedgerHQ/ledger-live/commit/cd59c95d04bd886114802ca887e1209d2191eaee), [`d9c2b45`](https://github.com/LedgerHQ/ledger-live/commit/d9c2b454793568993215c2be6e448cb2f90fdb6d), [`12ac92f`](https://github.com/LedgerHQ/ledger-live/commit/12ac92f7418f2248673257f9900490ade204d086), [`0e803da`](https://github.com/LedgerHQ/ledger-live/commit/0e803dac441988ba47d3c915c124319c1cfe0b86), [`f9c30a8`](https://github.com/LedgerHQ/ledger-live/commit/f9c30a86fcc8b1cc75149c7c8df2a5e166754226), [`2b02dbd`](https://github.com/LedgerHQ/ledger-live/commit/2b02dbd791a761890837c664e002d682ac335d0a), [`6da0c45`](https://github.com/LedgerHQ/ledger-live/commit/6da0c451d3099a7ce610eff343cae84442f4ac30), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21), [`5b0974a`](https://github.com/LedgerHQ/ledger-live/commit/5b0974a146ce57b30b48769cb512c1443aa7f97d)]:
  - @ledgerhq/coin-bitcoin@0.38.0-next.0
  - @ledgerhq/live-common@34.69.0-next.0
  - @ledgerhq/cryptoassets@13.46.0-next.0
  - @ledgerhq/coin-evm@3.4.0-next.0
  - @ledgerhq/coin-solana@0.51.0-next.0
  - @ledgerhq/types-live@6.105.0-next.0
  - @ledgerhq/live-env@2.33.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.3.0-next.0
  - @ledgerhq/errors@6.34.0-next.0
  - @ledgerhq/live-wallet@0.25.1-next.0
  - @ledgerhq/hw-transport@6.35.1-next.0
  - @ledgerhq/live-dmk-shared@0.22.2-next.0
