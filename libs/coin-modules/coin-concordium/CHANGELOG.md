# @ledgerhq/coin-concordium

## 1.6.0

### Minor Changes

- [#23263](https://github.com/LedgerHQ/ledger-live/pull/23263) [`c9beaff`](https://github.com/LedgerHQ/ledger-live/commit/c9beaff3b51d3a50f310be73a830bf6e944e61fa) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Concordium API listOperations: report native OUT value net of fees, matching getBlock

- [#23281](https://github.com/LedgerHQ/ledger-live/pull/23281) [`4831311`](https://github.com/LedgerHQ/ledger-live/commit/4831311fd859631a9248441e469f52c18fb42c52) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Concordium API listOperations: set tx.feesPayer to the transaction sender, matching getBlock. tx.fees stays the fee the listed account paid, so it is 0 on a row another account paid for.

- [#23316](https://github.com/LedgerHQ/ledger-live/pull/23316) [`0ace271`](https://github.com/LedgerHQ/ledger-live/commit/0ace2718ac29bc9926858af41424177ff3363d47) Thanks [@qperrot](https://github.com/qperrot)! - Remove the unused `parseAPIValue` export, which always read the first unit of `concordium`

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0

## 1.6.0-next.0

### Minor Changes

- [#23263](https://github.com/LedgerHQ/ledger-live/pull/23263) [`c9beaff`](https://github.com/LedgerHQ/ledger-live/commit/c9beaff3b51d3a50f310be73a830bf6e944e61fa) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Concordium API listOperations: report native OUT value net of fees, matching getBlock

- [#23281](https://github.com/LedgerHQ/ledger-live/pull/23281) [`4831311`](https://github.com/LedgerHQ/ledger-live/commit/4831311fd859631a9248441e469f52c18fb42c52) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Concordium API listOperations: set tx.feesPayer to the transaction sender, matching getBlock. tx.fees stays the fee the listed account paid, so it is 0 on a row another account paid for.

- [#23316](https://github.com/LedgerHQ/ledger-live/pull/23316) [`0ace271`](https://github.com/LedgerHQ/ledger-live/commit/0ace2718ac29bc9926858af41424177ff3363d47) Thanks [@qperrot](https://github.com/qperrot)! - Remove the unused `parseAPIValue` export, which always read the first unit of `concordium`

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0

## 1.5.1

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/types-live@6.127.0
  - @ledgerhq/concordium-core@0.8.0

## 1.5.1-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1

## 1.5.1-next.0

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0
  - @ledgerhq/concordium-core@0.8.0

## 1.5.0

### Minor Changes

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0
  - @ledgerhq/ledger-wallet-framework@3.6.0

## 1.5.0-next.0

### Minor Changes

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0

## 1.4.0

### Minor Changes

- [#22129](https://github.com/LedgerHQ/ledger-live/pull/22129) [`ea94dd0`](https://github.com/LedgerHQ/ledger-live/commit/ea94dd00d64bae6b7fd9c792da77ffba751a9f01) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(concordium): drop the PLT error surface nothing can reach

  `mapPltRejectReason` turned a chain reject reason into a typed `Error` and had no
  caller. It could not gain one: an `Error` is what the pre-send checks return and
  what the signer throws, and neither ever sees a reject reason. A reject reason
  exists only on the wallet-proxy history response, and history renders an
  `Operation`, which carries `failed: true` and no cause. Surfacing the cause means
  a code in `Operation.extra` and a renderer for it, not this function.

  Removed with it: `ConcordiumNonExistentTokenId` and `ConcordiumPltTransferRejected`,
  whose only producer it was, and `ConcordiumAccountNotAllowed` and
  `ConcordiumAccountDenied`, which never had one — `getAccountListStatus` folds both
  list verdicts into one, so reporting the cause means widening the stored
  `transferStatus` first.

  A test in each app now pins that every PLT error a producer can raise has copy of
  its own, so the next one added without it fails rather than reaching a user as a
  class name.

- [#22087](https://github.com/LedgerHQ/ledger-live/pull/22087) [`736a0d5`](https://github.com/LedgerHQ/ledger-live/commit/736a0d5ba692e2342df4fc503056524359d35d65) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Carry a PLT memo as CBOR, the way a CCD memo already is

  A PLT memo went on chain as raw UTF-8 while a CCD memo went as a CBOR text
  string. The chain types them identically — a CBOR value in `Memo` under one
  256-byte cap — and only the envelope differs, so the codec is now shared.

  `encodePltMemo` emits `tag 24(byte string(CBOR text string))`; tag 24 declares
  the content to be CBOR, which the previous untagged bytes denied. Both paths
  bound the memo with `MAX_MEMO_LENGTH` (254), leaving room for the CBOR header;
  `PLT_MAX_MEMO_SIZE` is gone. The device app's PLT screen does not decode the
  content yet, so the wallet side lands first and the two ship together.

  `decodeMemoFromCbor` now requires the value to fill the buffer and reads
  integers as well as text strings. Without the first, `616263` decoded to `"b"`.

  PLT reads try CBOR and fall back to printable text, since the node strips the
  tag and the proxy reports bare bytes either way — so earlier memos still
  display. Integers are excluded there: `"0"` through `"7"` are `0x30`-`0x37`,
  CBOR major type 1, so a single-digit reference would read as `-17` through
  `-24`. The reverse holds for the rarer case, a negative integer reading as its
  printable head byte. Nothing separates the two, and text is what senders write.

- [#22139](https://github.com/LedgerHQ/ledger-live/pull/22139) [`7848066`](https://github.com/LedgerHQ/ledger-live/commit/7848066f6ba1b803b5a8d3df02ce6d35e46b370e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): show why the chain rejected a PLT transfer

  A rejected PLT transfer read as a failed row with no explanation. Operation
  details now name the cause, on desktop and mobile.

- [#22147](https://github.com/LedgerHQ/ledger-live/pull/22147) [`1648042`](https://github.com/LedgerHQ/ledger-live/commit/164804200fcd3486d9f364a31b065cb7f7d2a170) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(concordium): say which list refused a PLT sender

  A blocked sender was told to contact the issuer for access, which is wrong for a
  deny list. The send flow now reports the two causes separately.

  Removes the unused `PltListStatus` type.

- [#22186](https://github.com/LedgerHQ/ledger-live/pull/22186) [`eb2a2a5`](https://github.com/LedgerHQ/ledger-live/commit/eb2a2a598787555cc05ed7ae105dd1648fbe43f5) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): surface PLT pause and sender restrictions

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`736a0d5`](https://github.com/LedgerHQ/ledger-live/commit/736a0d5ba692e2342df4fc503056524359d35d65), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/concordium-core@0.8.0
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-env@4.1.0

## 1.4.0-next.0

### Minor Changes

- [#22129](https://github.com/LedgerHQ/ledger-live/pull/22129) [`ea94dd0`](https://github.com/LedgerHQ/ledger-live/commit/ea94dd00d64bae6b7fd9c792da77ffba751a9f01) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(concordium): drop the PLT error surface nothing can reach

  `mapPltRejectReason` turned a chain reject reason into a typed `Error` and had no
  caller. It could not gain one: an `Error` is what the pre-send checks return and
  what the signer throws, and neither ever sees a reject reason. A reject reason
  exists only on the wallet-proxy history response, and history renders an
  `Operation`, which carries `failed: true` and no cause. Surfacing the cause means
  a code in `Operation.extra` and a renderer for it, not this function.

  Removed with it: `ConcordiumNonExistentTokenId` and `ConcordiumPltTransferRejected`,
  whose only producer it was, and `ConcordiumAccountNotAllowed` and
  `ConcordiumAccountDenied`, which never had one — `getAccountListStatus` folds both
  list verdicts into one, so reporting the cause means widening the stored
  `transferStatus` first.

  A test in each app now pins that every PLT error a producer can raise has copy of
  its own, so the next one added without it fails rather than reaching a user as a
  class name.

- [#22087](https://github.com/LedgerHQ/ledger-live/pull/22087) [`736a0d5`](https://github.com/LedgerHQ/ledger-live/commit/736a0d5ba692e2342df4fc503056524359d35d65) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Carry a PLT memo as CBOR, the way a CCD memo already is

  A PLT memo went on chain as raw UTF-8 while a CCD memo went as a CBOR text
  string. The chain types them identically — a CBOR value in `Memo` under one
  256-byte cap — and only the envelope differs, so the codec is now shared.

  `encodePltMemo` emits `tag 24(byte string(CBOR text string))`; tag 24 declares
  the content to be CBOR, which the previous untagged bytes denied. Both paths
  bound the memo with `MAX_MEMO_LENGTH` (254), leaving room for the CBOR header;
  `PLT_MAX_MEMO_SIZE` is gone. The device app's PLT screen does not decode the
  content yet, so the wallet side lands first and the two ship together.

  `decodeMemoFromCbor` now requires the value to fill the buffer and reads
  integers as well as text strings. Without the first, `616263` decoded to `"b"`.

  PLT reads try CBOR and fall back to printable text, since the node strips the
  tag and the proxy reports bare bytes either way — so earlier memos still
  display. Integers are excluded there: `"0"` through `"7"` are `0x30`-`0x37`,
  CBOR major type 1, so a single-digit reference would read as `-17` through
  `-24`. The reverse holds for the rarer case, a negative integer reading as its
  printable head byte. Nothing separates the two, and text is what senders write.

- [#22139](https://github.com/LedgerHQ/ledger-live/pull/22139) [`7848066`](https://github.com/LedgerHQ/ledger-live/commit/7848066f6ba1b803b5a8d3df02ce6d35e46b370e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): show why the chain rejected a PLT transfer

  A rejected PLT transfer read as a failed row with no explanation. Operation
  details now name the cause, on desktop and mobile.

- [#22147](https://github.com/LedgerHQ/ledger-live/pull/22147) [`1648042`](https://github.com/LedgerHQ/ledger-live/commit/164804200fcd3486d9f364a31b065cb7f7d2a170) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(concordium): say which list refused a PLT sender

  A blocked sender was told to contact the issuer for access, which is wrong for a
  deny list. The send flow now reports the two causes separately.

  Removes the unused `PltListStatus` type.

- [#22186](https://github.com/LedgerHQ/ledger-live/pull/22186) [`eb2a2a5`](https://github.com/LedgerHQ/ledger-live/commit/eb2a2a598787555cc05ed7ae105dd1648fbe43f5) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): surface PLT pause and sender restrictions

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`736a0d5`](https://github.com/LedgerHQ/ledger-live/commit/736a0d5ba692e2342df4fc503056524359d35d65), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/concordium-core@0.8.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0

## 1.3.0

### Minor Changes

- [#21630](https://github.com/LedgerHQ/ledger-live/pull/21630) [`738c0d8`](https://github.com/LedgerHQ/ledger-live/commit/738c0d8a1357e96713bfc0d7a40ca403b5290c35) Thanks [@amaslakov](https://github.com/amaslakov)! - Report PLT transfers in the history of the token sub-account they moved

  `tokenUpdate` transactions were parsed away, so a PLT transfer showed nowhere.
  They now become operations on the token sub-account, valued in the token rather
  than in the CCD a native transfer folds its fee into. The fee stays on the
  parent account as a separate operation, typed from whether the account actually
  paid one, so that an outgoing transfer is charged for it exactly once and an
  incoming one is charged nothing. A `tokenUpdate` that is not a transfer, such as
  a mint or a pause, still records the CCD it cost the account that paid. The
  `api/` surface describes these operations as the token they moved instead of as
  the native asset. Accounts now carry a `syncHash` covering the CAL and the token
  flag, so enabling tokens re-reads the history rather than leaving earlier
  transfers behind the sync watermark.

  Reading that history now follows the proxy's cursor to the end instead of
  stopping at the first page, so an account with more transactions than one page
  holds no longer loses the rest of them, and a failed page reports the failure
  rather than passing for the end of the history. Pages are read at the size the
  proxy actually allows, and rewards are excluded from the request, having only
  ever been fetched and discarded. The account keeps what a re-read returns rather
  than merging it over what was already stored, which is what lets a correction
  reach an operation recorded by an earlier version.

  A rejected transfer is recorded rather than dropped. The proxy reports one
  without any of its transfer fields, so it used to parse to nothing and the CCD
  it cost the sender went unaccounted for; it now appears as a failed operation
  worth its fee, matching what a rejected token transfer already did. Neither
  reports an empty address as a counterparty any more.

- [#21720](https://github.com/LedgerHQ/ledger-live/pull/21720) [`05cb97c`](https://github.com/LedgerHQ/ledger-live/commit/05cb97c6986755d87d4c0b3df3d8b4daf9ba77df) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Craft and sign PLT transfers

  `craftPltTransaction` builds a `TokenUpdate` payload from the CAL-resolved token id, the
  CAL unit magnitude as the amount's exponent, and the energy persisted at estimation time,
  and `signOperation` routes a transaction carrying a token sub-account to it. The signer
  interface widens to `AnyTransaction`; its body already serialized both kinds. A PLT send
  now reports the CCD fee on the parent account and the token amount on the sub-account,
  matching the pair sync builds once the transfer is indexed. `updateTransaction` drops the
  persisted energy alongside the fee, so a re-selected token cannot inherit the previous
  token's energy limit. Adds the English error strings for the two signer failures this path
  can surface.

  Signing on a device needs the PLT-capable Concordium app; until it ships, an attempt
  surfaces as a translated "update your Concordium app" error. PLT sub-accounts remain behind
  the `enableTokens` config switch.

- [#21679](https://github.com/LedgerHQ/ledger-live/pull/21679) [`251af57`](https://github.com/LedgerHQ/ledger-live/commit/251af57e7412e493deaecddf627e3967ba044c09) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Report Concordium fee errors under a key the send flow renders

  `getTransactionStatus` filed fee errors under `errors.fee`, which no file in the
  desktop `modals/Send/` tree reads, so an unpriced transfer greyed out Continue with
  no message. They are now reported under `amount`, after the checks for the states
  that leave a PLT fee unset, so the specific cause still wins.

- [#21634](https://github.com/LedgerHQ/ledger-live/pull/21634) [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Validate PLT transfers and fix estimateMaxSpendable for tokens

  `getTransactionStatus` checks a PLT amount against the token sub-account and its fee
  against the CCD at the parent's disposal, and blocks on token state and device limits.
  `estimateMaxSpendable` returns the full token balance instead of subtracting µCCD fees.
  A PLT fee is priced from the buffered energy, so it covers the deposit the chain
  requires. `concordium-core` lowers the PLT decimals ceiling to 18. Adds the English
  error strings.

- [#21869](https://github.com/LedgerHQ/ledger-live/pull/21869) [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f) Thanks [@amaslakov](https://github.com/amaslakov)! - Check a PLT recipient against the token's allow and deny lists before signing

  A transfer the lists refuse is rejected on chain after the user has signed and paid the
  fee, so `getTransactionStatus` now resolves the recipient's standing and reports it under
  the recipient field. The token's own state is read first, and a token declaring neither
  list never looks the recipient up. An undecodable state or a failed lookup blocks as
  unverifiable rather than passing as allowed. Adds the English error strings.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/concordium-core@0.7.0
  - @ledgerhq/ledger-wallet-framework@3.4.0

## 1.3.0-next.0

### Minor Changes

- [#21630](https://github.com/LedgerHQ/ledger-live/pull/21630) [`738c0d8`](https://github.com/LedgerHQ/ledger-live/commit/738c0d8a1357e96713bfc0d7a40ca403b5290c35) Thanks [@amaslakov](https://github.com/amaslakov)! - Report PLT transfers in the history of the token sub-account they moved

  `tokenUpdate` transactions were parsed away, so a PLT transfer showed nowhere.
  They now become operations on the token sub-account, valued in the token rather
  than in the CCD a native transfer folds its fee into. The fee stays on the
  parent account as a separate operation, typed from whether the account actually
  paid one, so that an outgoing transfer is charged for it exactly once and an
  incoming one is charged nothing. A `tokenUpdate` that is not a transfer, such as
  a mint or a pause, still records the CCD it cost the account that paid. The
  `api/` surface describes these operations as the token they moved instead of as
  the native asset. Accounts now carry a `syncHash` covering the CAL and the token
  flag, so enabling tokens re-reads the history rather than leaving earlier
  transfers behind the sync watermark.

  Reading that history now follows the proxy's cursor to the end instead of
  stopping at the first page, so an account with more transactions than one page
  holds no longer loses the rest of them, and a failed page reports the failure
  rather than passing for the end of the history. Pages are read at the size the
  proxy actually allows, and rewards are excluded from the request, having only
  ever been fetched and discarded. The account keeps what a re-read returns rather
  than merging it over what was already stored, which is what lets a correction
  reach an operation recorded by an earlier version.

  A rejected transfer is recorded rather than dropped. The proxy reports one
  without any of its transfer fields, so it used to parse to nothing and the CCD
  it cost the sender went unaccounted for; it now appears as a failed operation
  worth its fee, matching what a rejected token transfer already did. Neither
  reports an empty address as a counterparty any more.

- [#21720](https://github.com/LedgerHQ/ledger-live/pull/21720) [`05cb97c`](https://github.com/LedgerHQ/ledger-live/commit/05cb97c6986755d87d4c0b3df3d8b4daf9ba77df) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Craft and sign PLT transfers

  `craftPltTransaction` builds a `TokenUpdate` payload from the CAL-resolved token id, the
  CAL unit magnitude as the amount's exponent, and the energy persisted at estimation time,
  and `signOperation` routes a transaction carrying a token sub-account to it. The signer
  interface widens to `AnyTransaction`; its body already serialized both kinds. A PLT send
  now reports the CCD fee on the parent account and the token amount on the sub-account,
  matching the pair sync builds once the transfer is indexed. `updateTransaction` drops the
  persisted energy alongside the fee, so a re-selected token cannot inherit the previous
  token's energy limit. Adds the English error strings for the two signer failures this path
  can surface.

  Signing on a device needs the PLT-capable Concordium app; until it ships, an attempt
  surfaces as a translated "update your Concordium app" error. PLT sub-accounts remain behind
  the `enableTokens` config switch.

- [#21679](https://github.com/LedgerHQ/ledger-live/pull/21679) [`251af57`](https://github.com/LedgerHQ/ledger-live/commit/251af57e7412e493deaecddf627e3967ba044c09) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Report Concordium fee errors under a key the send flow renders

  `getTransactionStatus` filed fee errors under `errors.fee`, which no file in the
  desktop `modals/Send/` tree reads, so an unpriced transfer greyed out Continue with
  no message. They are now reported under `amount`, after the checks for the states
  that leave a PLT fee unset, so the specific cause still wins.

- [#21634](https://github.com/LedgerHQ/ledger-live/pull/21634) [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Validate PLT transfers and fix estimateMaxSpendable for tokens

  `getTransactionStatus` checks a PLT amount against the token sub-account and its fee
  against the CCD at the parent's disposal, and blocks on token state and device limits.
  `estimateMaxSpendable` returns the full token balance instead of subtracting µCCD fees.
  A PLT fee is priced from the buffered energy, so it covers the deposit the chain
  requires. `concordium-core` lowers the PLT decimals ceiling to 18. Adds the English
  error strings.

- [#21869](https://github.com/LedgerHQ/ledger-live/pull/21869) [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f) Thanks [@amaslakov](https://github.com/amaslakov)! - Check a PLT recipient against the token's allow and deny lists before signing

  A transfer the lists refuse is rejected on chain after the user has signed and paid the
  fee, so `getTransactionStatus` now resolves the recipient's standing and reports it under
  the recipient field. The token's own state is read first, and a token declaring neither
  list never looks the recipient up. An undecodable state or a failed lookup blocks as
  unverifiable rather than passing as allowed. Adds the English error strings.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/concordium-core@0.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0

## 1.2.0

### Minor Changes

- [#21475](https://github.com/LedgerHQ/ledger-live/pull/21475) [`47a1cd0`](https://github.com/LedgerHQ/ledger-live/commit/47a1cd082cc30cd7cc539a8eb0e0fe5466128533) Thanks [@amaslakov](https://github.com/amaslakov)! - Extend the transaction and account types with the PLT token id, the persisted fee-estimation energy, and per-token state

- [#21204](https://github.com/LedgerHQ/ledger-live/pull/21204) [`3a78322`](https://github.com/LedgerHQ/ledger-live/commit/3a783224b6016fce08fa8cb3254057b75882e2c5) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Adopt the PLT-capable Concordium signer and map the PLT status words to typed errors

- [#21591](https://github.com/LedgerHQ/ledger-live/pull/21591) [`2b8a4e4`](https://github.com/LedgerHQ/ledger-live/commit/2b8a4e4240a414cbb1bda31b97b70837cb6ac3fe) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Estimate PLT transfer fees through the wallet-proxy `tokenUpdate` cost endpoint

  `getTransactionCost` is parameterized on transaction type instead of hardcoding
  `simpleTransfer`. PLT preparation encodes the CBOR operations blob first, since
  its byte length is a required cost parameter, then applies a 20% energy buffer
  and persists the result. Signing reads that persisted pair rather than
  re-estimating, so the fee shown in the wallet and the energy in the signed
  header cannot disagree. Native CCD estimation is unchanged.

- [#21504](https://github.com/LedgerHQ/ledger-live/pull/21504) [`92b90a6`](https://github.com/LedgerHQ/ledger-live/commit/92b90a6eebca959abe0b04aa83c5799d34f9f10a) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Build PLT token sub-accounts during Concordium account sync, behind the new `enableTokens` coin config flag (off by default). Tokens are resolved from the CAL by on-chain address, per-token pause and allow/deny state is cached on the account, and PLT balances are reported on the `api/` surface.

- [#21429](https://github.com/LedgerHQ/ledger-live/pull/21429) [`30619aa`](https://github.com/LedgerHQ/ledger-live/commit/30619aaa2af784fd917214bb0e4bbd092f883e11) Thanks [@amaslakov](https://github.com/amaslakov)! - Add PLT error classes and map chain reject reasons onto them

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-env@4.0.0

## 1.2.0-next.0

### Minor Changes

- [#21475](https://github.com/LedgerHQ/ledger-live/pull/21475) [`47a1cd0`](https://github.com/LedgerHQ/ledger-live/commit/47a1cd082cc30cd7cc539a8eb0e0fe5466128533) Thanks [@amaslakov](https://github.com/amaslakov)! - Extend the transaction and account types with the PLT token id, the persisted fee-estimation energy, and per-token state

- [#21204](https://github.com/LedgerHQ/ledger-live/pull/21204) [`3a78322`](https://github.com/LedgerHQ/ledger-live/commit/3a783224b6016fce08fa8cb3254057b75882e2c5) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Adopt the PLT-capable Concordium signer and map the PLT status words to typed errors

- [#21591](https://github.com/LedgerHQ/ledger-live/pull/21591) [`2b8a4e4`](https://github.com/LedgerHQ/ledger-live/commit/2b8a4e4240a414cbb1bda31b97b70837cb6ac3fe) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Estimate PLT transfer fees through the wallet-proxy `tokenUpdate` cost endpoint

  `getTransactionCost` is parameterized on transaction type instead of hardcoding
  `simpleTransfer`. PLT preparation encodes the CBOR operations blob first, since
  its byte length is a required cost parameter, then applies a 20% energy buffer
  and persists the result. Signing reads that persisted pair rather than
  re-estimating, so the fee shown in the wallet and the energy in the signed
  header cannot disagree. Native CCD estimation is unchanged.

- [#21504](https://github.com/LedgerHQ/ledger-live/pull/21504) [`92b90a6`](https://github.com/LedgerHQ/ledger-live/commit/92b90a6eebca959abe0b04aa83c5799d34f9f10a) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Build PLT token sub-accounts during Concordium account sync, behind the new `enableTokens` coin config flag (off by default). Tokens are resolved from the CAL by on-chain address, per-token pause and allow/deny state is cached on the account, and PLT balances are reported on the `api/` surface.

- [#21429](https://github.com/LedgerHQ/ledger-live/pull/21429) [`30619aa`](https://github.com/LedgerHQ/ledger-live/commit/30619aaa2af784fd917214bb0e4bbd092f883e11) Thanks [@amaslakov](https://github.com/amaslakov)! - Add PLT error classes and map chain reject reasons onto them

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0

## 1.1.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`da47556`](https://github.com/LedgerHQ/ledger-live/commit/da475565799815dd17c4cb941068031e564da9b6) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` no longer declares `CoinModuleApi` as its return type: it returns the object it actually
  builds, checked with `satisfies CoinModuleImpl<ConcordiumCoinConfig, ConcordiumMemo>`. Seven
  capability methods that only threw are omitted instead of stubbed — `call`, `register`, the three
  staking reads (`getStakes`, `getRewards`, `getValidators`), `validateIntent`, and `getNextSequence`
  (the crafting path resolves the sequence internally via `getNextValidSequence`, so the capability was
  never published to callers anyway). Everything Concordium does implement stays, including
  `craftRawTransaction` and the full block API (`lastBlock`, `getBlockInfo`, `getBlock`), which are real
  implementations rather than stubs.

  Consumers see no behavioural change: the resolver applies the framework's `withDefaults`, which
  backfills each omitted method with the same `"<name> is not supported"` throw. `supports()` on the
  wrapped api now reports these capabilities as absent, which the stubs previously masked.

  The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `combine`, `craftTransaction`, `estimateFees` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

  The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.

- [#21239](https://github.com/LedgerHQ/ledger-live/pull/21239) [`02c9ccf`](https://github.com/LedgerHQ/ledger-live/commit/02c9ccfb409317a72f0b29d1fb755214adc9e596) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Protocol-Level Token (PLT) support: TransactionType.TokenUpdate, CIS-7 CBOR encoding, and flat wire serialization

- [#21264](https://github.com/LedgerHQ/ledger-live/pull/21264) [`e723d82`](https://github.com/LedgerHQ/ledger-live/commit/e723d823688cd7f00d4b16549b45c62a500c8a9d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Type the PLT wallet-proxy responses: `accountTokens`, the `/v0/plt/tokens` and `/v0/plt/tokenInfo` clients, PLT transaction detail fields, and the raw reject reason

### Patch Changes

- Updated dependencies [[`02c9ccf`](https://github.com/LedgerHQ/ledger-live/commit/02c9ccfb409317a72f0b29d1fb755214adc9e596), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/concordium-core@0.6.0
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-env@3.2.0

## 1.1.0-next.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`da47556`](https://github.com/LedgerHQ/ledger-live/commit/da475565799815dd17c4cb941068031e564da9b6) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` no longer declares `CoinModuleApi` as its return type: it returns the object it actually
  builds, checked with `satisfies CoinModuleImpl<ConcordiumCoinConfig, ConcordiumMemo>`. Seven
  capability methods that only threw are omitted instead of stubbed — `call`, `register`, the three
  staking reads (`getStakes`, `getRewards`, `getValidators`), `validateIntent`, and `getNextSequence`
  (the crafting path resolves the sequence internally via `getNextValidSequence`, so the capability was
  never published to callers anyway). Everything Concordium does implement stays, including
  `craftRawTransaction` and the full block API (`lastBlock`, `getBlockInfo`, `getBlock`), which are real
  implementations rather than stubs.

  Consumers see no behavioural change: the resolver applies the framework's `withDefaults`, which
  backfills each omitted method with the same `"<name> is not supported"` throw. `supports()` on the
  wrapped api now reports these capabilities as absent, which the stubs previously masked.

  The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `combine`, `craftTransaction`, `estimateFees` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

  The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.

- [#21239](https://github.com/LedgerHQ/ledger-live/pull/21239) [`02c9ccf`](https://github.com/LedgerHQ/ledger-live/commit/02c9ccfb409317a72f0b29d1fb755214adc9e596) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Protocol-Level Token (PLT) support: TransactionType.TokenUpdate, CIS-7 CBOR encoding, and flat wire serialization

- [#21264](https://github.com/LedgerHQ/ledger-live/pull/21264) [`e723d82`](https://github.com/LedgerHQ/ledger-live/commit/e723d823688cd7f00d4b16549b45c62a500c8a9d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Type the PLT wallet-proxy responses: `accountTokens`, the `/v0/plt/tokens` and `/v0/plt/tokenInfo` clients, PLT transaction detail fields, and the raw reject reason

### Patch Changes

- Updated dependencies [[`02c9ccf`](https://github.com/LedgerHQ/ledger-live/commit/02c9ccfb409317a72f0b29d1fb755214adc9e596), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/concordium-core@0.6.0-next.0
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0

## 1.0.1

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0

## 1.0.1-next.0

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0

## 1.0.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0

## 1.0.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1

## 1.0.0-next.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
