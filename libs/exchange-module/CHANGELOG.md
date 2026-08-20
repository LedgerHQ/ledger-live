# @ledgerhq/wallet-api-exchange-module

## 0.33.0

### Minor Changes

- [#17552](https://github.com/LedgerHQ/ledger-live/pull/17552) [`20efcc6`](https://github.com/LedgerHQ/ledger-live/commit/20efcc67fd38bbba793e23abc1f62a14e29a1104) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - sort wallet-api swap quotes by net countervalue

- [#18013](https://github.com/LedgerHQ/ledger-live/pull/18013) [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7) Thanks [@CremaFR](https://github.com/CremaFR)! - Add `customSwap` to the wallet-api exchange SDK and expose the matching `CustomSwapParams` / `CustomSwapResult` types (also re-exported from `@ledgerhq/live-common/wallet-api/Exchange/swapFlow/types`). This is the live-app entry point for the new device-intent-based swap flow on mobile, which currently runs the EVM token-approval step (sign on device, broadcast, wait for the receipt). Submit-swap and broadcast-swap will follow on the wallet side, reusing this same wire shape.

## 0.33.0-next.0

### Minor Changes

- [#17552](https://github.com/LedgerHQ/ledger-live/pull/17552) [`20efcc6`](https://github.com/LedgerHQ/ledger-live/commit/20efcc67fd38bbba793e23abc1f62a14e29a1104) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - sort wallet-api swap quotes by net countervalue

- [#18013](https://github.com/LedgerHQ/ledger-live/pull/18013) [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7) Thanks [@CremaFR](https://github.com/CremaFR)! - Add `customSwap` to the wallet-api exchange SDK and expose the matching `CustomSwapParams` / `CustomSwapResult` types (also re-exported from `@ledgerhq/live-common/wallet-api/Exchange/swapFlow/types`). This is the live-app entry point for the new device-intent-based swap flow on mobile, which currently runs the EVM token-approval step (sign on device, broadcast, wait for the receipt). Submit-swap and broadcast-swap will follow on the wallet side, reusing this same wire shape.

## 0.32.0

### Minor Changes

- [#18550](https://github.com/LedgerHQ/ledger-live/pull/18550) [`30cfdb1`](https://github.com/LedgerHQ/ledger-live/commit/30cfdb1c3c4bcaa9beab26cb8d28663d7a3daf1e) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add swapEntryPoint tracking field and ptxSwapLiveAppOnAsset feature flag

## 0.32.0-next.0

### Minor Changes

- [#18550](https://github.com/LedgerHQ/ledger-live/pull/18550) [`30cfdb1`](https://github.com/LedgerHQ/ledger-live/commit/30cfdb1c3c4bcaa9beab26cb8d28663d7a3daf1e) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add swapEntryPoint tracking field and ptxSwapLiveAppOnAsset feature flag

## 0.31.0

### Minor Changes

- [#17336](https://github.com/LedgerHQ/ledger-live/pull/17336) [`5210095`](https://github.com/LedgerHQ/ledger-live/commit/52100952ee805aa42f7fc6d8002f496b00211853) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add wallet quote global outcome errors and warnings

- [#17456](https://github.com/LedgerHQ/ledger-live/pull/17456) [`0a78795`](https://github.com/LedgerHQ/ledger-live/commit/0a78795d5319cfac4dd722737c58280624c5f604) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add swap transaction status Wallet API support.

## 0.31.0-next.0

### Minor Changes

- [#17336](https://github.com/LedgerHQ/ledger-live/pull/17336) [`5210095`](https://github.com/LedgerHQ/ledger-live/commit/52100952ee805aa42f7fc6d8002f496b00211853) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add wallet quote global outcome errors and warnings

- [#17456](https://github.com/LedgerHQ/ledger-live/pull/17456) [`0a78795`](https://github.com/LedgerHQ/ledger-live/commit/0a78795d5319cfac4dd722737c58280624c5f604) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add swap transaction status Wallet API support.

## 0.30.0

### Minor Changes

- [#17315](https://github.com/LedgerHQ/ledger-live/pull/17315) [`4160842`](https://github.com/LedgerHQ/ledger-live/commit/4160842477cb55ee5df701b590c201e7c700685a) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add wallet quote errors and warnings metadata for swap consumers.

## 0.30.0-next.0

### Minor Changes

- [#17315](https://github.com/LedgerHQ/ledger-live/pull/17315) [`4160842`](https://github.com/LedgerHQ/ledger-live/commit/4160842477cb55ee5df701b590c201e7c700685a) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add wallet quote errors and warnings metadata for swap consumers.

## 0.29.0

### Minor Changes

- [#16671](https://github.com/LedgerHQ/ledger-live/pull/16671) [`a24e523`](https://github.com/LedgerHQ/ledger-live/commit/a24e5239aab583b25d932d8074f87dbd6ea7685d) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Centralize swap-quote formatting on the wallet side of `custom.exchange.getQuotes`. Each returned `Quote` now carries an optional `formatted: FormattedQuoteValues`, where every field is a `FormattedNumber` triplet (`numberValue` / `withPrefix` / `withSuffix`) — letting live-app consumers display locale-aware crypto, fiat, rate, and slippage values without owning the formatting logic.

  Breaking wire change: `QuotesInput.counterValueCurrency` has been removed. The wallet now sources locale and counter-value currency from its Redux store and threads them into `getQuotes` via the `handlers({ locale, counterValueCurrency, ... })` factory, so the live app no longer needs to pass them on the wire.

## 0.29.0-next.0

### Minor Changes

- [#16671](https://github.com/LedgerHQ/ledger-live/pull/16671) [`a24e523`](https://github.com/LedgerHQ/ledger-live/commit/a24e5239aab583b25d932d8074f87dbd6ea7685d) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Centralize swap-quote formatting on the wallet side of `custom.exchange.getQuotes`. Each returned `Quote` now carries an optional `formatted: FormattedQuoteValues`, where every field is a `FormattedNumber` triplet (`numberValue` / `withPrefix` / `withSuffix`) — letting live-app consumers display locale-aware crypto, fiat, rate, and slippage values without owning the formatting logic.

  Breaking wire change: `QuotesInput.counterValueCurrency` has been removed. The wallet now sources locale and counter-value currency from its Redux store and threads them into `getQuotes` via the `handlers({ locale, counterValueCurrency, ... })` factory, so the live app no longer needs to pass them on the wire.

## 0.28.0

### Minor Changes

- [#16529](https://github.com/LedgerHQ/ledger-live/pull/16529) [`8bf2ba7`](https://github.com/LedgerHQ/ledger-live/commit/8bf2ba7039d42a8c50394e3ac10685be79698f91) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Wallet-side Swap quotes: emit network-fee estimate on each quote

  - Add `QuoteDetails.estimatedNetworkFee` and the new `QuoteDetails.approvalNetworkFee` (shaped identically) so consumers can display a split breakdown ("Network: X, Token approval: Y") or sum the two for a total cost. `approvalNetworkFee` is only emitted when a pre-swap ERC-20 approval is required.
  - `custom.exchange.getQuotes` now computes fees wallet-side: one upfront bridge call per invocation gathers default-strategy gas parameters and the fee-paying account balance, then each quote is normalized against that context. EVM uses `maxFeePerGas`/`gasPrice` × `gasLimit` (+`APPROVAL_GAS_LIMIT` when needed); non-EVM chains fall back to the bridge-reported estimate; Solana uses a hardcoded 0.003 SOL override.
  - Start emitting `QuoteError = "notEnoughBalanceForFees"` per quote when the fee-paying account balance can't cover `estimatedNetworkFee + approvalNetworkFee`, gated on the quote actually having an on-chain cost (non-zero `networkFees.value` or `isTokenApprovalRequired`).

- [#16081](https://github.com/LedgerHQ/ledger-live/pull/16081) [`bc99a32`](https://github.com/LedgerHQ/ledger-live/commit/bc99a32703ac5b4a30de79c2eebac0f1936a7f83) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add custom handler for Swap quotes fetching to Wallet common

  - add simple quote fetch service
  - add data normalisation
  - make accessable through wallet api

- [#16526](https://github.com/LedgerHQ/ledger-live/pull/16526) [`4135055`](https://github.com/LedgerHQ/ledger-live/commit/4135055cd19e68b064f27454c536fcc5b047ffbb) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Normalize additional Swap quote fields inside the Wallet API

  - Normalize `payoutNetworkFees` and `tokenAllowance` to the wallet schema (remapping `currency` → `currencyId`, preserving deep structure).
  - Expose raw `tags` (`isRegistrationRequired`, `isTokenApprovalRequired`) on `QuoteDetails` so KYC and token-approval gating is driven by the normalized shape.
  - Hoist the legacy `customFields` permit bag into a single optional `permitData` envelope, preferring `customFields.permitData` (UniswapX) over `customFields.quoteResponse.typedData` (1inch-fusion) and carrying `orderHash`, `priceRoute`, and `providerTag` alongside.
  - Drop quotes for an unsupported-pair blocklist (currently `near <-> stellar`, direction-agnostic) inside `getQuotes`; aggregator errors for the same pair still flow through.

- [#16525](https://github.com/LedgerHQ/ledger-live/pull/16525) [`02d837c`](https://github.com/LedgerHQ/ledger-live/commit/02d837c6cbb4387e3957eee11cc8b4512a70fe97) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Move more Swap quote normalization to Wallet common

  - Extend `QuoteDetails` with additive optional fields: `liquiditySource`, `payoutNetworkFees`, `tokenAllowance`, `tags`, `permitData`, `estimatedNetworkFee`.
  - Reshape `QuoteWarning` into a discriminated union: `{ code: "highSpread" } | { code: "unrealisticQuote"; gainPercent: number }`. Consumers that compared against the `"highSpread"` string literal must switch to `warning.code === "highSpread"`.
  - Normalize fractional provider slippage to one decimal place; safe-integer presets pass through untouched.
  - Derive `liquiditySource` (RFQ/AMM) from the provider id and `customFields["@type"]` so `oneinchfusion` and UniswapX rows are classified consistently instead of relying on the unreliable raw API field.

## 0.28.0-next.0

### Minor Changes

- [#16529](https://github.com/LedgerHQ/ledger-live/pull/16529) [`8bf2ba7`](https://github.com/LedgerHQ/ledger-live/commit/8bf2ba7039d42a8c50394e3ac10685be79698f91) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Wallet-side Swap quotes: emit network-fee estimate on each quote

  - Add `QuoteDetails.estimatedNetworkFee` and the new `QuoteDetails.approvalNetworkFee` (shaped identically) so consumers can display a split breakdown ("Network: X, Token approval: Y") or sum the two for a total cost. `approvalNetworkFee` is only emitted when a pre-swap ERC-20 approval is required.
  - `custom.exchange.getQuotes` now computes fees wallet-side: one upfront bridge call per invocation gathers default-strategy gas parameters and the fee-paying account balance, then each quote is normalized against that context. EVM uses `maxFeePerGas`/`gasPrice` × `gasLimit` (+`APPROVAL_GAS_LIMIT` when needed); non-EVM chains fall back to the bridge-reported estimate; Solana uses a hardcoded 0.003 SOL override.
  - Start emitting `QuoteError = "notEnoughBalanceForFees"` per quote when the fee-paying account balance can't cover `estimatedNetworkFee + approvalNetworkFee`, gated on the quote actually having an on-chain cost (non-zero `networkFees.value` or `isTokenApprovalRequired`).

- [#16081](https://github.com/LedgerHQ/ledger-live/pull/16081) [`bc99a32`](https://github.com/LedgerHQ/ledger-live/commit/bc99a32703ac5b4a30de79c2eebac0f1936a7f83) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add custom handler for Swap quotes fetching to Wallet common

  - add simple quote fetch service
  - add data normalisation
  - make accessable through wallet api

- [#16526](https://github.com/LedgerHQ/ledger-live/pull/16526) [`4135055`](https://github.com/LedgerHQ/ledger-live/commit/4135055cd19e68b064f27454c536fcc5b047ffbb) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Normalize additional Swap quote fields inside the Wallet API

  - Normalize `payoutNetworkFees` and `tokenAllowance` to the wallet schema (remapping `currency` → `currencyId`, preserving deep structure).
  - Expose raw `tags` (`isRegistrationRequired`, `isTokenApprovalRequired`) on `QuoteDetails` so KYC and token-approval gating is driven by the normalized shape.
  - Hoist the legacy `customFields` permit bag into a single optional `permitData` envelope, preferring `customFields.permitData` (UniswapX) over `customFields.quoteResponse.typedData` (1inch-fusion) and carrying `orderHash`, `priceRoute`, and `providerTag` alongside.
  - Drop quotes for an unsupported-pair blocklist (currently `near <-> stellar`, direction-agnostic) inside `getQuotes`; aggregator errors for the same pair still flow through.

- [#16525](https://github.com/LedgerHQ/ledger-live/pull/16525) [`02d837c`](https://github.com/LedgerHQ/ledger-live/commit/02d837c6cbb4387e3957eee11cc8b4512a70fe97) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Move more Swap quote normalization to Wallet common

  - Extend `QuoteDetails` with additive optional fields: `liquiditySource`, `payoutNetworkFees`, `tokenAllowance`, `tags`, `permitData`, `estimatedNetworkFee`.
  - Reshape `QuoteWarning` into a discriminated union: `{ code: "highSpread" } | { code: "unrealisticQuote"; gainPercent: number }`. Consumers that compared against the `"highSpread"` string literal must switch to `warning.code === "highSpread"`.
  - Normalize fractional provider slippage to one decimal place; safe-integer presets pass through untouched.
  - Derive `liquiditySource` (RFQ/AMM) from the provider id and `customFields["@type"]` so `oneinchfusion` and UniswapX rows are classified consistently instead of relying on the unreliable raw API field.

## 0.27.0

### Minor Changes

- [#16023](https://github.com/LedgerHQ/ledger-live/pull/16023) [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: remove eslint and prettier, replace with with oxlint and oxfmt

## 0.27.0-next.0

### Minor Changes

- [#16023](https://github.com/LedgerHQ/ledger-live/pull/16023) [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: remove eslint and prettier, replace with with oxlint and oxfmt

## 0.26.0

### Minor Changes

- [#15498](https://github.com/LedgerHQ/ledger-live/pull/15498) [`691e9e9`](https://github.com/LedgerHQ/ledger-live/commit/691e9e9dcbd59788a70c05b461b8402a9eddc0a8) Thanks [@hhumphrey-ledger](https://github.com/hhumphrey-ledger)! - Pass through and display the correlation ID to the mobile and desktop error UI

## 0.26.0-next.0

### Minor Changes

- [#15498](https://github.com/LedgerHQ/ledger-live/pull/15498) [`691e9e9`](https://github.com/LedgerHQ/ledger-live/commit/691e9e9dcbd59788a70c05b461b8402a9eddc0a8) Thanks [@hhumphrey-ledger](https://github.com/hhumphrey-ledger)! - Pass through and display the correlation ID to the mobile and desktop error UI

## 0.25.0

### Minor Changes

- [#15109](https://github.com/LedgerHQ/ledger-live/pull/15109) [`acd1dd2`](https://github.com/LedgerHQ/ledger-live/commit/acd1dd241dc900408fc480ef155dad3bdf56d786) Thanks [@CremaFR](https://github.com/CremaFR)! - Propagate `uiUseCase` through wallet API account request and align wallet API package dependencies.

## 0.25.0-next.0

### Minor Changes

- [#15109](https://github.com/LedgerHQ/ledger-live/pull/15109) [`acd1dd2`](https://github.com/LedgerHQ/ledger-live/commit/acd1dd241dc900408fc480ef155dad3bdf56d786) Thanks [@CremaFR](https://github.com/CremaFR)! - Propagate `uiUseCase` through wallet API account request and align wallet API package dependencies.

## 0.24.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

## 0.24.0-next.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
