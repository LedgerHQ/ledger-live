# @domain/api-card-management

## 0.9.0

### Minor Changes

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @shared/api-services@0.13.0

## 0.9.0-next.0

### Minor Changes

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @shared/api-services@0.13.0-next.0

## 0.8.4

### Patch Changes

- Updated dependencies [[`0c62d35`](https://github.com/LedgerHQ/ledger-live/commit/0c62d3533f72e450c2235f8d23aa1cdb101486a9)]:
  - @shared/api-services@0.12.0

## 0.8.4-next.0

### Patch Changes

- Updated dependencies [[`0c62d35`](https://github.com/LedgerHQ/ledger-live/commit/0c62d3533f72e450c2235f8d23aa1cdb101486a9)]:
  - @shared/api-services@0.12.0-next.0

## 0.8.3

### Patch Changes

- Updated dependencies [[`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153), [`0953772`](https://github.com/LedgerHQ/ledger-live/commit/0953772eafec52773cf7a19c08295c72a2e296a2)]:
  - @shared/api-services@0.11.0

## 0.8.3-next.0

### Patch Changes

- Updated dependencies [[`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153), [`0953772`](https://github.com/LedgerHQ/ledger-live/commit/0953772eafec52773cf7a19c08295c72a2e296a2)]:
  - @shared/api-services@0.11.0-next.0

## 0.8.2

### Patch Changes

- Updated dependencies []:
  - @shared/api-services@0.10.1

## 0.8.2-next.0

### Patch Changes

- Updated dependencies []:
  - @shared/api-services@0.10.1-next.0

## 0.8.1

### Patch Changes

- Updated dependencies [[`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c)]:
  - @shared/api-services@0.10.0
  - @domain/entity-card-asset-mapping@0.7.0

## 0.8.1-next.0

### Patch Changes

- Updated dependencies [[`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c)]:
  - @shared/api-services@0.10.0-next.0
  - @domain/entity-card-asset-mapping@0.7.0

## 0.8.0

### Minor Changes

- [#22404](https://github.com/LedgerHQ/ledger-live/pull/22404) [`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the card cashback banner from `GET /v1/card/cashback`

  - Add `getCardCashback` endpoint, resolving the asset's `currency`/`network` pair (both nullable) to its `ledgerId`
  - Remove `getRewardWallet` (`GET /v1/wallet/reward`), its schema, types, mock and handlers
  - `useCardCashback` replaces `useCardRewardWallet` in the reward banner
  - Banner subtitle now shows the rate and ticker: "Total cashback · 1% in BTC"
  - `cardRewardsAvailable` / `cardRewardCurrency` analytics now read the cashback (amount > 0)

- [#22321](https://github.com/LedgerHQ/ledger-live/pull/22321) [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the Pay Card transaction history one page at a time.

  - `getCardTransactions` is an infinite query; `useGetCardTransactionsQuery` becomes `useGetCardTransactionsInfiniteQuery`.
  - `page` moves off the filters onto the query's page param, so `PayCardTransactionsRequest` is filters only.
  - The provider answers a page past the end with an empty array, so an empty page ends the reading. No page size is documented, so a short page is read past at the cost of one further request.
  - A failure over pages already read no longer blanks the list — a later page or a failed refresh alike. Such a failure is not announced anywhere yet.
  - `useCardTransactionsViewModel` exposes `loadMore` and `isLoadingMore`; no surface calls them yet.
  - The joined list is ordered by `dateTime`, newest first, with repeats dropped, because a charge landing between two reads shifts the paging. The ordering applies to callers that only ever read one page.
  - `toPayGlobalProperties` takes `hasCardTransactions: boolean` in place of the transaction list, so analytics reads the first page through `hasCardTransactions` rather than joining the cached history on every `track()`.
  - `loadMore` is not offered once a read has failed, so a scroll-driven caller cannot turn one failure into a request loop.
  - The MSW mock pages, and its page size drops from the 10 #22236 sliced at to 6 — 10 exceeded the eight-charge fixture, so that mock never paged.

- [#22353](https://github.com/LedgerHQ/ledger-live/pull/22353) [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show a counter-value on the card rewards banner.

  - The reward wallet now carries the currency it is denominated in, like a linked wallet does.
  - The banner prices it with the host's rates and leads with the counter-value.
  - The amount is formatted as a token, not as fiat.
  - A reward nothing can price shows the asset amount alone.
  - `priceWallet` is renamed `getCounterValue`: it converts an amount, it does not price a wallet.

- [#22522](https://github.com/LedgerHQ/ledger-live/pull/22522) [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the cropped transaction name and date on a card charge funded by several assets, and round card crypto amounts like the rest of the product. A devtool action and a mock fixture now produce such a charge.

### Patch Changes

- Updated dependencies [[`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43)]:
  - @shared/api-services@0.9.0

## 0.8.0-next.0

### Minor Changes

- [#22404](https://github.com/LedgerHQ/ledger-live/pull/22404) [`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the card cashback banner from `GET /v1/card/cashback`

  - Add `getCardCashback` endpoint, resolving the asset's `currency`/`network` pair (both nullable) to its `ledgerId`
  - Remove `getRewardWallet` (`GET /v1/wallet/reward`), its schema, types, mock and handlers
  - `useCardCashback` replaces `useCardRewardWallet` in the reward banner
  - Banner subtitle now shows the rate and ticker: "Total cashback · 1% in BTC"
  - `cardRewardsAvailable` / `cardRewardCurrency` analytics now read the cashback (amount > 0)

- [#22321](https://github.com/LedgerHQ/ledger-live/pull/22321) [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the Pay Card transaction history one page at a time.

  - `getCardTransactions` is an infinite query; `useGetCardTransactionsQuery` becomes `useGetCardTransactionsInfiniteQuery`.
  - `page` moves off the filters onto the query's page param, so `PayCardTransactionsRequest` is filters only.
  - The provider answers a page past the end with an empty array, so an empty page ends the reading. No page size is documented, so a short page is read past at the cost of one further request.
  - A failure over pages already read no longer blanks the list — a later page or a failed refresh alike. Such a failure is not announced anywhere yet.
  - `useCardTransactionsViewModel` exposes `loadMore` and `isLoadingMore`; no surface calls them yet.
  - The joined list is ordered by `dateTime`, newest first, with repeats dropped, because a charge landing between two reads shifts the paging. The ordering applies to callers that only ever read one page.
  - `toPayGlobalProperties` takes `hasCardTransactions: boolean` in place of the transaction list, so analytics reads the first page through `hasCardTransactions` rather than joining the cached history on every `track()`.
  - `loadMore` is not offered once a read has failed, so a scroll-driven caller cannot turn one failure into a request loop.
  - The MSW mock pages, and its page size drops from the 10 #22236 sliced at to 6 — 10 exceeded the eight-charge fixture, so that mock never paged.

- [#22353](https://github.com/LedgerHQ/ledger-live/pull/22353) [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show a counter-value on the card rewards banner.

  - The reward wallet now carries the currency it is denominated in, like a linked wallet does.
  - The banner prices it with the host's rates and leads with the counter-value.
  - The amount is formatted as a token, not as fiat.
  - A reward nothing can price shows the asset amount alone.
  - `priceWallet` is renamed `getCounterValue`: it converts an amount, it does not price a wallet.

- [#22522](https://github.com/LedgerHQ/ledger-live/pull/22522) [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the cropped transaction name and date on a card charge funded by several assets, and round card crypto amounts like the rest of the product. A devtool action and a mock fixture now produce such a charge.

### Patch Changes

- Updated dependencies [[`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43)]:
  - @shared/api-services@0.9.0-next.0

## 0.7.0

### Minor Changes

- [#22149](https://github.com/LedgerHQ/ledger-live/pull/22149) [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add card reward wallet endpoint and mobile reward balance view

- [#22077](https://github.com/LedgerHQ/ledger-live/pull/22077) [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the card onboarding widget to real, derived onboarding data and remove the unused stub endpoint and legacy devtool mock path it replaces

- [#22061](https://github.com/LedgerHQ/ledger-live/pull/22061) [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Link a custodial wallet to the card as a funding source.

  - `linkWalletToCard` posts the wallet's `addressId` to `/v1/wallet/internal/card_linked`.
  - `getInternalWallets` now answers `addressId`, optional, which is what the link is made by.
  - `getCardLinkedWallets` gains a `CardLinkedWallets` tag the link invalidates, and only a made link invalidates it: neither an error nor a `success: false` answer changed the set.

- [#21986](https://github.com/LedgerHQ/ledger-live/pull/21986) [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the wallet the card's rewards are paid into.

  - `getRewardWallet` calls `GET /v1/wallet/reward` and answers the holder's single reward wallet: id, balance, currency and whether the funds can be withdrawn.
  - The balance stays a string, so a decimal that survived the wire is not rounded on the way in.
  - `type` is dropped: the endpoint always answers `"REWARD"`, so it says nothing a caller could use.

- [#22204](https://github.com/LedgerHQ/ledger-live/pull/22204) [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the cashback a card transaction earned.

  - `PayCardTransactionSchema` gains an optional `cashback`: the reward-token `amount`/`currency`, its `fiatAmount`/`fiatCurrency`, the `ratePercent` behind them, and a `status`.
  - Amounts stay strings; `status` is a plain string, not an enum, while the provider's values are being confirmed.
  - Optional and caught, so a charge that earned nothing is still a transaction worth listing.
  - The mocked page pairs every settled charge with a cashback and leaves the declined and reverted ones without one.

- [#21495](https://github.com/LedgerHQ/ledger-live/pull/21495) [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add `unlinkWalletFromCard` for `DELETE /v1/wallet/internal/card_linked`.

  - Identifies the wallet by `addressId`, and reuses the link request/response schemas.
  - Invalidates `CardLinkedWallets` only on `success: true`, matching `linkWalletToCard`.

- [#22062](https://github.com/LedgerHQ/ledger-live/pull/22062) [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Rewrite the order the card's linked wallets are charged in.

  - `updateCardWalletPriorities` puts the whole order to `/v1/wallet/internal/card_linked/priority`, each wallet named by its `addressId`.
  - Duplicate priorities and a repeated wallet are rejected before the request is sent, as is an empty order.
  - Only a written order invalidates the `CardLinkedWallets` tag: neither an error nor a `success: false` answer changed the order.

- [#22118](https://github.com/LedgerHQ/ledger-live/pull/22118) [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the two flags the card status response gained.

  - `cardAddedToDigitalWallet`: whether the card sits in Apple/Google Wallet.
  - `isFreezable`: whether the card may be frozen, which `status` does not say.
  - Both optional, so a tenant that answers for neither still parses. They were being dropped: zod strips what the schema does not declare.
  - The dev tool's Card Status probe prints the parsed response, so both show there.

- [#22136](https://github.com/LedgerHQ/ledger-live/pull/22136) [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Answer the mocked wallet endpoints with three linked wallets, so the combined data carries three card assets.

  - `GET /v1/wallet/internal` and `/card_linked` now describe three wallets on three chains (usdc/ethereum, btc/bitcoin, sol/solana) instead of one.
  - All three pairs are in the Baanx catalog, so each row resolves to its own Ledger currency.
  - Every wallet is linked, so the join matches all three and the balance screen has rows that price differently.
  - Unfunded empties the balances rather than dropping the wallets.

- [#22121](https://github.com/LedgerHQ/ledger-live/pull/22121) [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Answer the phone wallet step from the provider alone.

  - Mobile reads `cardAddedToDigitalWallet` from the card status for the onboarding step.
  - The device answer is gone: `hasAddedCardToWallet`, its two actions and its selector leave the widget state. The Add-to-Wallet CTA now hides on the provider's answer, and the instructions scene re-asks the card status instead of recording a local yes.
  - A tenant that does not send the flag leaves the step undone and keeps offering the CTA.
  - The onboarding mock gained `cardAddedToDigitalWallet`, so the dev tool's wallet toggle drives the mocked endpoint and follows request mocking like every other step.

- [#22301](https://github.com/LedgerHQ/ledger-live/pull/22301) [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Consume the shared Pay analytics provider across card flows.

- [#22236](https://github.com/LedgerHQ/ledger-live/pull/22236) [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Pay Card devtools controls for transaction and wallet balance fixtures, and answer the mocked wallet reorder with the order alone so linked assets keep the amounts they were showing while the reordered row shows its spinner.

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`8e556b1`](https://github.com/LedgerHQ/ledger-live/commit/8e556b198bdf546968458347b0cad3e954ed4adb), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac)]:
  - @shared/api-services@0.8.0
  - @domain/entity-card-asset-mapping@0.7.0

## 0.7.0-next.0

### Minor Changes

- [#22149](https://github.com/LedgerHQ/ledger-live/pull/22149) [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add card reward wallet endpoint and mobile reward balance view

- [#22077](https://github.com/LedgerHQ/ledger-live/pull/22077) [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the card onboarding widget to real, derived onboarding data and remove the unused stub endpoint and legacy devtool mock path it replaces

- [#22061](https://github.com/LedgerHQ/ledger-live/pull/22061) [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Link a custodial wallet to the card as a funding source.

  - `linkWalletToCard` posts the wallet's `addressId` to `/v1/wallet/internal/card_linked`.
  - `getInternalWallets` now answers `addressId`, optional, which is what the link is made by.
  - `getCardLinkedWallets` gains a `CardLinkedWallets` tag the link invalidates, and only a made link invalidates it: neither an error nor a `success: false` answer changed the set.

- [#21986](https://github.com/LedgerHQ/ledger-live/pull/21986) [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the wallet the card's rewards are paid into.

  - `getRewardWallet` calls `GET /v1/wallet/reward` and answers the holder's single reward wallet: id, balance, currency and whether the funds can be withdrawn.
  - The balance stays a string, so a decimal that survived the wire is not rounded on the way in.
  - `type` is dropped: the endpoint always answers `"REWARD"`, so it says nothing a caller could use.

- [#22204](https://github.com/LedgerHQ/ledger-live/pull/22204) [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the cashback a card transaction earned.

  - `PayCardTransactionSchema` gains an optional `cashback`: the reward-token `amount`/`currency`, its `fiatAmount`/`fiatCurrency`, the `ratePercent` behind them, and a `status`.
  - Amounts stay strings; `status` is a plain string, not an enum, while the provider's values are being confirmed.
  - Optional and caught, so a charge that earned nothing is still a transaction worth listing.
  - The mocked page pairs every settled charge with a cashback and leaves the declined and reverted ones without one.

- [#21495](https://github.com/LedgerHQ/ledger-live/pull/21495) [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add `unlinkWalletFromCard` for `DELETE /v1/wallet/internal/card_linked`.

  - Identifies the wallet by `addressId`, and reuses the link request/response schemas.
  - Invalidates `CardLinkedWallets` only on `success: true`, matching `linkWalletToCard`.

- [#22062](https://github.com/LedgerHQ/ledger-live/pull/22062) [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Rewrite the order the card's linked wallets are charged in.

  - `updateCardWalletPriorities` puts the whole order to `/v1/wallet/internal/card_linked/priority`, each wallet named by its `addressId`.
  - Duplicate priorities and a repeated wallet are rejected before the request is sent, as is an empty order.
  - Only a written order invalidates the `CardLinkedWallets` tag: neither an error nor a `success: false` answer changed the order.

- [#22118](https://github.com/LedgerHQ/ledger-live/pull/22118) [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the two flags the card status response gained.

  - `cardAddedToDigitalWallet`: whether the card sits in Apple/Google Wallet.
  - `isFreezable`: whether the card may be frozen, which `status` does not say.
  - Both optional, so a tenant that answers for neither still parses. They were being dropped: zod strips what the schema does not declare.
  - The dev tool's Card Status probe prints the parsed response, so both show there.

- [#22136](https://github.com/LedgerHQ/ledger-live/pull/22136) [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Answer the mocked wallet endpoints with three linked wallets, so the combined data carries three card assets.

  - `GET /v1/wallet/internal` and `/card_linked` now describe three wallets on three chains (usdc/ethereum, btc/bitcoin, sol/solana) instead of one.
  - All three pairs are in the Baanx catalog, so each row resolves to its own Ledger currency.
  - Every wallet is linked, so the join matches all three and the balance screen has rows that price differently.
  - Unfunded empties the balances rather than dropping the wallets.

- [#22121](https://github.com/LedgerHQ/ledger-live/pull/22121) [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Answer the phone wallet step from the provider alone.

  - Mobile reads `cardAddedToDigitalWallet` from the card status for the onboarding step.
  - The device answer is gone: `hasAddedCardToWallet`, its two actions and its selector leave the widget state. The Add-to-Wallet CTA now hides on the provider's answer, and the instructions scene re-asks the card status instead of recording a local yes.
  - A tenant that does not send the flag leaves the step undone and keeps offering the CTA.
  - The onboarding mock gained `cardAddedToDigitalWallet`, so the dev tool's wallet toggle drives the mocked endpoint and follows request mocking like every other step.

- [#22301](https://github.com/LedgerHQ/ledger-live/pull/22301) [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Consume the shared Pay analytics provider across card flows.

- [#22236](https://github.com/LedgerHQ/ledger-live/pull/22236) [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Pay Card devtools controls for transaction and wallet balance fixtures, and answer the mocked wallet reorder with the order alone so linked assets keep the amounts they were showing while the reordered row shows its spinner.

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`8e556b1`](https://github.com/LedgerHQ/ledger-live/commit/8e556b198bdf546968458347b0cad3e954ed4adb), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac)]:
  - @shared/api-services@0.8.0-next.0
  - @domain/entity-card-asset-mapping@0.7.0-next.0

## 0.6.0

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
  - @domain/entity-card-asset-mapping@0.6.0
  - @shared/api-services@0.7.0

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

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
