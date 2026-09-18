# @domain/api-card-management

## 0.6.0-next.0

### Minor Changes

- [#21707](https://github.com/LedgerHQ/ledger-live/pull/21707) [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add View/Hide and a 3D flip for card numbers.

- [#21681](https://github.com/LedgerHQ/ledger-live/pull/21681) [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation error handling with retry

- [#21569](https://github.com/LedgerHQ/ledger-live/pull/21569) [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Resolve a card-linked wallet to the Ledger currency it holds.

  - New `@domain/entity-card-asset-mapping` maps a card provider's `{currency}.{network}` id onto a Ledger currency id. `baanxCatalog.ts` holds Baanx's, covering USDT, USDC, BTC, ETH, XRP, SOL and LTC; a second provider is a second catalog beside it.
  - Several of Baanx's keys map onto one currency: its docs name the chain, its sandbox has answered with the ticker repeated, and both resolve.
  - `getCardLinkedWallets` attaches `ledgerId` in its transform, so every consumer reads one answer rather than mapping again.
  - The join and the devtool carry it through; an unmapped pair has no `ledgerId` at all rather than resolving to a wrong currency.
  - A "Currency Mapping" screen in the devtool lists the whole catalog, scrollable both ways, so a gap can be read against it.

- [#22011](https://github.com/LedgerHQ/ledger-live/pull/22011) [`e37413b`](https://github.com/LedgerHQ/ledger-live/commit/e37413b588873a1a2a028ebf4c1971e4fa92ed2a) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show the card's PIN without ever handling the digits.

  - `createCardPinToken` posts to `/v1/card/pin/token` and answers a single-use token and the `imageUrl` that renders the PIN, so the digits never reach the app as a value.
  - A mutation, like `createCardDetailsToken`: the token is spent once the image has been read, so the answer must never be served from a cache. Dispatch with `track: false`.
  - `customCss` takes the two colours this endpoint documents. Anything else — the card details image's four included — is dropped on parse and never sent.

- [#21996](https://github.com/LedgerHQ/ledger-live/pull/21996) [`9e61582`](https://github.com/LedgerHQ/ledger-live/commit/9e61582edfcbb98046d0f74111ccf4061ec44bb3) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Expose the provider's hosted page for setting or changing the card PIN.

  - `createCardSetPinToken` posts to `/v1/card/set-pin/token` and answers a single-use token and the `hostedPageUrl` that spends it.
  - A mutation, like `createCardDetailsToken`: the token is spent when the page opens, so the answer must never be served from a cache. Dispatch with `track: false`.
  - `hostedPageUrl` and `redirectUrl` must be `https:` — the app opens one and the provider navigates to the other.
  - `redirectUrl` and `isEmbedded: true` cannot be asked for together: an embedded page posts a message instead of navigating.
  - `customCss` carries the provider's seven documented styling fields. No caller styles the page yet; the names and types are the API reference's, unverified against a live response.

- [#21675](https://github.com/LedgerHQ/ledger-live/pull/21675) [`3f34609`](https://github.com/LedgerHQ/ledger-live/commit/3f34609edecc5ae85a9a9ac1b76ab47e30a9c66e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mock card-management HTTP with MSW in tests

- [#21663](https://github.com/LedgerHQ/ledger-live/pull/21663) [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mark a frozen pay card on the card visual: the card face fades out behind a centered snow `Spot`, read from the same card status the freeze tile uses. The features/flow jest projects now compile `@ledgerhq/lumen-utils-shared` instead of leaving its ESM untransformed, so views can use `cn`.

- [#21918](https://github.com/LedgerHQ/ledger-live/pull/21918) [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Sign a mock Card session in and out from the Pay Card DevTool, and answer the Card endpoints from the desktop MSW worker, so the Card surfaces can be reached without the hosted login.

- [#21626](https://github.com/LedgerHQ/ledger-live/pull/21626) [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show and drive the derived card onboarding status from the Card / Pay devtool.

  - A "Card onboarding" screen: a `Stepper` for the count, every step by the id the app keys it on, and the derived answer printed raw so a step can be traced to the response behind it.
  - Each step a request decides carries a toggle. It sets what that endpoint answers, so the step follows on the next read and holds until it is cleared. The phone wallet step is answered on the device; the purchase step is read-only while nothing answers it.
  - An endpoint answers from the provider until its toggle is used, so one step can be held while the rest stay real, and "Use the real answers" hands them all back.
  - `@domain/api-card-management/mock/card-onboarding-status` holds those answers and the responses that carry them; the mobile MSW handlers read it before falling back to what they answered before.
  - Mocking is started by an env var, so without it the screen says so instead of offering a toggle that would set an answer nothing reads.
  - The hook gains `refresh`, which re-asks all three sources: the screen asks on open and on demand.

- [#21872](https://github.com/LedgerHQ/ledger-live/pull/21872) [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Read the card transactions and give each one its spend category.

  - `useCardTransactionsViewModel` reads the first page of `GET /v1/card/transactions` while a session is live, and hands each transaction its category and that category's translated label.
  - `mccCategory` is now the closed set the provider documents (`PayCardTransactionCategory`), and a grouping it never named reads as `MISC` so one new label cannot fail a whole page.
  - `mockPayCardTransactions` answers a page covering every category, served by the desktop and mobile MSW workers on `GET /v1/card/transactions`.

- [#21917](https://github.com/LedgerHQ/ledger-live/pull/21917) [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show card transactions on the Pay Card panel as a list of items, with a subheader when the list is not empty.

- [#21627](https://github.com/LedgerHQ/ledger-live/pull/21627) [`8b3320d`](https://github.com/LedgerHQ/ledger-live/commit/8b3320d7aab0ff25eeb8930dafa536fb94962c79) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add `getCardTransactions` for `GET /v1/card/transactions`.

  - Newest first, paged by number. The provider answers with a bare array, so a short page is how a caller learns it reached the end.
  - Narrowed to what a transaction list shows. The card and processor ids, the MCC number, the conversion rates and the funding sources are left undeclared, so Zod drops them before they reach the cache.
  - `declineReason` accepts the `""` the provider sends on a transaction that was not declined.
  - `dateFrom` and `dateTo` are validated as a pair before the request goes out, because the provider rejects one without the other.

- [#21635](https://github.com/LedgerHQ/ledger-live/pull/21635) [`e65a6b3`](https://github.com/LedgerHQ/ledger-live/commit/e65a6b3e67e271343b7029613498176b1da2d7d2) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add `getWalletHistory` for `GET /v1/wallet/history`.

  - One wallet at a time, newest first, ten to a page. A card has several linked, so reading them all means one call per wallet.
  - `walletCurrency` is required for an internal wallet and checked before the request goes out, because the provider errors without it.
  - `sign` is lowercase here and uppercase on a card transaction. The schema keeps the wire's own case rather than hiding the difference from whatever has to reconcile the two.

- [#21947](https://github.com/LedgerHQ/ledger-live/pull/21947) [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay Card transaction detail sheet with tracking and copyable transaction IDs.

### Patch Changes

- Updated dependencies [[`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438)]:
  - @domain/entity-card-asset-mapping@0.6.0-next.0
  - @shared/api-services@0.7.0

## 0.5.0

### Minor Changes

- [#21548](https://github.com/LedgerHQ/ledger-live/pull/21548) [`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a getCardOnboardingStatus RTK Query endpoint and a schema-validated mock fixture.

- [#21467](https://github.com/LedgerHQ/ledger-live/pull/21467) [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add `createCardDetailsToken` for `POST /v1/card/details/token`.

  - Answers with a single-use token and an image URL that renders PAN, CVV and expiry, so the app never handles the card data itself.
  - A mutation, not a query: the provider spends the token on first use, so the answer must never be served from a cache.
  - Takes the documented `customCss` colours, and validates them as hex before the provider answers 422.
  - `imageUrl` must be an `https` URL: it is loaded straight into an image.
  - RTK Query retains a tracked mutation result, so callers dispatch with `track: false` or reset once the URL is used. The answer is a credential.

- [#21444](https://github.com/LedgerHQ/ledger-live/pull/21444) [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add a "Card interaction" screen to the Card / Pay devtool.

  - Calls a signed-in cardholder's endpoints on demand and prints what they answer, so the data can be checked before any screen renders it.
  - First probe: card status. Probes are a list, so further endpoints are one entry each.
  - Exports `useLazyGetCardStatusQuery`, which a button-triggered fetch needs.
  - Native only for now.

- [#21163](https://github.com/LedgerHQ/ledger-live/pull/21163) [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add `freezeCard` and `unfreezeCard` for `POST /v1/card/freeze` and `POST /v1/card/unfreeze`.

  - Mutations taking no argument: the provider documents no request body for either.
  - Both invalidate `CardStatus`, so the status refetches itself after the card moves between `ACTIVE` and `FROZEN` — no caller has to sequence the two.
  - Each carries its own documented 400: `Card is already frozen` on freeze, `Card is not frozen` on unfreeze.
  - Drops the README row for `initiateAuthorize`, which the endpoint table still listed after that endpoint was removed.

- [#21445](https://github.com/LedgerHQ/ledger-live/pull/21445) [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Name the fields a Card response was rejected on.

  - A schema failure reported only `expected string, received undefined`, naming no field, because RTK Query keeps just the thrown error's message unless the api converts it.
  - `catchSchemaFailure` now lists every failing path, so one run reports them all.
  - The rejected value is never carried into the error: a Card response holds the cardholder's name and PAN digits.
  - An internal wallet with no address memo answers with the key absent, not `null`, so `addressMemo` is nullish.

- [#21534](https://github.com/LedgerHQ/ledger-live/pull/21534) [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Accept a card status with no holder name or expiry date.

  - A live card answers `/v1/card/status` without `holderName` or `expiryDate`, and the response was rejected, so the endpoint returned nothing at all.
  - Both are optional now; every other field stays required.

- [#21194](https://github.com/LedgerHQ/ledger-live/pull/21194) [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Refresh Baanx Pay Card sessions after a 401, and keep the credentials out of every reader of redux.

  The two OAuth2 grants are RTK Query endpoints again. Both opt out of the Bearer and out of the
  renewal, both run with `track: false`, so no session becomes a cache entry, and neither has a hook.

  The desktop redux logger and both DevTools configurations now strip every Card action, which also
  closes a live leak: the code exchange logs its code and its code verifier in production, into the
  file users attach to a support ticket.

### Patch Changes

- Updated dependencies [[`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @shared/api-services@0.7.0

## 0.5.0-next.0

### Minor Changes

- [#21548](https://github.com/LedgerHQ/ledger-live/pull/21548) [`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a getCardOnboardingStatus RTK Query endpoint and a schema-validated mock fixture.

- [#21467](https://github.com/LedgerHQ/ledger-live/pull/21467) [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add `createCardDetailsToken` for `POST /v1/card/details/token`.

  - Answers with a single-use token and an image URL that renders PAN, CVV and expiry, so the app never handles the card data itself.
  - A mutation, not a query: the provider spends the token on first use, so the answer must never be served from a cache.
  - Takes the documented `customCss` colours, and validates them as hex before the provider answers 422.
  - `imageUrl` must be an `https` URL: it is loaded straight into an image.
  - RTK Query retains a tracked mutation result, so callers dispatch with `track: false` or reset once the URL is used. The answer is a credential.

- [#21444](https://github.com/LedgerHQ/ledger-live/pull/21444) [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add a "Card interaction" screen to the Card / Pay devtool.

  - Calls a signed-in cardholder's endpoints on demand and prints what they answer, so the data can be checked before any screen renders it.
  - First probe: card status. Probes are a list, so further endpoints are one entry each.
  - Exports `useLazyGetCardStatusQuery`, which a button-triggered fetch needs.
  - Native only for now.

- [#21163](https://github.com/LedgerHQ/ledger-live/pull/21163) [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add `freezeCard` and `unfreezeCard` for `POST /v1/card/freeze` and `POST /v1/card/unfreeze`.

  - Mutations taking no argument: the provider documents no request body for either.
  - Both invalidate `CardStatus`, so the status refetches itself after the card moves between `ACTIVE` and `FROZEN` — no caller has to sequence the two.
  - Each carries its own documented 400: `Card is already frozen` on freeze, `Card is not frozen` on unfreeze.
  - Drops the README row for `initiateAuthorize`, which the endpoint table still listed after that endpoint was removed.

- [#21445](https://github.com/LedgerHQ/ledger-live/pull/21445) [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Name the fields a Card response was rejected on.

  - A schema failure reported only `expected string, received undefined`, naming no field, because RTK Query keeps just the thrown error's message unless the api converts it.
  - `catchSchemaFailure` now lists every failing path, so one run reports them all.
  - The rejected value is never carried into the error: a Card response holds the cardholder's name and PAN digits.
  - An internal wallet with no address memo answers with the key absent, not `null`, so `addressMemo` is nullish.

- [#21534](https://github.com/LedgerHQ/ledger-live/pull/21534) [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Accept a card status with no holder name or expiry date.

  - A live card answers `/v1/card/status` without `holderName` or `expiryDate`, and the response was rejected, so the endpoint returned nothing at all.
  - Both are optional now; every other field stays required.

- [#21194](https://github.com/LedgerHQ/ledger-live/pull/21194) [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Refresh Baanx Pay Card sessions after a 401, and keep the credentials out of every reader of redux.

  The two OAuth2 grants are RTK Query endpoints again. Both opt out of the Bearer and out of the
  renewal, both run with `track: false`, so no session becomes a cache entry, and neither has a hook.

  The desktop redux logger and both DevTools configurations now strip every Card action, which also
  closes a live leak: the code exchange logs its code and its code verifier in production, into the
  file users attach to a support ticket.

### Patch Changes

- Updated dependencies [[`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @shared/api-services@0.7.0-next.0

## 0.4.0

### Minor Changes

- [#20980](https://github.com/LedgerHQ/ledger-live/pull/20980) [`6918e5b`](https://github.com/LedgerHQ/ledger-live/commit/6918e5b285afe016d54f95090d44db3c1467fcec) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add the `getCardStatus` query for `GET /v1/card/status`.

  - Makes an ordered card observable: `orderCard` answers `{ success: true }` and nothing else.
  - New `CardStatus` cache tag — provided by the query, invalidated by `orderCard`, so a successful
    order refetches the status on its own.
  - `PayCardStatusResponseSchema` stays narrow, keeping any PAN, CVV or PIN the endpoint might grow out
    of the RTK Query cache.
  - A user who never ordered a card surfaces as `error.status === 404`, not as an empty success.
  - Drops the unused `CardManagement` tag, which no endpoint provided or invalidated.

- [#21121](https://github.com/LedgerHQ/ledger-live/pull/21121) [`e8c2316`](https://github.com/LedgerHQ/ledger-live/commit/e8c23168916415e569b27b530c71785e0dd2f29e) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Align the Card schemas and their tests with the provider's documented responses:

  - Test payloads are now the documented examples, field for field, instead of invented ones. The card id is a digit string (`"000000000050277836"`), not a uuid — which is why the schema does not pin one.
  - Drops test data that injected `pan`, `cvv`, `pin` and `cardId`. The status response documents none of them, so those cases asserted behaviour against a payload the provider never sends.
  - Adds `PayCardErrorResponseSchema` for the `{ message }` body every documented Card error returns, and builds the error fixtures through it. Deliberately not wired to `rawErrorResponseSchema`: a validation failure there would replace the `FetchBaseQueryError`, and `isUnauthorizedError` reads `status === 401` off it to end a session.
  - The 404 fixture now carries the documented `"Card not found"` body.

- [#20999](https://github.com/LedgerHQ/ledger-live/pull/20999) [`9f130fb`](https://github.com/LedgerHQ/ledger-live/commit/9f130fb908ad4596ef5697189633a3470935de75) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add the custodial wallet queries the card balance is built from:

  - `getInternalWallets` for `GET /v1/wallet/internal` — the only endpoint carrying balances, kept as decimal strings so the provider's precision survives.
  - `getCardLinkedWallets` for `GET /v1/wallet/internal/card_linked` — the wallets funding the card, with the priority Baanx charges them in.

  Both schemas are narrow: the internal wallet drops `addressId` and the constant `type`, and neither endpoint is given a cache tag until the link/unlink mutations that would invalidate it exist.

  `addressMemo` accepts an explicit `null`, which is what the provider sends for a wallet with no memo. Requiring a string or an absent key would have failed that wallet, and with it the whole array.

### Patch Changes

- Updated dependencies [[`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8)]:
  - @shared/api-services@0.6.0

## 0.4.0-next.0

### Minor Changes

- [#20980](https://github.com/LedgerHQ/ledger-live/pull/20980) [`6918e5b`](https://github.com/LedgerHQ/ledger-live/commit/6918e5b285afe016d54f95090d44db3c1467fcec) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add the `getCardStatus` query for `GET /v1/card/status`.

  - Makes an ordered card observable: `orderCard` answers `{ success: true }` and nothing else.
  - New `CardStatus` cache tag — provided by the query, invalidated by `orderCard`, so a successful
    order refetches the status on its own.
  - `PayCardStatusResponseSchema` stays narrow, keeping any PAN, CVV or PIN the endpoint might grow out
    of the RTK Query cache.
  - A user who never ordered a card surfaces as `error.status === 404`, not as an empty success.
  - Drops the unused `CardManagement` tag, which no endpoint provided or invalidated.

- [#21121](https://github.com/LedgerHQ/ledger-live/pull/21121) [`e8c2316`](https://github.com/LedgerHQ/ledger-live/commit/e8c23168916415e569b27b530c71785e0dd2f29e) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Align the Card schemas and their tests with the provider's documented responses:

  - Test payloads are now the documented examples, field for field, instead of invented ones. The card id is a digit string (`"000000000050277836"`), not a uuid — which is why the schema does not pin one.
  - Drops test data that injected `pan`, `cvv`, `pin` and `cardId`. The status response documents none of them, so those cases asserted behaviour against a payload the provider never sends.
  - Adds `PayCardErrorResponseSchema` for the `{ message }` body every documented Card error returns, and builds the error fixtures through it. Deliberately not wired to `rawErrorResponseSchema`: a validation failure there would replace the `FetchBaseQueryError`, and `isUnauthorizedError` reads `status === 401` off it to end a session.
  - The 404 fixture now carries the documented `"Card not found"` body.

- [#20999](https://github.com/LedgerHQ/ledger-live/pull/20999) [`9f130fb`](https://github.com/LedgerHQ/ledger-live/commit/9f130fb908ad4596ef5697189633a3470935de75) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add the custodial wallet queries the card balance is built from:

  - `getInternalWallets` for `GET /v1/wallet/internal` — the only endpoint carrying balances, kept as decimal strings so the provider's precision survives.
  - `getCardLinkedWallets` for `GET /v1/wallet/internal/card_linked` — the wallets funding the card, with the priority Baanx charges them in.

  Both schemas are narrow: the internal wallet drops `addressId` and the constant `type`, and neither endpoint is given a cache tag until the link/unlink mutations that would invalidate it exist.

  `addressMemo` accepts an explicit `null`, which is what the provider sends for a wallet with no memo. Requiring a string or an absent key would have failed that wallet, and with it the whole array.

### Patch Changes

- Updated dependencies [[`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8)]:
  - @shared/api-services@0.6.0-next.0

## 0.3.0

### Minor Changes

- [#20593](https://github.com/LedgerHQ/ledger-live/pull/20593) [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Start the Baanx login with a PKCE challenge and a CSRF state (LIVE-34738)

  Pressing Login now mints a login attempt client-side — a 16-byte `state` and a 32-byte PKCE verifier,
  with `code_challenge = BASE64URL(SHA256(verifier))` — and sends it to
  `GET /v1/auth/oauth/authorize/initiate`, whose `url` answer is opened in the platform
  secure browser as before. The randomness comes from the platform CSPRNG on each side: `expo-crypto`
  on mobile, WebCrypto on desktop.

  The redirect URI now reaches the secure browser too, since that is what ends the session:
  `ASWebAuthenticationSession` matches the callback against it, and so does the Android polyfill. The
  opener only opens the URL; the redirect goes back to the app, so the browser result is not read and
  closing the browser shows no error — a cancelled login is not a failed one.

  The initiation carries `mode=api`. Without it the endpoint answers `302` and redirects to the hosted
  UI, which a `fetch` follows into an HTML page; `api` returns the same URL as JSON instead. That answer
  also carries the JWT of Baanx's programmatic flow, which the hosted UI does not need, so the schema
  drops it instead of parking a short-lived credential in the cache.

  The request goes through `useInitiateAuthorizeMutation` from `@domain/api-card-management`, which owns
  the Card Auth contract and injects it into the shared `cardApi` service. Every endpoint there is
  declarative — `query`, `rawResponseSchema`, `transformResponse`, `responseSchema` — so the wire shape
  is validated at the boundary and mapped in one place. `cardApiExtra` keeps only what the base query
  needs: the base URL, the Baanx client key for the `x-client-key` header, and the session accessors.

  The OAuth client id and redirect URI are the app's, so they reach `CardLogin` as an `oauthConfig`
  prop: one value goes to the initiation and to the secure browser, and the token exchange will send it
  again. Baanx uses the same value for the client key and the OAuth `client_id`, and the provider matches
  `ledgerlive://paytab` verbatim on the token exchange. Each platform container opens the returned URL
  itself, and no host-provided opener is needed. The Baanx secret key stays server-side and is never
  sent from the apps.

  The challenge is spent on the initiation, and nothing keeps the attempt afterwards. Completing the
  callback — holding the `state` and the verifier, verifying the `state`, exchanging the code for
  tokens and storing them in `expo-secure-store` — is the remainder of LIVE-34738 and is not part of
  this change.

- [#20979](https://github.com/LedgerHQ/ledger-live/pull/20979) [`0ad6182`](https://github.com/LedgerHQ/ledger-live/commit/0ad6182ac7fa955c01a8fd679182f7fe3b83cace) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add the `orderCard` mutation for `POST /v1/card/order`.

  - A mutation, not a query: ordering a card is not idempotent and Baanx offers no idempotency key.
  - Takes no argument — `VIRTUAL` is the only type the provider issues today, so the body is fixed.
  - `PayCardOrderResponseSchema` declares `success` alone, keeping anything else the order answers with
    out of the RTK Query cache.
  - The base query already sends the base URL, `x-client-key` and the Bearer token, so the endpoint
    restates none of it.

- [#20983](https://github.com/LedgerHQ/ledger-live/pull/20983) [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the Baanx authorize page directly, and drop the CSRF state (LIVE-36301)

  The login no longer asks the backend where to send the user. It builds the authorize URL itself and
  opens the secure browser on it, and the provider hosts the page and owns the redirect. That removes a
  network call, a machine state and one way a login could fail.

  ```
  GET {CARD_API_URL}/v1/auth/oauth2/authorize
    ?client_id=…&response_type=code
    &scope=openid profile email offline_access
    &redirect_uri=…&code_challenge=…&code_challenge_method=S256&prompt=consent
  ```

  The attempt is now a PKCE pair alone. The redirect carries `code`, and the `state` that used to travel
  with it is gone, because PKCE already ties the code to the verifier on disk: the provider issues the
  code against this attempt's challenge, so no other attempt can exchange it. Both token grants move to
  `/v1/auth/oauth2/token`, and neither repeats `redirect_uri` there: Baanx's contract for that endpoint
  takes only `grant_type`, `code`, and `code_verifier`.

  `oauthConfig` gains `apiUrl`, which is the host the authorize page lives on.

  `prepareAttempt` builds the authorize URL, rather than the transition that follows it. The URL builder
  throws on a misconfigured `apiUrl`, and a throw inside an action stops the machine instead of reaching
  a transition. From the actor it lands on `onError`, which wipes the stored attempt and reports a
  failure the user can retry.

  A live exchange against Baanx's UAT environment answered with no `refresh_token_expires_in`, which
  `PayCardSessionResponseSchema` required. That field is gone from the schema, the session, and the
  stored lifetimes: Baanx's contract carries no lifetime for the refresh token, only for the access
  token, so nothing here can track one.

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0

## 0.3.0-next.0

### Minor Changes

- [#20593](https://github.com/LedgerHQ/ledger-live/pull/20593) [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Start the Baanx login with a PKCE challenge and a CSRF state (LIVE-34738)

  Pressing Login now mints a login attempt client-side — a 16-byte `state` and a 32-byte PKCE verifier,
  with `code_challenge = BASE64URL(SHA256(verifier))` — and sends it to
  `GET /v1/auth/oauth/authorize/initiate`, whose `url` answer is opened in the platform
  secure browser as before. The randomness comes from the platform CSPRNG on each side: `expo-crypto`
  on mobile, WebCrypto on desktop.

  The redirect URI now reaches the secure browser too, since that is what ends the session:
  `ASWebAuthenticationSession` matches the callback against it, and so does the Android polyfill. The
  opener only opens the URL; the redirect goes back to the app, so the browser result is not read and
  closing the browser shows no error — a cancelled login is not a failed one.

  The initiation carries `mode=api`. Without it the endpoint answers `302` and redirects to the hosted
  UI, which a `fetch` follows into an HTML page; `api` returns the same URL as JSON instead. That answer
  also carries the JWT of Baanx's programmatic flow, which the hosted UI does not need, so the schema
  drops it instead of parking a short-lived credential in the cache.

  The request goes through `useInitiateAuthorizeMutation` from `@domain/api-card-management`, which owns
  the Card Auth contract and injects it into the shared `cardApi` service. Every endpoint there is
  declarative — `query`, `rawResponseSchema`, `transformResponse`, `responseSchema` — so the wire shape
  is validated at the boundary and mapped in one place. `cardApiExtra` keeps only what the base query
  needs: the base URL, the Baanx client key for the `x-client-key` header, and the session accessors.

  The OAuth client id and redirect URI are the app's, so they reach `CardLogin` as an `oauthConfig`
  prop: one value goes to the initiation and to the secure browser, and the token exchange will send it
  again. Baanx uses the same value for the client key and the OAuth `client_id`, and the provider matches
  `ledgerlive://paytab` verbatim on the token exchange. Each platform container opens the returned URL
  itself, and no host-provided opener is needed. The Baanx secret key stays server-side and is never
  sent from the apps.

  The challenge is spent on the initiation, and nothing keeps the attempt afterwards. Completing the
  callback — holding the `state` and the verifier, verifying the `state`, exchanging the code for
  tokens and storing them in `expo-secure-store` — is the remainder of LIVE-34738 and is not part of
  this change.

- [#20979](https://github.com/LedgerHQ/ledger-live/pull/20979) [`0ad6182`](https://github.com/LedgerHQ/ledger-live/commit/0ad6182ac7fa955c01a8fd679182f7fe3b83cace) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add the `orderCard` mutation for `POST /v1/card/order`.

  - A mutation, not a query: ordering a card is not idempotent and Baanx offers no idempotency key.
  - Takes no argument — `VIRTUAL` is the only type the provider issues today, so the body is fixed.
  - `PayCardOrderResponseSchema` declares `success` alone, keeping anything else the order answers with
    out of the RTK Query cache.
  - The base query already sends the base URL, `x-client-key` and the Bearer token, so the endpoint
    restates none of it.

- [#20983](https://github.com/LedgerHQ/ledger-live/pull/20983) [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the Baanx authorize page directly, and drop the CSRF state (LIVE-36301)

  The login no longer asks the backend where to send the user. It builds the authorize URL itself and
  opens the secure browser on it, and the provider hosts the page and owns the redirect. That removes a
  network call, a machine state and one way a login could fail.

  ```
  GET {CARD_API_URL}/v1/auth/oauth2/authorize
    ?client_id=…&response_type=code
    &scope=openid profile email offline_access
    &redirect_uri=…&code_challenge=…&code_challenge_method=S256&prompt=consent
  ```

  The attempt is now a PKCE pair alone. The redirect carries `code`, and the `state` that used to travel
  with it is gone, because PKCE already ties the code to the verifier on disk: the provider issues the
  code against this attempt's challenge, so no other attempt can exchange it. Both token grants move to
  `/v1/auth/oauth2/token`, and neither repeats `redirect_uri` there: Baanx's contract for that endpoint
  takes only `grant_type`, `code`, and `code_verifier`.

  `oauthConfig` gains `apiUrl`, which is the host the authorize page lives on.

  `prepareAttempt` builds the authorize URL, rather than the transition that follows it. The URL builder
  throws on a misconfigured `apiUrl`, and a throw inside an action stops the machine instead of reaching
  a transition. From the actor it lands on `onError`, which wipes the stored attempt and reports a
  failure the user can retry.

  A live exchange against Baanx's UAT environment answered with no `refresh_token_expires_in`, which
  `PayCardSessionResponseSchema` required. That field is gone from the schema, the session, and the
  stored lifetimes: Baanx's contract carries no lifetime for the refresh token, only for the access
  token, so nothing here can track one.

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0-next.0

## 0.2.0

### Minor Changes

- [#20702](https://github.com/LedgerHQ/ledger-live/pull/20702) [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + `x-client-key` (`CARD_BAANX_CLIENT_KEY`) + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` / `CARD_BAANX_CLIENT_KEY` envs, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

- [#20096](https://github.com/LedgerHQ/ledger-live/pull/20096) [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Integrate the Card API and give its endpoints a domain owner

  `@domain/api-card-management` gains the Card Auth contract: authorize initiation, authorization-code
  exchange, session refresh, logout and the user read, with their zod wire schemas and inferred types.
  They inject into the shared `cardApi` service, so one reducer, one middleware and one cache serve the
  Card backend, and the base query supplies the base URL, `x-client-key` and the `Authorization: Bearer`
  header from the `@features/platform-card` session.

  `@features/flow-pay-card-auth` owns no network contract any more. It keeps the auth-only `payCardAuth`
  slice and the `CardLogin` component; `useCardLoginViewModel` imports its hook from
  `@domain/api-card-management`, and that import is what triggers the injection. `@domain/api-pay-card`
  and its in-process mock transport are removed, along with the Pay Card mocks.

  Pay Card UI Redux state is owned by the feature flows that use it: the balance filter by
  `@features/flow-pay-card-balance` and the feature-tour flag by `@features/flow-pay-card-feature-tour`.

  Only the login step ships here. The callback code exchange and the card status read stay behind until
  the session has an owner that can store and refresh it.

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc)]:
  - @shared/api-services@0.4.0

## 0.2.0-next.0

### Minor Changes

- [#20702](https://github.com/LedgerHQ/ledger-live/pull/20702) [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + `x-client-key` (`CARD_BAANX_CLIENT_KEY`) + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` / `CARD_BAANX_CLIENT_KEY` envs, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

- [#20096](https://github.com/LedgerHQ/ledger-live/pull/20096) [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Integrate the Card API and give its endpoints a domain owner

  `@domain/api-card-management` gains the Card Auth contract: authorize initiation, authorization-code
  exchange, session refresh, logout and the user read, with their zod wire schemas and inferred types.
  They inject into the shared `cardApi` service, so one reducer, one middleware and one cache serve the
  Card backend, and the base query supplies the base URL, `x-client-key` and the `Authorization: Bearer`
  header from the `@features/platform-card` session.

  `@features/flow-pay-card-auth` owns no network contract any more. It keeps the auth-only `payCardAuth`
  slice and the `CardLogin` component; `useCardLoginViewModel` imports its hook from
  `@domain/api-card-management`, and that import is what triggers the injection. `@domain/api-pay-card`
  and its in-process mock transport are removed, along with the Pay Card mocks.

  Pay Card UI Redux state is owned by the feature flows that use it: the balance filter by
  `@features/flow-pay-card-balance` and the feature-tour flag by `@features/flow-pay-card-feature-tour`.

  Only the login step ships here. The callback code exchange and the card status read stay behind until
  the session has an owner that can store and refresh it.

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc)]:
  - @shared/api-services@0.4.0-next.0
