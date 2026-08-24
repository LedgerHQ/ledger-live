# @shared/env

## 0.3.0

### Minor Changes

- [#20702](https://github.com/LedgerHQ/ledger-live/pull/20702) [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + `x-client-key` (`CARD_BAANX_CLIENT_KEY`) + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` / `CARD_BAANX_CLIENT_KEY` envs, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20785](https://github.com/LedgerHQ/ledger-live/pull/20785) [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3) Thanks [@semeano](https://github.com/semeano)! - Update Aptos node and indexer endpoints

- [#20715](https://github.com/LedgerHQ/ledger-live/pull/20715) [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix EVM transactions being signed with a zero gas limit, and widen the EIP-1559 max fee headroom.

  When gas estimation failed, its `BigNumber(0)` fallback travelled back to the sign step, where it was read as a deliberate custom gas limit. That disabled re-estimation and produced a transaction the node rejected with `intrinsic gas too low`. A non-positive gas limit is no longer honoured as a custom value, so the estimation runs again, and crafting now fails rather than sending a zero gas limit to the device (LIVE-32644).

  `EIP1559_BASE_FEE_MULTIPLIER` goes from 1.27 to 1.6, so an estimated transaction stays includable for 4 blocks instead of 2 (the base fee grows by at most 12.5% per block). Max fees displayed on chains using the Ledger gas tracker will be higher, but the amount actually paid is unchanged: EIP-1559 charges the base fee plus the priority fee, and the max fee is only a ceiling (LIVE-32650).

## 0.3.0-next.0

### Minor Changes

- [#20702](https://github.com/LedgerHQ/ledger-live/pull/20702) [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + `x-client-key` (`CARD_BAANX_CLIENT_KEY`) + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` / `CARD_BAANX_CLIENT_KEY` envs, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20785](https://github.com/LedgerHQ/ledger-live/pull/20785) [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3) Thanks [@semeano](https://github.com/semeano)! - Update Aptos node and indexer endpoints

- [#20715](https://github.com/LedgerHQ/ledger-live/pull/20715) [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix EVM transactions being signed with a zero gas limit, and widen the EIP-1559 max fee headroom.

  When gas estimation failed, its `BigNumber(0)` fallback travelled back to the sign step, where it was read as a deliberate custom gas limit. That disabled re-estimation and produced a transaction the node rejected with `intrinsic gas too low`. A non-positive gas limit is no longer honoured as a custom value, so the estimation runs again, and crafting now fails rather than sending a zero gas limit to the device (LIVE-32644).

  `EIP1559_BASE_FEE_MULTIPLIER` goes from 1.27 to 1.6, so an estimated transaction stays includable for 4 blocks instead of 2 (the base fee grows by at most 12.5% per block). Max fees displayed on chains using the Ledger gas tracker will be higher, but the amount actually paid is unchanged: EIP-1559 charges the base fee plus the priority fee, and the max fee is only a ceiling (LIVE-32650).

## 0.2.0

### Minor Changes

- [#20258](https://github.com/LedgerHQ/ledger-live/pull/20258) [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754) Thanks [@thesan](https://github.com/thesan)! - Update the staging Keycloak base URL to use the Gravitee gateway

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

- [#20299](https://github.com/LedgerHQ/ledger-live/pull/20299) [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add base URLs and network mapping for A4

## 0.2.0-next.0

### Minor Changes

- [#20258](https://github.com/LedgerHQ/ledger-live/pull/20258) [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754) Thanks [@thesan](https://github.com/thesan)! - Update the staging Keycloak base URL to use the Gravitee gateway

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

- [#20299](https://github.com/LedgerHQ/ledger-live/pull/20299) [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add base URLs and network mapping for A4

## 0.1.1

### Patch Changes

- Updated dependencies [[`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010)]:
  - @ledgerhq/live-env@3.0.0

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010)]:
  - @ledgerhq/live-env@3.0.0-next.0
