# @ledgerhq/coin-concordium

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

## 0.20.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0
  - @ledgerhq/ledger-wallet-framework@2.8.0

## 0.20.0-next.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0

## 0.19.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/types-live@6.118.0
  - @ledgerhq/ledger-wallet-framework@2.7.0

## 0.19.0-next.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/types-live@6.118.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0

## 0.18.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

- [#20121](https://github.com/LedgerHQ/ledger-live/pull/20121) [`8ab9e50`](https://github.com/LedgerHQ/ledger-live/commit/8ab9e504a5b004e28f5e80f490b837b3c2526f44) Thanks [@amaslakov](https://github.com/amaslakov)! - Implement getBlock (CoinModuleApi) using the wallet-proxy per-block transaction events endpoint, mapping CCD transfers to signed operations with decoded memos

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/live-network@3.0.0
  - @ledgerhq/live-env@3.0.0
  - @ledgerhq/types-live@6.117.0

## 0.18.0-next.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

- [#20121](https://github.com/LedgerHQ/ledger-live/pull/20121) [`8ab9e50`](https://github.com/LedgerHQ/ledger-live/commit/8ab9e504a5b004e28f5e80f490b837b3c2526f44) Thanks [@amaslakov](https://github.com/amaslakov)! - Implement getBlock (CoinModuleApi) using the wallet-proxy per-block transaction events endpoint, mapping CCD transfers to signed operations with decoded memos

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @ledgerhq/live-env@3.0.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0

## 0.17.0

### Minor Changes

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0
  - @ledgerhq/live-network@2.7.0
  - @ledgerhq/ledger-wallet-framework@2.5.0

## 0.17.0-next.0

### Minor Changes

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0

## 0.16.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/types-live@6.115.0
  - @ledgerhq/live-network@2.6.8

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
