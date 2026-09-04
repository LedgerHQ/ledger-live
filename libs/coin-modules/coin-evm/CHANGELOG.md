# @ledgerhq/coin-evm

## 5.2.0-next.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`83b019e`](https://github.com/LedgerHQ/ledger-live/commit/83b019e128b59a289a28184e58c33b108cd3f188) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` now returns its object with `satisfies CoinModuleImpl<EvmConfigInfo, MemoNotSupported, BufferTxData>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits `craftRawTransaction`, `register`, `getStakes` and `getRewards` instead of giving each a `throw new Error("… is not supported")`.

  Staking is partial rather than absent, which is why the capabilities are per-method: `getValidators` stays and serves the validator list, while no staking position or reward event is read here.

  Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.

- [#21127](https://github.com/LedgerHQ/ledger-live/pull/21127) [`41faac4`](https://github.com/LedgerHQ/ledger-live/commit/41faac432e8c17e3718d90cc26ce6ae650800681) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(evm): drop ledgerhq deps from package.json

- [#21015](https://github.com/LedgerHQ/ledger-live/pull/21015) [`2c70999`](https://github.com/LedgerHQ/ledger-live/commit/2c709990d3569bc50504822ce90c9e9024210312) Thanks [@YazhuEth](https://github.com/YazhuEth)! - fix(coin-framework): follow the listOperations cursor so account history is no longer truncated to one page

  getAccountShape called listOperations once and discarded the returned `next`, so any account with
  more operations than one explorer page never received the rest, and no later sync recovered the
  tail: the walk is newest-first and `minHeight` only ever moves forward, so the pages below the
  first were lost for good.

  It now walks the cursor chain within a sync, treating a falsy cursor as end of stream. The walk is
  unbounded — only a module that cannot progress ends it early: an empty page, or a cursor already
  followed (a repeat, or a longer cycle). The `extra.pagingToken` resume read is removed:
  nothing could ever write it, and `minHeight` is the resume position across syncs.

  On the coin-evm side, the Ledger explorer's `fetchPaginatedOpsWithRetries` appends each batch in
  place instead of rebuilding the whole accumulator (`[...previous, ...batch]`) once per page.

- [#20802](https://github.com/LedgerHQ/ledger-live/pull/20802) [`1cf5583`](https://github.com/LedgerHQ/ledger-live/commit/1cf55832f785fc57881169092f1190fa7ddfecf9) Thanks [@qperrot](https://github.com/qperrot)! - Drive EVM NFT activation from the `supportedTokens` config field instead of `isNFTActive` and the `showNfts` boolean. `EvmConfig.showNfts` is replaced by `supportedTokens: ("erc721" | "erc1155")[]`, so each NFT standard is enabled independently, and coin-evm no longer depends on `@ledgerhq/ledger-wallet-framework/nft`. Activation is checked via explicit standard membership (`supportedTokens.includes("erc721" | "erc1155")`).

## 5.1.0

### Minor Changes

- [#20814](https://github.com/LedgerHQ/ledger-live/pull/20814) [`26d8617`](https://github.com/LedgerHQ/ledger-live/commit/26d86172869e47608dd0f0e26dfbc905dafa3588) Thanks [@henri-ly](https://github.com/henri-ly)! - Remove `@ledgerhq/live-env` from coin-evm (LIVE-33362). The Ledger explorer base URL, the client-version header, the EIP-1559 base-fee multiplier and the legacy-transaction switch now arrive as `EvmConfig` fields (`ledgerExplorerUri`, `ledgerClientVersion`, `eip1559BaseFeeMultiplier`, `forceLegacyTransactions`), each falling back to the value the env used to default to, so the module runs in environments that have no live-env at all. `families/evm/config.ts` supplies the three Ledger-backend settings from the env keys, as `families/tezos/config.ts` already does, so the existing overrides keep working — including the EIP-1559 multiplier exposed in both apps' experimental settings — with per-currency and remote values taking precedence for when the backend serves them (LIVE-22454). They go only to the 8 currencies wired to Ledger's node/explorer/gasTracker, the only ones that can read them, and through a `default` getter rather than a static object, because `LEDGER_CLIENT_VERSION` is set during app boot and the multiplier is edited at runtime, both after that module is imported.

  `forceLegacyTransactions` comes from `EVM_FORCE_LEGACY_TRANSACTIONS` on every currency instead, since the RPC fee path reads it too and not only the Ledger one.

  `X-Ledger-Client-Version` keeps being sent explicitly rather than leaning on the `axios.defaults` header live-network installs: the two files concerned call axios directly, so that default only reaches them if some other module happened to import `live-network/network` first — which does not hold for a consumer embedding coin-evm on its own, and some Ledger backends allowlist on that header.

- [#20879](https://github.com/LedgerHQ/ledger-live/pull/20879) [`306a681`](https://github.com/LedgerHQ/ledger-live/commit/306a6813eaabfd67dc575bb7bdfc2b52892037df) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(cronos): update explorer URL to Ledger proxy and add dedicated "cronos" explorer type that skips txlistinternal (proxy enforces a 10 000-block range limit with no reliable workaround)

### Patch Changes

- Updated dependencies [[`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0)]:
  - @ledgerhq/ledger-wallet-framework@3.1.0

## 5.1.0-next.0

### Minor Changes

- [#20814](https://github.com/LedgerHQ/ledger-live/pull/20814) [`26d8617`](https://github.com/LedgerHQ/ledger-live/commit/26d86172869e47608dd0f0e26dfbc905dafa3588) Thanks [@henri-ly](https://github.com/henri-ly)! - Remove `@ledgerhq/live-env` from coin-evm (LIVE-33362). The Ledger explorer base URL, the client-version header, the EIP-1559 base-fee multiplier and the legacy-transaction switch now arrive as `EvmConfig` fields (`ledgerExplorerUri`, `ledgerClientVersion`, `eip1559BaseFeeMultiplier`, `forceLegacyTransactions`), each falling back to the value the env used to default to, so the module runs in environments that have no live-env at all. `families/evm/config.ts` supplies the three Ledger-backend settings from the env keys, as `families/tezos/config.ts` already does, so the existing overrides keep working — including the EIP-1559 multiplier exposed in both apps' experimental settings — with per-currency and remote values taking precedence for when the backend serves them (LIVE-22454). They go only to the 8 currencies wired to Ledger's node/explorer/gasTracker, the only ones that can read them, and through a `default` getter rather than a static object, because `LEDGER_CLIENT_VERSION` is set during app boot and the multiplier is edited at runtime, both after that module is imported.

  `forceLegacyTransactions` comes from `EVM_FORCE_LEGACY_TRANSACTIONS` on every currency instead, since the RPC fee path reads it too and not only the Ledger one.

  `X-Ledger-Client-Version` keeps being sent explicitly rather than leaning on the `axios.defaults` header live-network installs: the two files concerned call axios directly, so that default only reaches them if some other module happened to import `live-network/network` first — which does not hold for a consumer embedding coin-evm on its own, and some Ledger backends allowlist on that header.

- [#20879](https://github.com/LedgerHQ/ledger-live/pull/20879) [`306a681`](https://github.com/LedgerHQ/ledger-live/commit/306a6813eaabfd67dc575bb7bdfc2b52892037df) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(cronos): update explorer URL to Ledger proxy and add dedicated "cronos" explorer type that skips txlistinternal (proxy enforces a 10 000-block range limit with no reliable workaround)

### Patch Changes

- Updated dependencies [[`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0)]:
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0

## 5.0.0

### Major Changes

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20715](https://github.com/LedgerHQ/ledger-live/pull/20715) [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix EVM transactions being signed with a zero gas limit, and widen the EIP-1559 max fee headroom.

  When gas estimation failed, its `BigNumber(0)` fallback travelled back to the sign step, where it was read as a deliberate custom gas limit. That disabled re-estimation and produced a transaction the node rejected with `intrinsic gas too low`. A non-positive gas limit is no longer honoured as a custom value, so the estimation runs again, and crafting now fails rather than sending a zero gas limit to the device (LIVE-32644).

  `EIP1559_BASE_FEE_MULTIPLIER` goes from 1.27 to 1.6, so an estimated transaction stays includable for 4 blocks instead of 2 (the base fee grows by at most 12.5% per block). Max fees displayed on chains using the Ledger gas tracker will be higher, but the amount actually paid is unchanged: EIP-1559 charges the base fee plus the priority fee, and the max fee is only a ceiling (LIVE-32650).

- [#20750](https://github.com/LedgerHQ/ledger-live/pull/20750) [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): move `getDefaultFeeUnit` and `getMessageProperties` to llc

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

- [#20754](https://github.com/LedgerHQ/ledger-live/pull/20754) [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix an ERC-20 operation staying stuck on "Sending..." after a speed up or a cancel, which also kept
  its amount locked out of the token spendable balance. A replaced transaction can only be retired by
  its nonce, and token operations were not carrying one.

- [#20573](https://github.com/LedgerHQ/ledger-live/pull/20573) [`8153370`](https://github.com/LedgerHQ/ledger-live/commit/8153370ced31369208fe14ce8b24c6eb0d899ff4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): relocate transaction related types to LLC

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0

## 5.0.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1

## 5.0.0-next.0

### Major Changes

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20715](https://github.com/LedgerHQ/ledger-live/pull/20715) [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix EVM transactions being signed with a zero gas limit, and widen the EIP-1559 max fee headroom.

  When gas estimation failed, its `BigNumber(0)` fallback travelled back to the sign step, where it was read as a deliberate custom gas limit. That disabled re-estimation and produced a transaction the node rejected with `intrinsic gas too low`. A non-positive gas limit is no longer honoured as a custom value, so the estimation runs again, and crafting now fails rather than sending a zero gas limit to the device (LIVE-32644).

  `EIP1559_BASE_FEE_MULTIPLIER` goes from 1.27 to 1.6, so an estimated transaction stays includable for 4 blocks instead of 2 (the base fee grows by at most 12.5% per block). Max fees displayed on chains using the Ledger gas tracker will be higher, but the amount actually paid is unchanged: EIP-1559 charges the base fee plus the priority fee, and the max fee is only a ceiling (LIVE-32650).

- [#20750](https://github.com/LedgerHQ/ledger-live/pull/20750) [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): move `getDefaultFeeUnit` and `getMessageProperties` to llc

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

- [#20754](https://github.com/LedgerHQ/ledger-live/pull/20754) [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix an ERC-20 operation staying stuck on "Sending..." after a speed up or a cancel, which also kept
  its amount locked out of the token spendable balance. A replaced transaction can only be retired by
  its nonce, and token operations were not carrying one.

- [#20573](https://github.com/LedgerHQ/ledger-live/pull/20573) [`8153370`](https://github.com/LedgerHQ/ledger-live/commit/8153370ced31369208fe14ce8b24c6eb0d899ff4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): relocate transaction related types to LLC

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0

## 4.10.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20625](https://github.com/LedgerHQ/ledger-live/pull/20625) [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Make the EIP-7623 calldata floor remotely configurable through the new `calldataFloorGasPerToken` and `calldataFloorZeroByteTokens` coin config fields. Both default to the current EIP-7623 values, so behaviour is unchanged unless they are set; EIP-7976 can then be activated per chain without a release.

- [#20627](https://github.com/LedgerHQ/ledger-live/pull/20627) [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain the higher network fees when sending to an address that does not exist yet. EIP-8037 charges account creation substantially more gas, and nothing in the send flow told the user why the fee jumped. The gas we send is unchanged: `eth_estimateGas` remains the only source.

- [#20620](https://github.com/LedgerHQ/ledger-live/pull/20620) [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Skip logs emitted by SYSTEM_ADDRESS when parsing ERC20 transfers from receipts. EIP-7708 (Glamsterdam) makes every native transfer emit a log identical to an ERC20 `Transfer`, which would otherwise be reported as a transfer of a non-existent token.

- [#20356](https://github.com/LedgerHQ/ledger-live/pull/20356) [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91) Thanks [@qperrot](https://github.com/qperrot)! - Fix EVM send-max on L2s (Scroll, Blast, Base) failing at broadcast with `InsufficientFunds`

  The send-max amount is `balance - fees`, but the L2 → L1 data fee (`additionalFees`) was reserved with no headroom, unlike L2 execution gas which already carries ~2x headroom via `maxFeePerGas`. Because the L1 data fee tracks the volatile Ethereum L1 base fee, any upward drift between fee estimation and broadcast (device signing takes seconds) made the transaction overspend and the node rejected it.

  - Reserve a 2x headroom on the L1 data fee for send-max only (normal sends keep an exact fee display).
  - Query the OP-stack L1 gas oracle for Blast and Base on the Ledger node — they were falling through to a `0` L1 fee and being under-reserved.
  - Point the external RPC node at the canonical OP-stack `GasPriceOracle` predeploy (`0x420000000000000000000000000000000000000F`) so the L1-fee lookup succeeds on all OP-stack chains.

- [#20447](https://github.com/LedgerHQ/ledger-live/pull/20447) [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(coin-modules): provide validator id

- [#20431](https://github.com/LedgerHQ/ledger-live/pull/20431) [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): migrate EVM staking types from `@ledgerhq/types-live` to `@ledgerhq/coin-module-framework`; move staking helpers (mapDelegations, serialization) to ledger-live-common evm family

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/ledger-wallet-framework@2.8.0
  - @ledgerhq/evm-tools@1.13.2

## 4.10.0-next.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20625](https://github.com/LedgerHQ/ledger-live/pull/20625) [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Make the EIP-7623 calldata floor remotely configurable through the new `calldataFloorGasPerToken` and `calldataFloorZeroByteTokens` coin config fields. Both default to the current EIP-7623 values, so behaviour is unchanged unless they are set; EIP-7976 can then be activated per chain without a release.

- [#20627](https://github.com/LedgerHQ/ledger-live/pull/20627) [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain the higher network fees when sending to an address that does not exist yet. EIP-8037 charges account creation substantially more gas, and nothing in the send flow told the user why the fee jumped. The gas we send is unchanged: `eth_estimateGas` remains the only source.

- [#20620](https://github.com/LedgerHQ/ledger-live/pull/20620) [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Skip logs emitted by SYSTEM_ADDRESS when parsing ERC20 transfers from receipts. EIP-7708 (Glamsterdam) makes every native transfer emit a log identical to an ERC20 `Transfer`, which would otherwise be reported as a transfer of a non-existent token.

- [#20356](https://github.com/LedgerHQ/ledger-live/pull/20356) [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91) Thanks [@qperrot](https://github.com/qperrot)! - Fix EVM send-max on L2s (Scroll, Blast, Base) failing at broadcast with `InsufficientFunds`

  The send-max amount is `balance - fees`, but the L2 → L1 data fee (`additionalFees`) was reserved with no headroom, unlike L2 execution gas which already carries ~2x headroom via `maxFeePerGas`. Because the L1 data fee tracks the volatile Ethereum L1 base fee, any upward drift between fee estimation and broadcast (device signing takes seconds) made the transaction overspend and the node rejected it.

  - Reserve a 2x headroom on the L1 data fee for send-max only (normal sends keep an exact fee display).
  - Query the OP-stack L1 gas oracle for Blast and Base on the Ledger node — they were falling through to a `0` L1 fee and being under-reserved.
  - Point the external RPC node at the canonical OP-stack `GasPriceOracle` predeploy (`0x420000000000000000000000000000000000000F`) so the L1-fee lookup succeeds on all OP-stack chains.

- [#20447](https://github.com/LedgerHQ/ledger-live/pull/20447) [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(coin-modules): provide validator id

- [#20431](https://github.com/LedgerHQ/ledger-live/pull/20431) [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): migrate EVM staking types from `@ledgerhq/types-live` to `@ledgerhq/coin-module-framework`; move staking helpers (mapDelegations, serialization) to ledger-live-common evm family

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0
  - @ledgerhq/evm-tools@1.13.2

## 4.9.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

### Patch Changes

- Updated dependencies [[`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/ledger-wallet-framework@2.7.0
  - @ledgerhq/evm-tools@1.13.2

## 4.9.0-next.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

### Patch Changes

- Updated dependencies [[`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0
  - @ledgerhq/evm-tools@1.13.2

## 4.8.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

- [#19982](https://github.com/LedgerHQ/ledger-live/pull/19982) [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Display estimated pending rewards for 0G delegations; gate claim-rewards UI to chains that support it.

- [#20139](https://github.com/LedgerHQ/ledger-live/pull/20139) [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(evm): keep legacy custom fees on non-EIP-1559 chains like Ethereum Classic

- [#19879](https://github.com/LedgerHQ/ledger-live/pull/19879) [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949) Thanks [@adussarps](https://github.com/adussarps)! - Support the read-only smart-contract `call` (ADR-044) on EVM Ledger nodes, in addition to external RPC nodes. Ledger nodes serve it through the explorer `contract/read` endpoint (the same one already used for allowances and L1 fee oracles), so `call` no longer throws "call is not supported" on Ledger-node chains.

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/live-network@3.0.0
  - @ledgerhq/live-env@3.0.0
  - @ledgerhq/evm-tools@1.13.2

## 4.8.0-next.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

- [#19982](https://github.com/LedgerHQ/ledger-live/pull/19982) [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Display estimated pending rewards for 0G delegations; gate claim-rewards UI to chains that support it.

- [#20139](https://github.com/LedgerHQ/ledger-live/pull/20139) [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(evm): keep legacy custom fees on non-EIP-1559 chains like Ethereum Classic

- [#19879](https://github.com/LedgerHQ/ledger-live/pull/19879) [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949) Thanks [@adussarps](https://github.com/adussarps)! - Support the read-only smart-contract `call` (ADR-044) on EVM Ledger nodes, in addition to external RPC nodes. Ledger nodes serve it through the explorer `contract/read` endpoint (the same one already used for allowances and L1 fee oracles), so `call` no longer throws "call is not supported" on Ledger-node chains.

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @ledgerhq/live-env@3.0.0-next.0
  - @ledgerhq/evm-tools@1.13.2-next.0

## 4.7.0

### Minor Changes

- [#19914](https://github.com/LedgerHQ/ledger-live/pull/19914) [`a306abb`](https://github.com/LedgerHQ/ledger-live/commit/a306abbb605751b5b8741d8d7d69d2bf7f78a49b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): add `delegationMaxAmountReserve` on 0g / Monad / Somnia

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

- [#19738](https://github.com/LedgerHQ/ledger-live/pull/19738) [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): store delegation shares

- [#19717](https://github.com/LedgerHQ/ledger-live/pull/19717) [`105ef90`](https://github.com/LedgerHQ/ledger-live/commit/105ef905bdb80022997d86729ccddbc220841bae) Thanks [@qperrot](https://github.com/qperrot)! - Fix: staking gas-estimation retry for Somnia-style chains (calldata + value rebuilt together, prepared intent reused) + tests.

- [#19739](https://github.com/LedgerHQ/ledger-live/pull/19739) [`a4b09cf`](https://github.com/LedgerHQ/ledger-live/commit/a4b09cf063a0042a4ba31c350327e8d0ac9aa90c) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): add per-chain `canUndelegate`

- [#19876](https://github.com/LedgerHQ/ledger-live/pull/19876) [`669a6d4`](https://github.com/LedgerHQ/ledger-live/commit/669a6d42b2178451e27383c746e3f8fd3d34caef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Wire 0G undelegate: on-chain shares fetch (getDelegation/convertToShares) + withdrawal fee (withdrawalFeeInGwei) via prepareZeroGravityIntent.

- [#19884](https://github.com/LedgerHQ/ledger-live/pull/19884) [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d) Thanks [@qperrot](https://github.com/qperrot)! - Add data-driven delegation-visibility-delay notice on the EVM staking delegate amount step (Somnia: 5 minutes)

- [#19644](https://github.com/LedgerHQ/ledger-live/pull/19644) [`01a7113`](https://github.com/LedgerHQ/ledger-live/commit/01a71130ab7219637d23222de544e97e668bba47) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(somnia): implement validators fetching and adapter

- [#19918](https://github.com/LedgerHQ/ledger-live/pull/19918) [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - EVM staking: 0G unbonding table (skip completed entries), rewards column visibility per chain

- [#19910](https://github.com/LedgerHQ/ledger-live/pull/19910) [`b38b0b1`](https://github.com/LedgerHQ/ledger-live/commit/b38b0b13e8e5c01800bf1234c7ee0f454b04f5cc) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): add optional staking gas multiplier, and flatten `prepareUnsignedTxParams` for readability

- [#19801](https://github.com/LedgerHQ/ledger-live/pull/19801) [`132a4f9`](https://github.com/LedgerHQ/ledger-live/commit/132a4f90adc816f69dfbde1b28e120ad501004c5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Add a mandatory `resolveOperationAmount` to `StakingContractConfig`, following the same config-driven pattern as `resolveValidatorAddress`. Each chain owns its amount derivation; 0G calls `convertToTokens(shares)` on the validator contract so the undelegate drawer shows the real OG token amount instead of the raw vault-share value.

### Patch Changes

- Updated dependencies [[`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/live-network@2.7.0
  - @ledgerhq/ledger-wallet-framework@2.5.0
  - @ledgerhq/evm-tools@1.13.1

## 4.7.0-next.0

### Minor Changes

- [#19914](https://github.com/LedgerHQ/ledger-live/pull/19914) [`a306abb`](https://github.com/LedgerHQ/ledger-live/commit/a306abbb605751b5b8741d8d7d69d2bf7f78a49b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): add `delegationMaxAmountReserve` on 0g / Monad / Somnia

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

- [#19738](https://github.com/LedgerHQ/ledger-live/pull/19738) [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): store delegation shares

- [#19717](https://github.com/LedgerHQ/ledger-live/pull/19717) [`105ef90`](https://github.com/LedgerHQ/ledger-live/commit/105ef905bdb80022997d86729ccddbc220841bae) Thanks [@qperrot](https://github.com/qperrot)! - Fix: staking gas-estimation retry for Somnia-style chains (calldata + value rebuilt together, prepared intent reused) + tests.

- [#19739](https://github.com/LedgerHQ/ledger-live/pull/19739) [`a4b09cf`](https://github.com/LedgerHQ/ledger-live/commit/a4b09cf063a0042a4ba31c350327e8d0ac9aa90c) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): add per-chain `canUndelegate`

- [#19876](https://github.com/LedgerHQ/ledger-live/pull/19876) [`669a6d4`](https://github.com/LedgerHQ/ledger-live/commit/669a6d42b2178451e27383c746e3f8fd3d34caef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Wire 0G undelegate: on-chain shares fetch (getDelegation/convertToShares) + withdrawal fee (withdrawalFeeInGwei) via prepareZeroGravityIntent.

- [#19884](https://github.com/LedgerHQ/ledger-live/pull/19884) [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d) Thanks [@qperrot](https://github.com/qperrot)! - Add data-driven delegation-visibility-delay notice on the EVM staking delegate amount step (Somnia: 5 minutes)

- [#19644](https://github.com/LedgerHQ/ledger-live/pull/19644) [`01a7113`](https://github.com/LedgerHQ/ledger-live/commit/01a71130ab7219637d23222de544e97e668bba47) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(somnia): implement validators fetching and adapter

- [#19918](https://github.com/LedgerHQ/ledger-live/pull/19918) [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - EVM staking: 0G unbonding table (skip completed entries), rewards column visibility per chain

- [#19910](https://github.com/LedgerHQ/ledger-live/pull/19910) [`b38b0b1`](https://github.com/LedgerHQ/ledger-live/commit/b38b0b13e8e5c01800bf1234c7ee0f454b04f5cc) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): add optional staking gas multiplier, and flatten `prepareUnsignedTxParams` for readability

- [#19801](https://github.com/LedgerHQ/ledger-live/pull/19801) [`132a4f9`](https://github.com/LedgerHQ/ledger-live/commit/132a4f90adc816f69dfbde1b28e120ad501004c5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Add a mandatory `resolveOperationAmount` to `StakingContractConfig`, following the same config-driven pattern as `resolveValidatorAddress`. Each chain owns its amount derivation; 0G calls `convertToTokens(shares)` on the validator contract so the undelegate drawer shows the real OG token amount instead of the raw vault-share value.

### Patch Changes

- Updated dependencies [[`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/live-network@2.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0
  - @ledgerhq/evm-tools@1.13.1

## 4.6.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

- [#19453](https://github.com/LedgerHQ/ledger-live/pull/19453) [`e478b6e`](https://github.com/LedgerHQ/ledger-live/commit/e478b6ee02a1ef105f07b2ba0d1f04292855bc91) Thanks [@jprudent](https://github.com/jprudent)! - Add configurable getBlock internal-tx source list with runtime validation, split node trace RPC methods, and behaviour-preserving default fallback semantics

- [#19621](https://github.com/LedgerHQ/ledger-live/pull/19621) [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix EVM staking operation history showing the user's own address instead of the staking contract as recipient

- [#19273](https://github.com/LedgerHQ/ledger-live/pull/19273) [`fad98a1`](https://github.com/LedgerHQ/ledger-live/commit/fad98a1d33675605d646959a1b1a2b648b2f59f2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Adapters and network explorers now return `Operation<MemoNotSupported>` from `@ledgerhq/coin-module-framework` instead of `Operation` from `@ledgerhq/types-live`, removing the restricted dependency from `adapters/`, `network/`, and `logic/`.

- [#19694](https://github.com/LedgerHQ/ledger-live/pull/19694) [`2b4a016`](https://github.com/LedgerHQ/ledger-live/commit/2b4a016a8c2f2a635c50928bb2f78b63d96ff67f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): lowercase validator explorer URL

- [#19620](https://github.com/LedgerHQ/ledger-live/pull/19620) [`d3862bb`](https://github.com/LedgerHQ/ledger-live/commit/d3862bb82e8084b624f65ef6d22d3eb151e0f18f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(evm): register somnia contract

- [#19243](https://github.com/LedgerHQ/ledger-live/pull/19243) [`07c4724`](https://github.com/LedgerHQ/ledger-live/commit/07c47249db7aa923af0a29a6dc8fb0c0264a08c7) Thanks [@jprudent](https://github.com/jprudent)! - Add configurable getBlock internal-tx source list with compile-time-safe builder, split node trace RPC methods, and behaviour-preserving default fallback semantics

- [#19450](https://github.com/LedgerHQ/ledger-live/pull/19450) [`682c34b`](https://github.com/LedgerHQ/ledger-live/commit/682c34b48b800e4963a06e2731ff16d116af42f9) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Wire 0G (zero_gravity) delegate: add protocol encoder, stake fetcher (getDelegation + convertToTokens), and STAKING_CONFIG entry. Fix Blockscout adapter to derive methodId from input calldata when the API field is absent, so staking ops keep their DELEGATE type after confirmation.

- [#19401](https://github.com/LedgerHQ/ledger-live/pull/19401) [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906) Thanks [@YazhuEth](https://github.com/YazhuEth)! - coin-evm now reads `feesStrategy` and `sponsored` from the `customFees` fee-estimation parameters instead of the transaction intent. The generic-coin-framework bridge and the EVM swap job fold these fields into `customFees.parameters` accordingly, aligning with the coin-module framework where both are deprecated on `TransactionIntent`.

- [#19035](https://github.com/LedgerHQ/ledger-live/pull/19035) [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - generic coin-framework bridge: compute the send-max (`useAllAmount`) amount once in `prepareTransaction` and reuse it in `signOperation`, instead of recomputing it via `validateIntent` in `prepareTransaction`, `signOperation` and `estimateMaxSpendable`. The amount is `parameters.amount` when the coin exposes it (Tezos), the token sub-account balance for token sends, otherwise `spendableBalance - max(reserve, fees)` (coin-evm now exposes `reserve`/`amountScale` for delegate). Pending operations are subtracted so the amount stays consistent with `getTransactionStatus` (LIVE-22227, LIVE-22228, LIVE-22229).

- [#19465](https://github.com/LedgerHQ/ledger-live/pull/19465) [`50660af`](https://github.com/LedgerHQ/ledger-live/commit/50660af751c2306802f1fefb2499cbf353f79cc4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Replace `typeof d[0]` type-sniffing in `resolveStakingValidator` with a per-chain `resolveValidatorAddress` on `StakingContractConfig`. Fixes 0G operation drawer pointing to delegator address instead of validator.

- [#19283](https://github.com/LedgerHQ/ledger-live/pull/19283) [`a952f84`](https://github.com/LedgerHQ/ledger-live/commit/a952f84063e5f791b9c757827570d59d048c43bf) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): clear remaining crypto assets store mentions

- [#19680](https://github.com/LedgerHQ/ledger-live/pull/19680) [`ff9d1d2`](https://github.com/LedgerHQ/ledger-live/commit/ff9d1d29fbc3d6a4d75e3ca145e3a9df0dda50c5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): drop incoming root-trace duplicates in `listOperations`

- [#19409](https://github.com/LedgerHQ/ledger-live/pull/19409) [`ddc6499`](https://github.com/LedgerHQ/ledger-live/commit/ddc6499ebc483a853d82ca3c00d0927169c8e0ed) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Pass `to` into staking selector cache to support factory-per-validator chains

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/evm-tools@1.13.1
  - @ledgerhq/live-network@2.6.8

## 4.6.0-next.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

- [#19453](https://github.com/LedgerHQ/ledger-live/pull/19453) [`e478b6e`](https://github.com/LedgerHQ/ledger-live/commit/e478b6ee02a1ef105f07b2ba0d1f04292855bc91) Thanks [@jprudent](https://github.com/jprudent)! - Add configurable getBlock internal-tx source list with runtime validation, split node trace RPC methods, and behaviour-preserving default fallback semantics

- [#19621](https://github.com/LedgerHQ/ledger-live/pull/19621) [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix EVM staking operation history showing the user's own address instead of the staking contract as recipient

- [#19273](https://github.com/LedgerHQ/ledger-live/pull/19273) [`fad98a1`](https://github.com/LedgerHQ/ledger-live/commit/fad98a1d33675605d646959a1b1a2b648b2f59f2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Adapters and network explorers now return `Operation<MemoNotSupported>` from `@ledgerhq/coin-module-framework` instead of `Operation` from `@ledgerhq/types-live`, removing the restricted dependency from `adapters/`, `network/`, and `logic/`.

- [#19694](https://github.com/LedgerHQ/ledger-live/pull/19694) [`2b4a016`](https://github.com/LedgerHQ/ledger-live/commit/2b4a016a8c2f2a635c50928bb2f78b63d96ff67f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): lowercase validator explorer URL

- [#19620](https://github.com/LedgerHQ/ledger-live/pull/19620) [`d3862bb`](https://github.com/LedgerHQ/ledger-live/commit/d3862bb82e8084b624f65ef6d22d3eb151e0f18f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(evm): register somnia contract

- [#19243](https://github.com/LedgerHQ/ledger-live/pull/19243) [`07c4724`](https://github.com/LedgerHQ/ledger-live/commit/07c47249db7aa923af0a29a6dc8fb0c0264a08c7) Thanks [@jprudent](https://github.com/jprudent)! - Add configurable getBlock internal-tx source list with compile-time-safe builder, split node trace RPC methods, and behaviour-preserving default fallback semantics

- [#19450](https://github.com/LedgerHQ/ledger-live/pull/19450) [`682c34b`](https://github.com/LedgerHQ/ledger-live/commit/682c34b48b800e4963a06e2731ff16d116af42f9) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Wire 0G (zero_gravity) delegate: add protocol encoder, stake fetcher (getDelegation + convertToTokens), and STAKING_CONFIG entry. Fix Blockscout adapter to derive methodId from input calldata when the API field is absent, so staking ops keep their DELEGATE type after confirmation.

- [#19401](https://github.com/LedgerHQ/ledger-live/pull/19401) [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906) Thanks [@YazhuEth](https://github.com/YazhuEth)! - coin-evm now reads `feesStrategy` and `sponsored` from the `customFees` fee-estimation parameters instead of the transaction intent. The generic-coin-framework bridge and the EVM swap job fold these fields into `customFees.parameters` accordingly, aligning with the coin-module framework where both are deprecated on `TransactionIntent`.

- [#19035](https://github.com/LedgerHQ/ledger-live/pull/19035) [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - generic coin-framework bridge: compute the send-max (`useAllAmount`) amount once in `prepareTransaction` and reuse it in `signOperation`, instead of recomputing it via `validateIntent` in `prepareTransaction`, `signOperation` and `estimateMaxSpendable`. The amount is `parameters.amount` when the coin exposes it (Tezos), the token sub-account balance for token sends, otherwise `spendableBalance - max(reserve, fees)` (coin-evm now exposes `reserve`/`amountScale` for delegate). Pending operations are subtracted so the amount stays consistent with `getTransactionStatus` (LIVE-22227, LIVE-22228, LIVE-22229).

- [#19465](https://github.com/LedgerHQ/ledger-live/pull/19465) [`50660af`](https://github.com/LedgerHQ/ledger-live/commit/50660af751c2306802f1fefb2499cbf353f79cc4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Replace `typeof d[0]` type-sniffing in `resolveStakingValidator` with a per-chain `resolveValidatorAddress` on `StakingContractConfig`. Fixes 0G operation drawer pointing to delegator address instead of validator.

- [#19283](https://github.com/LedgerHQ/ledger-live/pull/19283) [`a952f84`](https://github.com/LedgerHQ/ledger-live/commit/a952f84063e5f791b9c757827570d59d048c43bf) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): clear remaining crypto assets store mentions

- [#19680](https://github.com/LedgerHQ/ledger-live/pull/19680) [`ff9d1d2`](https://github.com/LedgerHQ/ledger-live/commit/ff9d1d29fbc3d6a4d75e3ca145e3a9df0dda50c5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): drop incoming root-trace duplicates in `listOperations`

- [#19409](https://github.com/LedgerHQ/ledger-live/pull/19409) [`ddc6499`](https://github.com/LedgerHQ/ledger-live/commit/ddc6499ebc483a853d82ca3c00d0927169c8e0ed) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Pass `to` into staking selector cache to support factory-per-validator chains

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0-next.0
  - @ledgerhq/live-env@2.42.0-next.0
  - @ledgerhq/evm-tools@1.13.1-next.0
  - @ledgerhq/live-network@2.6.8-next.0

## 4.5.0

### Minor Changes

- [#19278](https://github.com/LedgerHQ/ledger-live/pull/19278) [`a7734c2`](https://github.com/LedgerHQ/ledger-live/commit/a7734c23a635ddde880176ee04ff409a67eae613) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Refactor `StakingContractConfig.contractAddress` and `value` to resolver functions to support dynamic per-validator contract addressing

- [#19140](https://github.com/LedgerHQ/ledger-live/pull/19140) [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the Celo-only sync helpers (getSyncHash / createSwapHistoryMap / mergeSubAccounts) out of coin-evm into coin-celo, their sole consumer

- [#19113](https://github.com/LedgerHQ/ledger-live/pull/19113) [`f9caf32`](https://github.com/LedgerHQ/ledger-live/commit/f9caf322be2e3b652e8ec06fb40aeb8e02e08c8a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: createApi returns a pure CoinModuleApi; move refreshOperations/validateTransaction/stakingSupported to the ledger-live-common EVM bridge api

- [#19071](https://github.com/LedgerHQ/ledger-live/pull/19071) [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the EVM signer (types + getAddress/signMessage) out to live-signer-evm and ledger-live-common

- [#19184](https://github.com/LedgerHQ/ledger-live/pull/19184) [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Promote the EVM edit-transaction (speed-up / cancel) helpers to the bridge contract.

  `AccountBridgeExtensions` is now generic over the transaction type and exposes the app-facing edit-transaction methods (`getEditTransactionPatch`, `getEditTransactionStatus`, `getFormattedFeeFields`, `hasMinimumFundsToCancel`, `hasMinimumFundsToSpeedUp`, `isStrategyDisabled`, `isTransactionConfirmed`). The implementations move out of `@ledgerhq/coin-evm` into `ledger-live-common` (`families/evm`), and every app/LLC call site now reaches them through `getAccountBridge(account)` instead of importing `@ledgerhq/coin-evm/editTransaction/*`. The contract uses only base types so other families (e.g. Bitcoin RBF) can implement the same surface later.

- [#19272](https://github.com/LedgerHQ/ledger-live/pull/19272) [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): raise an error if gas price is less than the network minimum

- [#19297](https://github.com/LedgerHQ/ledger-live/pull/19297) [`973118a`](https://github.com/LedgerHQ/ledger-live/commit/973118a511dbdf862387c94272a89739a011e797) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): register 0g staking contract ABI

- [#19092](https://github.com/LedgerHQ/ledger-live/pull/19092) [`fa25271`](https://github.com/LedgerHQ/ledger-live/commit/fa252719220ca27fa4556ce9a02b84ccfca835c3) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move deviceTransactionConfig, bot specs and speculos device actions to ledger-live-common families/evm

- [#19196](https://github.com/LedgerHQ/ledger-live/pull/19196) [`edacd7c`](https://github.com/LedgerHQ/ledger-live/commit/edacd7c60413812e13a20d6451d5870ff5ced34e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Relocate EVM operation helpers (`isEditableOperation`, `isStuckOperation`, `getStuckAccountAndOperation`) from `@ledgerhq/coin-evm/operation` to `families/evm/editTransaction/` in `ledger-live-common`

- [#18928](https://github.com/LedgerHQ/ledger-live/pull/18928) [`b2e12ce`](https://github.com/LedgerHQ/ledger-live/commit/b2e12ce7b72de43efe8c8ff5290d617fff7f8e31) Thanks [@qperrot](https://github.com/qperrot)! - fix(sei): determine Sei EVM account association via on-chain RPC

  `isSeiAccountUnassociated` now resolves whether a Sei EVM (0x) address is linked
  on-chain to its Cosmos (sei1) address by querying the chain's address precompile
  (`getSeiAddr`) instead of inferring it from the local operation history. The
  function is now async and no longer takes an `operations` argument; the delegation
  flow screens (desktop & mobile) resolve the warning asynchronously.

- [#19321](https://github.com/LedgerHQ/ledger-live/pull/19321) [`b9f3ba5`](https://github.com/LedgerHQ/ledger-live/commit/b9f3ba5707e25d4ef50a7f7ffd4471678aa836ef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): add validator list 0g

- [#19078](https://github.com/LedgerHQ/ledger-live/pull/19078) [`363ac4d`](https://github.com/LedgerHQ/ledger-live/commit/363ac4d27f4e71b1e6e00b1c128bc199d1170839) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move transaction serialization helpers and CLI tools to ledger-live-common families/evm

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540)]:
  - @ledgerhq/cryptoassets@13.54.0
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/ledger-wallet-framework@2.3.0
  - @ledgerhq/evm-tools@1.13.0
  - @ledgerhq/live-promise@0.3.0
  - @ledgerhq/live-network@2.6.7

## 4.5.0-next.0

### Minor Changes

- [#19278](https://github.com/LedgerHQ/ledger-live/pull/19278) [`a7734c2`](https://github.com/LedgerHQ/ledger-live/commit/a7734c23a635ddde880176ee04ff409a67eae613) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Refactor `StakingContractConfig.contractAddress` and `value` to resolver functions to support dynamic per-validator contract addressing

- [#19140](https://github.com/LedgerHQ/ledger-live/pull/19140) [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the Celo-only sync helpers (getSyncHash / createSwapHistoryMap / mergeSubAccounts) out of coin-evm into coin-celo, their sole consumer

- [#19113](https://github.com/LedgerHQ/ledger-live/pull/19113) [`f9caf32`](https://github.com/LedgerHQ/ledger-live/commit/f9caf322be2e3b652e8ec06fb40aeb8e02e08c8a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: createApi returns a pure CoinModuleApi; move refreshOperations/validateTransaction/stakingSupported to the ledger-live-common EVM bridge api

- [#19071](https://github.com/LedgerHQ/ledger-live/pull/19071) [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the EVM signer (types + getAddress/signMessage) out to live-signer-evm and ledger-live-common

- [#19184](https://github.com/LedgerHQ/ledger-live/pull/19184) [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Promote the EVM edit-transaction (speed-up / cancel) helpers to the bridge contract.

  `AccountBridgeExtensions` is now generic over the transaction type and exposes the app-facing edit-transaction methods (`getEditTransactionPatch`, `getEditTransactionStatus`, `getFormattedFeeFields`, `hasMinimumFundsToCancel`, `hasMinimumFundsToSpeedUp`, `isStrategyDisabled`, `isTransactionConfirmed`). The implementations move out of `@ledgerhq/coin-evm` into `ledger-live-common` (`families/evm`), and every app/LLC call site now reaches them through `getAccountBridge(account)` instead of importing `@ledgerhq/coin-evm/editTransaction/*`. The contract uses only base types so other families (e.g. Bitcoin RBF) can implement the same surface later.

- [#19272](https://github.com/LedgerHQ/ledger-live/pull/19272) [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): raise an error if gas price is less than the network minimum

- [#19297](https://github.com/LedgerHQ/ledger-live/pull/19297) [`973118a`](https://github.com/LedgerHQ/ledger-live/commit/973118a511dbdf862387c94272a89739a011e797) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): register 0g staking contract ABI

- [#19092](https://github.com/LedgerHQ/ledger-live/pull/19092) [`fa25271`](https://github.com/LedgerHQ/ledger-live/commit/fa252719220ca27fa4556ce9a02b84ccfca835c3) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move deviceTransactionConfig, bot specs and speculos device actions to ledger-live-common families/evm

- [#19196](https://github.com/LedgerHQ/ledger-live/pull/19196) [`edacd7c`](https://github.com/LedgerHQ/ledger-live/commit/edacd7c60413812e13a20d6451d5870ff5ced34e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Relocate EVM operation helpers (`isEditableOperation`, `isStuckOperation`, `getStuckAccountAndOperation`) from `@ledgerhq/coin-evm/operation` to `families/evm/editTransaction/` in `ledger-live-common`

- [#18928](https://github.com/LedgerHQ/ledger-live/pull/18928) [`b2e12ce`](https://github.com/LedgerHQ/ledger-live/commit/b2e12ce7b72de43efe8c8ff5290d617fff7f8e31) Thanks [@qperrot](https://github.com/qperrot)! - fix(sei): determine Sei EVM account association via on-chain RPC

  `isSeiAccountUnassociated` now resolves whether a Sei EVM (0x) address is linked
  on-chain to its Cosmos (sei1) address by querying the chain's address precompile
  (`getSeiAddr`) instead of inferring it from the local operation history. The
  function is now async and no longer takes an `operations` argument; the delegation
  flow screens (desktop & mobile) resolve the warning asynchronously.

- [#19321](https://github.com/LedgerHQ/ledger-live/pull/19321) [`b9f3ba5`](https://github.com/LedgerHQ/ledger-live/commit/b9f3ba5707e25d4ef50a7f7ffd4471678aa836ef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): add validator list 0g

- [#19078](https://github.com/LedgerHQ/ledger-live/pull/19078) [`363ac4d`](https://github.com/LedgerHQ/ledger-live/commit/363ac4d27f4e71b1e6e00b1c128bc199d1170839) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move transaction serialization helpers and CLI tools to ledger-live-common families/evm

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540)]:
  - @ledgerhq/cryptoassets@13.54.0-next.0
  - @ledgerhq/live-env@2.41.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.3.0-next.0
  - @ledgerhq/evm-tools@1.13.0-next.0
  - @ledgerhq/live-promise@0.3.0-next.0
  - @ledgerhq/live-network@2.6.7-next.0

## 4.4.0

### Minor Changes

- [#18478](https://github.com/LedgerHQ/ledger-live/pull/18478) [`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc) Thanks [@henri-ly](https://github.com/henri-ly)! - Add withdraw flow for Monad EVM staking

- [#18572](https://github.com/LedgerHQ/ledger-live/pull/18572) [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

- [#18520](https://github.com/LedgerHQ/ledger-live/pull/18520) [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.

### Patch Changes

- Updated dependencies [[`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`ebda9d8`](https://github.com/LedgerHQ/ledger-live/commit/ebda9d88805501f4c2c03fef0fe24f116a8a2a6c), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872)]:
  - @ledgerhq/errors@6.37.0
  - @ledgerhq/live-env@2.40.0
  - @ledgerhq/cryptoassets@13.53.0
  - @ledgerhq/devices@8.16.0
  - @ledgerhq/ledger-wallet-framework@2.2.1
  - @ledgerhq/domain-service@1.8.8
  - @ledgerhq/evm-tools@1.12.11
  - @ledgerhq/live-network@2.6.6

## 4.4.0-next.0

### Minor Changes

- [#18478](https://github.com/LedgerHQ/ledger-live/pull/18478) [`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc) Thanks [@henri-ly](https://github.com/henri-ly)! - Add withdraw flow for Monad EVM staking

- [#18572](https://github.com/LedgerHQ/ledger-live/pull/18572) [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

- [#18520](https://github.com/LedgerHQ/ledger-live/pull/18520) [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.

### Patch Changes

- Updated dependencies [[`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`ebda9d8`](https://github.com/LedgerHQ/ledger-live/commit/ebda9d88805501f4c2c03fef0fe24f116a8a2a6c), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872)]:
  - @ledgerhq/errors@6.37.0-next.0
  - @ledgerhq/live-env@2.40.0-next.0
  - @ledgerhq/cryptoassets@13.53.0-next.0
  - @ledgerhq/devices@8.16.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.2.1-next.0
  - @ledgerhq/domain-service@1.8.8-next.0
  - @ledgerhq/evm-tools@1.12.11-next.0
  - @ledgerhq/live-network@2.6.6-next.0

## 4.3.0

### Minor Changes

- [#18222](https://github.com/LedgerHQ/ledger-live/pull/18222) [`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7) Thanks [@henri-ly](https://github.com/henri-ly)! - add undelegate for monad

- [#18292](https://github.com/LedgerHQ/ledger-live/pull/18292) [`05d8db8`](https://github.com/LedgerHQ/ledger-live/commit/05d8db8489e8338b50a7faa2b7a6db64b80aa516) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(llc): support compound reward operation

- [#18365](https://github.com/LedgerHQ/ledger-live/pull/18365) [`16b9bbc`](https://github.com/LedgerHQ/ledger-live/commit/16b9bbcf1df6546a8894acf22b58fb6e35576ed4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): display reward amount

- [#18490](https://github.com/LedgerHQ/ledger-live/pull/18490) [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d) Thanks [@ysitbon](https://github.com/ysitbon)! - Replace the embedded `TokenCurrency.parentCurrency: CryptoCurrency` object with a `parentCurrencyId: string` foreign key.

  `TokenCurrency` no longer carries the full parent `CryptoCurrency` object. Resolve the parent on demand with `getCryptoCurrencyById(token.parentCurrencyId)` (or `findCryptoCurrencyById` when a missing parent must be tolerated). The CAL token converter and persistence layer now read/write `parentCurrencyId` directly, aligning the legacy type with the `@domain/entity-currency-token` schema.

- [#18329](https://github.com/LedgerHQ/ledger-live/pull/18329) [`21c7211`](https://github.com/LedgerHQ/ledger-live/commit/21c72111bd99680eca39f97b908d9df0de41e041) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Support Monad compound (restake rewards): add the per-chain `compoundReward` staking operation to coin-evm (native `compound(uint64)` precompile call, nonpayable) and a Claim/Compound toggle in the EVM claim-rewards flow on desktop and mobile. The toggle is only shown for compound-capable chains (Monad) and defaults to Claim; the history operation type is `REWARD`, matching the existing claim flow.

- [#18642](https://github.com/LedgerHQ/ledger-live/pull/18642) [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`b9a2a9e`](https://github.com/LedgerHQ/ledger-live/commit/b9a2a9e5b85f9fb5556ef2de83bd0418e5326e89), [`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7), [`031097a`](https://github.com/LedgerHQ/ledger-live/commit/031097ac469c39e4ab475b92d9f6960ebb9a1ad3), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0
  - @ledgerhq/cryptoassets@13.52.0
  - @ledgerhq/ledger-wallet-framework@2.2.0
  - @ledgerhq/evm-tools@1.12.10
  - @ledgerhq/live-network@2.6.5
  - @ledgerhq/domain-service@1.8.7

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
