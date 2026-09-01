# @ledgerhq/coin-celo

## 3.1.0-next.0

### Minor Changes

- [#20117](https://github.com/LedgerHQ/ledger-live/pull/20117) [`6780db0`](https://github.com/LedgerHQ/ledger-live/commit/6780db014288dd297ed2d6b9e2133a5d91debc8a) Thanks [@shazzzam](https://github.com/shazzzam)! - Celo: show a clear "temporarily unavailable" message when voting is blocked during on-chain epoch processing, instead of a generic "RPC request failed" error

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`937c4f8`](https://github.com/LedgerHQ/ledger-live/commit/937c4f853cfc514a3fdc685bd6b264fd70ff7e13) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stub.

  This module composes the EVM api and overrides the parts Celo implements itself, so its shape follows coin-evm's. `createApi` now returns its object with `satisfies`, which keeps `stakingSupported` — a member outside the API surface — visible in the type, and drops the `register` stub in favour of the framework default.

  `craftRawTransaction` is the one capability neither this module nor the EVM api it composes provides, so it is simply absent. That matters here more than elsewhere: the composed api arrives through an `as unknown as` cast, which would have let a method that no longer exists keep claiming it does, and a caller would have met `undefined is not a function` rather than a "not supported" error. The cast now names the authoring type, and spells out `validateIntent` as required since every non-staking intent is delegated to it — so dropping it upstream breaks the build instead of the runtime.

  Consumers see no change: the resolver applies `withDefaults`, which supplies the absent capabilities.

  The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `combine` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

- [#21208](https://github.com/LedgerHQ/ledger-live/pull/21208) [`1b789dc`](https://github.com/LedgerHQ/ledger-live/commit/1b789dc76939a2791e34fefb512652bac71ae4df) Thanks [@amaslakov](https://github.com/amaslakov)! - Celo: add USAT (Tether America USD) to the fee currencies that can be selected to pay gas

### Patch Changes

- Updated dependencies [[`83b019e`](https://github.com/LedgerHQ/ledger-live/commit/83b019e128b59a289a28184e58c33b108cd3f188), [`41faac4`](https://github.com/LedgerHQ/ledger-live/commit/41faac432e8c17e3718d90cc26ce6ae650800681), [`2c70999`](https://github.com/LedgerHQ/ledger-live/commit/2c709990d3569bc50504822ce90c9e9024210312), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a), [`1cf5583`](https://github.com/LedgerHQ/ledger-live/commit/1cf55832f785fc57881169092f1190fa7ddfecf9)]:
  - @ledgerhq/coin-evm@5.2.0-next.0
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0
  - @ledgerhq/hw-app-eth@7.8.17-next.0

## 3.0.1

### Patch Changes

- Updated dependencies [[`26d8617`](https://github.com/LedgerHQ/ledger-live/commit/26d86172869e47608dd0f0e26dfbc905dafa3588), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`306a681`](https://github.com/LedgerHQ/ledger-live/commit/306a6813eaabfd67dc575bb7bdfc2b52892037df), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/coin-evm@5.1.0
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0
  - @ledgerhq/hw-app-eth@7.8.16

## 3.0.1-next.0

### Patch Changes

- Updated dependencies [[`26d8617`](https://github.com/LedgerHQ/ledger-live/commit/26d86172869e47608dd0f0e26dfbc905dafa3588), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`306a681`](https://github.com/LedgerHQ/ledger-live/commit/306a6813eaabfd67dc575bb7bdfc2b52892037df), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/coin-evm@5.1.0-next.0
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0
  - @ledgerhq/hw-app-eth@7.8.16-next.0

## 3.0.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f), [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`8153370`](https://github.com/LedgerHQ/ledger-live/commit/8153370ced31369208fe14ce8b24c6eb0d899ff4), [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/coin-evm@5.0.0
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0
  - @ledgerhq/hw-app-eth@7.8.15

## 3.0.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/coin-evm@5.0.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1
  - @ledgerhq/hw-app-eth@7.8.15-next.1

## 3.0.0-next.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f), [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`8153370`](https://github.com/LedgerHQ/ledger-live/commit/8153370ced31369208fe14ce8b24c6eb0d899ff4), [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/coin-evm@5.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0
  - @ledgerhq/hw-app-eth@7.8.15-next.0

## 2.13.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20447](https://github.com/LedgerHQ/ledger-live/pull/20447) [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(coin-modules): provide validator id

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0), [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/coin-evm@4.10.0
  - @ledgerhq/types-live@6.119.0
  - @ledgerhq/ledger-wallet-framework@2.8.0
  - @ledgerhq/hw-app-eth@7.8.14

## 2.13.0-next.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20447](https://github.com/LedgerHQ/ledger-live/pull/20447) [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(coin-modules): provide validator id

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0), [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/coin-evm@4.10.0-next.0
  - @ledgerhq/types-live@6.119.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0
  - @ledgerhq/hw-app-eth@7.8.14-next.0

## 2.12.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/coin-evm@4.9.0
  - @ledgerhq/types-live@6.118.0
  - @ledgerhq/ledger-wallet-framework@2.7.0
  - @ledgerhq/hw-app-eth@7.8.13

## 2.12.0-next.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/coin-evm@4.9.0-next.0
  - @ledgerhq/types-live@6.118.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0
  - @ledgerhq/hw-app-eth@7.8.13-next.0

## 2.11.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

- [#19879](https://github.com/LedgerHQ/ledger-live/pull/19879) [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949) Thanks [@adussarps](https://github.com/adussarps)! - Support the read-only smart-contract `call` (ADR-044) on EVM Ledger nodes, in addition to external RPC nodes. Ledger nodes serve it through the explorer `contract/read` endpoint (the same one already used for allowances and L1 fee oracles), so `call` no longer throws "call is not supported" on Ledger-node chains.

- [#19733](https://github.com/LedgerHQ/ledger-live/pull/19733) [`6e72b5a`](https://github.com/LedgerHQ/ledger-live/commit/6e72b5a2532eae19e6cc54405acab4c28f4f2f20) Thanks [@ishaba](https://github.com/ishaba)! - celo: fix add-account failing entirely with `UNKNOWN_ERROR (0x6a15)` on older Celo apps. Scanning now skips a derivation path the installed app does not authorize (celoEvm account index >= 1 on apps < 1.7.0, which return the OS "path not authorized" status word) instead of aborting the whole scan — so accounts on authorized paths are still added. Gated on both the `0x6a15` status word and the installed Celo app version (`< 1.7.0`, read via `getAppConfiguration`), so behavior is unchanged on up-to-date apps.

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/coin-evm@4.8.0
  - @ledgerhq/live-network@3.0.0
  - @ledgerhq/live-env@3.0.0
  - @ledgerhq/types-live@6.117.0
  - @ledgerhq/hw-app-eth@7.8.12

## 2.11.0-next.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

- [#19879](https://github.com/LedgerHQ/ledger-live/pull/19879) [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949) Thanks [@adussarps](https://github.com/adussarps)! - Support the read-only smart-contract `call` (ADR-044) on EVM Ledger nodes, in addition to external RPC nodes. Ledger nodes serve it through the explorer `contract/read` endpoint (the same one already used for allowances and L1 fee oracles), so `call` no longer throws "call is not supported" on Ledger-node chains.

- [#19733](https://github.com/LedgerHQ/ledger-live/pull/19733) [`6e72b5a`](https://github.com/LedgerHQ/ledger-live/commit/6e72b5a2532eae19e6cc54405acab4c28f4f2f20) Thanks [@ishaba](https://github.com/ishaba)! - celo: fix add-account failing entirely with `UNKNOWN_ERROR (0x6a15)` on older Celo apps. Scanning now skips a derivation path the installed app does not authorize (celoEvm account index >= 1 on apps < 1.7.0, which return the OS "path not authorized" status word) instead of aborting the whole scan — so accounts on authorized paths are still added. Gated on both the `0x6a15` status word and the installed Celo app version (`< 1.7.0`, read via `getAppConfiguration`), so behavior is unchanged on up-to-date apps.

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/coin-evm@4.8.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @ledgerhq/live-env@3.0.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0
  - @ledgerhq/hw-app-eth@7.8.12-next.0

## 2.10.0

### Minor Changes

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

- [#19731](https://github.com/LedgerHQ/ledger-live/pull/19731) [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7) Thanks [@ysitbon](https://github.com/ysitbon)! - Relocate the token-store accessor imports from `@ledgerhq/cryptoassets/state` onto the wallet-framework port (`@ledgerhq/ledger-wallet-framework/cryptoAssetsStore`). Apps and coin-modules now read `getCryptoAssetsStore` from the framework's injectable singleton; apps inject at bootstrap via `setCryptoAssetsStore` from the same port.

### Patch Changes

- Updated dependencies [[`a306abb`](https://github.com/LedgerHQ/ledger-live/commit/a306abbb605751b5b8741d8d7d69d2bf7f78a49b), [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`105ef90`](https://github.com/LedgerHQ/ledger-live/commit/105ef905bdb80022997d86729ccddbc220841bae), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`a4b09cf`](https://github.com/LedgerHQ/ledger-live/commit/a4b09cf063a0042a4ba31c350327e8d0ac9aa90c), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`669a6d4`](https://github.com/LedgerHQ/ledger-live/commit/669a6d42b2178451e27383c746e3f8fd3d34caef), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d), [`01a7113`](https://github.com/LedgerHQ/ledger-live/commit/01a71130ab7219637d23222de544e97e668bba47), [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39), [`b38b0b1`](https://github.com/LedgerHQ/ledger-live/commit/b38b0b13e8e5c01800bf1234c7ee0f454b04f5cc), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7), [`132a4f9`](https://github.com/LedgerHQ/ledger-live/commit/132a4f90adc816f69dfbde1b28e120ad501004c5)]:
  - @ledgerhq/coin-evm@4.7.0
  - @ledgerhq/types-live@6.116.0
  - @ledgerhq/live-network@2.7.0
  - @ledgerhq/ledger-wallet-framework@2.5.0
  - @ledgerhq/hw-app-eth@7.8.11

## 2.10.0-next.0

### Minor Changes

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

- [#19731](https://github.com/LedgerHQ/ledger-live/pull/19731) [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7) Thanks [@ysitbon](https://github.com/ysitbon)! - Relocate the token-store accessor imports from `@ledgerhq/cryptoassets/state` onto the wallet-framework port (`@ledgerhq/ledger-wallet-framework/cryptoAssetsStore`). Apps and coin-modules now read `getCryptoAssetsStore` from the framework's injectable singleton; apps inject at bootstrap via `setCryptoAssetsStore` from the same port.

### Patch Changes

- Updated dependencies [[`a306abb`](https://github.com/LedgerHQ/ledger-live/commit/a306abbb605751b5b8741d8d7d69d2bf7f78a49b), [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`105ef90`](https://github.com/LedgerHQ/ledger-live/commit/105ef905bdb80022997d86729ccddbc220841bae), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`a4b09cf`](https://github.com/LedgerHQ/ledger-live/commit/a4b09cf063a0042a4ba31c350327e8d0ac9aa90c), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`669a6d4`](https://github.com/LedgerHQ/ledger-live/commit/669a6d42b2178451e27383c746e3f8fd3d34caef), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d), [`01a7113`](https://github.com/LedgerHQ/ledger-live/commit/01a71130ab7219637d23222de544e97e668bba47), [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39), [`b38b0b1`](https://github.com/LedgerHQ/ledger-live/commit/b38b0b13e8e5c01800bf1234c7ee0f454b04f5cc), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7), [`132a4f9`](https://github.com/LedgerHQ/ledger-live/commit/132a4f90adc816f69dfbde1b28e120ad501004c5)]:
  - @ledgerhq/coin-evm@4.7.0-next.0
  - @ledgerhq/types-live@6.116.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0
  - @ledgerhq/hw-app-eth@7.8.11-next.0

## 2.9.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

### Patch Changes

- Updated dependencies [[`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f), [`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`e478b6e`](https://github.com/LedgerHQ/ledger-live/commit/e478b6ee02a1ef105f07b2ba0d1f04292855bc91), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e), [`fad98a1`](https://github.com/LedgerHQ/ledger-live/commit/fad98a1d33675605d646959a1b1a2b648b2f59f2), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`2b4a016`](https://github.com/LedgerHQ/ledger-live/commit/2b4a016a8c2f2a635c50928bb2f78b63d96ff67f), [`d3862bb`](https://github.com/LedgerHQ/ledger-live/commit/d3862bb82e8084b624f65ef6d22d3eb151e0f18f), [`07c4724`](https://github.com/LedgerHQ/ledger-live/commit/07c47249db7aa923af0a29a6dc8fb0c0264a08c7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`682c34b`](https://github.com/LedgerHQ/ledger-live/commit/682c34b48b800e4963a06e2731ff16d116af42f9), [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906), [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`50660af`](https://github.com/LedgerHQ/ledger-live/commit/50660af751c2306802f1fefb2499cbf353f79cc4), [`a952f84`](https://github.com/LedgerHQ/ledger-live/commit/a952f84063e5f791b9c757827570d59d048c43bf), [`ff9d1d2`](https://github.com/LedgerHQ/ledger-live/commit/ff9d1d29fbc3d6a4d75e3ca145e3a9df0dda50c5), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`ddc6499`](https://github.com/LedgerHQ/ledger-live/commit/ddc6499ebc483a853d82ca3c00d0927169c8e0ed), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/coin-evm@4.6.0
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/cryptoassets@13.55.0
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/types-live@6.115.0
  - @ledgerhq/live-network@2.6.8
  - @ledgerhq/hw-app-eth@7.8.10

## 2.9.0-next.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

### Patch Changes

- Updated dependencies [[`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f), [`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`e478b6e`](https://github.com/LedgerHQ/ledger-live/commit/e478b6ee02a1ef105f07b2ba0d1f04292855bc91), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e), [`fad98a1`](https://github.com/LedgerHQ/ledger-live/commit/fad98a1d33675605d646959a1b1a2b648b2f59f2), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`2b4a016`](https://github.com/LedgerHQ/ledger-live/commit/2b4a016a8c2f2a635c50928bb2f78b63d96ff67f), [`d3862bb`](https://github.com/LedgerHQ/ledger-live/commit/d3862bb82e8084b624f65ef6d22d3eb151e0f18f), [`07c4724`](https://github.com/LedgerHQ/ledger-live/commit/07c47249db7aa923af0a29a6dc8fb0c0264a08c7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`682c34b`](https://github.com/LedgerHQ/ledger-live/commit/682c34b48b800e4963a06e2731ff16d116af42f9), [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906), [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`50660af`](https://github.com/LedgerHQ/ledger-live/commit/50660af751c2306802f1fefb2499cbf353f79cc4), [`a952f84`](https://github.com/LedgerHQ/ledger-live/commit/a952f84063e5f791b9c757827570d59d048c43bf), [`ff9d1d2`](https://github.com/LedgerHQ/ledger-live/commit/ff9d1d29fbc3d6a4d75e3ca145e3a9df0dda50c5), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`ddc6499`](https://github.com/LedgerHQ/ledger-live/commit/ddc6499ebc483a853d82ca3c00d0927169c8e0ed), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/coin-evm@4.6.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.4.0-next.0
  - @ledgerhq/cryptoassets@13.55.0-next.0
  - @ledgerhq/live-env@2.42.0-next.0
  - @ledgerhq/types-live@6.115.0-next.0
  - @ledgerhq/live-network@2.6.8-next.0
  - @ledgerhq/hw-app-eth@7.8.10-next.0

## 2.8.0

### Minor Changes

- [#18917](https://github.com/LedgerHQ/ledger-live/pull/18917) [`3b9ad8e`](https://github.com/LedgerHQ/ledger-live/commit/3b9ad8e33408679af1a3737c6cb3a2473a044c07) Thanks [@YazhuEth](https://github.com/YazhuEth)! - celo: deprecate the "Ledger by Figment" validator. It is no longer shown or selectable in the vote flow and is never the default — the validator list is now ranked by TVL with none selected by default. Existing delegations remain fully manageable (unvote / unlock / withdraw).

- [#19024](https://github.com/LedgerHQ/ledger-live/pull/19024) [`cd26957`](https://github.com/LedgerHQ/ledger-live/commit/cd26957e4147e438dab908f0cc700115dd95b422) Thanks [@shazzzam](https://github.com/shazzzam)! - celo: fix revoke vote fee not being calculated. The revoke fee estimation now reuses buildTransaction so it uses the correct lesser/greater neighbors and revoke value, and falls back to a minimum gas estimate instead of returning a 0 fee on estimation failure (which left the Continue button disabled). Also matches the validator group case-insensitively in getVote.

  celo: fix revoke reverting with "Bad index" for accounts that voted for multiple validator groups. buildRevokeTx now resolves the group's real position in getGroupsVotedForByAccount (keyed by the vote signer) and passes it as the Election contract's on-chain index argument, instead of a hard-coded 0. Revoking a non-first group previously reverted at estimateGas/sign time.

- [#19140](https://github.com/LedgerHQ/ledger-live/pull/19140) [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the Celo-only sync helpers (getSyncHash / createSwapHistoryMap / mergeSubAccounts) out of coin-evm into coin-celo, their sole consumer

- [#18970](https://github.com/LedgerHQ/ledger-live/pull/18970) [`0c9b5fc`](https://github.com/LedgerHQ/ledger-live/commit/0c9b5fc79922a62a2ca124d1c251f177ac3a3969) Thanks [@YazhuEth](https://github.com/YazhuEth)! - celo: stop offering saturated validator groups in the vote flow, and refresh the validator list properly.

  - The capacity check now compares the group's vote cap (`getNumVotesReceivable`) against its current total votes instead of just checking the cap is positive, so groups that are already at or above their cap are filtered out and no longer revert with "vote cap exceeded" when voting.
  - `preload` now always refetches the validator groups (gated by `preloadMaxAge`) instead of skipping when a hydrated list already exists. Previously a once-cached list was pinned forever, so users never saw newly available or removed groups. Per-group capacity reads are batched into a single Multicall3 round-trip.

- [#19071](https://github.com/LedgerHQ/ledger-live/pull/19071) [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the EVM signer (types + getAddress/signMessage) out to live-signer-evm and ledger-live-common

- [#19194](https://github.com/LedgerHQ/ledger-live/pull/19194) [`1838412`](https://github.com/LedgerHQ/ledger-live/commit/18384123adca558b00323f169dffc0daf117b822) Thanks [@ishaba](https://github.com/ishaba)! - feat(celo): implement coin-module api

- [#19145](https://github.com/LedgerHQ/ledger-live/pull/19145) [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the per-coin `cli.ts` / `cli-transaction.ts` / `test/cli.ts` (`makeCliTools`) contract from coin families and the `cliTools` field of `FamilySetup`. The only consumer was the `apps/cli` `send` command, and the only e2e path that used it was the EVM ERC20 token approval. That flow is now a dedicated, self-contained `tokenApproval` CLI command; the generic `send` command keeps the cross-family options only.

- [#19033](https://github.com/LedgerHQ/ledger-live/pull/19033) [`237b721`](https://github.com/LedgerHQ/ledger-live/commit/237b7217d7447be97c88030eb86542bcfcff1e38) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(coin-celo): apply fix for the custom fees on celo

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a7734c2`](https://github.com/LedgerHQ/ledger-live/commit/a7734c23a635ddde880176ee04ff409a67eae613), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`f9caf32`](https://github.com/LedgerHQ/ledger-live/commit/f9caf322be2e3b652e8ec06fb40aeb8e02e08c8a), [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a), [`973118a`](https://github.com/LedgerHQ/ledger-live/commit/973118a511dbdf862387c94272a89739a011e797), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`fa25271`](https://github.com/LedgerHQ/ledger-live/commit/fa252719220ca27fa4556ce9a02b84ccfca835c3), [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67), [`edacd7c`](https://github.com/LedgerHQ/ledger-live/commit/edacd7c60413812e13a20d6451d5870ff5ced34e), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b2e12ce`](https://github.com/LedgerHQ/ledger-live/commit/b2e12ce7b72de43efe8c8ff5290d617fff7f8e31), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`b9f3ba5`](https://github.com/LedgerHQ/ledger-live/commit/b9f3ba5707e25d4ef50a7f7ffd4471678aa836ef), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a), [`363ac4d`](https://github.com/LedgerHQ/ledger-live/commit/363ac4d27f4e71b1e6e00b1c128bc199d1170839)]:
  - @ledgerhq/cryptoassets@13.54.0
  - @ledgerhq/coin-evm@4.5.0
  - @ledgerhq/types-live@6.114.0
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/ledger-wallet-framework@2.3.0
  - @ledgerhq/live-promise@0.3.0
  - @ledgerhq/devices@8.17.0
  - @ledgerhq/hw-app-eth@7.8.9
  - @ledgerhq/live-network@2.6.7

## 2.8.0-next.0

### Minor Changes

- [#18917](https://github.com/LedgerHQ/ledger-live/pull/18917) [`3b9ad8e`](https://github.com/LedgerHQ/ledger-live/commit/3b9ad8e33408679af1a3737c6cb3a2473a044c07) Thanks [@YazhuEth](https://github.com/YazhuEth)! - celo: deprecate the "Ledger by Figment" validator. It is no longer shown or selectable in the vote flow and is never the default — the validator list is now ranked by TVL with none selected by default. Existing delegations remain fully manageable (unvote / unlock / withdraw).

- [#19024](https://github.com/LedgerHQ/ledger-live/pull/19024) [`cd26957`](https://github.com/LedgerHQ/ledger-live/commit/cd26957e4147e438dab908f0cc700115dd95b422) Thanks [@shazzzam](https://github.com/shazzzam)! - celo: fix revoke vote fee not being calculated. The revoke fee estimation now reuses buildTransaction so it uses the correct lesser/greater neighbors and revoke value, and falls back to a minimum gas estimate instead of returning a 0 fee on estimation failure (which left the Continue button disabled). Also matches the validator group case-insensitively in getVote.

  celo: fix revoke reverting with "Bad index" for accounts that voted for multiple validator groups. buildRevokeTx now resolves the group's real position in getGroupsVotedForByAccount (keyed by the vote signer) and passes it as the Election contract's on-chain index argument, instead of a hard-coded 0. Revoking a non-first group previously reverted at estimateGas/sign time.

- [#19140](https://github.com/LedgerHQ/ledger-live/pull/19140) [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the Celo-only sync helpers (getSyncHash / createSwapHistoryMap / mergeSubAccounts) out of coin-evm into coin-celo, their sole consumer

- [#18970](https://github.com/LedgerHQ/ledger-live/pull/18970) [`0c9b5fc`](https://github.com/LedgerHQ/ledger-live/commit/0c9b5fc79922a62a2ca124d1c251f177ac3a3969) Thanks [@YazhuEth](https://github.com/YazhuEth)! - celo: stop offering saturated validator groups in the vote flow, and refresh the validator list properly.

  - The capacity check now compares the group's vote cap (`getNumVotesReceivable`) against its current total votes instead of just checking the cap is positive, so groups that are already at or above their cap are filtered out and no longer revert with "vote cap exceeded" when voting.
  - `preload` now always refetches the validator groups (gated by `preloadMaxAge`) instead of skipping when a hydrated list already exists. Previously a once-cached list was pinned forever, so users never saw newly available or removed groups. Per-group capacity reads are batched into a single Multicall3 round-trip.

- [#19071](https://github.com/LedgerHQ/ledger-live/pull/19071) [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the EVM signer (types + getAddress/signMessage) out to live-signer-evm and ledger-live-common

- [#19194](https://github.com/LedgerHQ/ledger-live/pull/19194) [`1838412`](https://github.com/LedgerHQ/ledger-live/commit/18384123adca558b00323f169dffc0daf117b822) Thanks [@ishaba](https://github.com/ishaba)! - feat(celo): implement coin-module api

- [#19145](https://github.com/LedgerHQ/ledger-live/pull/19145) [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the per-coin `cli.ts` / `cli-transaction.ts` / `test/cli.ts` (`makeCliTools`) contract from coin families and the `cliTools` field of `FamilySetup`. The only consumer was the `apps/cli` `send` command, and the only e2e path that used it was the EVM ERC20 token approval. That flow is now a dedicated, self-contained `tokenApproval` CLI command; the generic `send` command keeps the cross-family options only.

- [#19033](https://github.com/LedgerHQ/ledger-live/pull/19033) [`237b721`](https://github.com/LedgerHQ/ledger-live/commit/237b7217d7447be97c88030eb86542bcfcff1e38) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(coin-celo): apply fix for the custom fees on celo

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a7734c2`](https://github.com/LedgerHQ/ledger-live/commit/a7734c23a635ddde880176ee04ff409a67eae613), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`f9caf32`](https://github.com/LedgerHQ/ledger-live/commit/f9caf322be2e3b652e8ec06fb40aeb8e02e08c8a), [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a), [`973118a`](https://github.com/LedgerHQ/ledger-live/commit/973118a511dbdf862387c94272a89739a011e797), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`fa25271`](https://github.com/LedgerHQ/ledger-live/commit/fa252719220ca27fa4556ce9a02b84ccfca835c3), [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67), [`edacd7c`](https://github.com/LedgerHQ/ledger-live/commit/edacd7c60413812e13a20d6451d5870ff5ced34e), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b2e12ce`](https://github.com/LedgerHQ/ledger-live/commit/b2e12ce7b72de43efe8c8ff5290d617fff7f8e31), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`b9f3ba5`](https://github.com/LedgerHQ/ledger-live/commit/b9f3ba5707e25d4ef50a7f7ffd4471678aa836ef), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a), [`363ac4d`](https://github.com/LedgerHQ/ledger-live/commit/363ac4d27f4e71b1e6e00b1c128bc199d1170839)]:
  - @ledgerhq/cryptoassets@13.54.0-next.0
  - @ledgerhq/coin-evm@4.5.0-next.0
  - @ledgerhq/types-live@6.114.0-next.0
  - @ledgerhq/live-env@2.41.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.3.0-next.0
  - @ledgerhq/live-promise@0.3.0-next.0
  - @ledgerhq/devices@8.17.0-next.0
  - @ledgerhq/hw-app-eth@7.8.9-next.0
  - @ledgerhq/live-network@2.6.7-next.0

## 2.7.0

### Minor Changes

- [#18520](https://github.com/LedgerHQ/ledger-live/pull/18520) [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.

### Patch Changes

- Updated dependencies [[`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`ebda9d8`](https://github.com/LedgerHQ/ledger-live/commit/ebda9d88805501f4c2c03fef0fe24f116a8a2a6c), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @ledgerhq/types-live@6.113.0
  - @ledgerhq/coin-evm@4.4.0
  - @ledgerhq/errors@6.37.0
  - @ledgerhq/live-env@2.40.0
  - @ledgerhq/cryptoassets@13.53.0
  - @ledgerhq/devices@8.16.0
  - @ledgerhq/ledger-wallet-framework@2.2.1
  - @ledgerhq/hw-app-eth@7.8.8
  - @ledgerhq/live-network@2.6.6

## 2.7.0-next.0

### Minor Changes

- [#18520](https://github.com/LedgerHQ/ledger-live/pull/18520) [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.

### Patch Changes

- Updated dependencies [[`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`ebda9d8`](https://github.com/LedgerHQ/ledger-live/commit/ebda9d88805501f4c2c03fef0fe24f116a8a2a6c), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @ledgerhq/types-live@6.113.0-next.0
  - @ledgerhq/coin-evm@4.4.0-next.0
  - @ledgerhq/errors@6.37.0-next.0
  - @ledgerhq/live-env@2.40.0-next.0
  - @ledgerhq/cryptoassets@13.53.0-next.0
  - @ledgerhq/devices@8.16.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.2.1-next.0
  - @ledgerhq/hw-app-eth@7.8.8-next.0
  - @ledgerhq/live-network@2.6.6-next.0

## 2.6.0

### Minor Changes

- [#18315](https://github.com/LedgerHQ/ledger-live/pull/18315) [`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7) Thanks [@shazzzam](https://github.com/shazzzam)! - Display the correct fee currency for Celo CIP-64 transactions (fees paid in tokens such as USDT/USDC instead of native CELO). Adds a `feeCurrencyAddress` field to `CeloOperationExtra`, an `eth_getTransactionByHash`-based sync enrichment, and a `skip` option to `useTokenByAddressInCurrency` for conditional CAL lookups.

- [#18490](https://github.com/LedgerHQ/ledger-live/pull/18490) [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d) Thanks [@ysitbon](https://github.com/ysitbon)! - Replace the embedded `TokenCurrency.parentCurrency: CryptoCurrency` object with a `parentCurrencyId: string` foreign key.

  `TokenCurrency` no longer carries the full parent `CryptoCurrency` object. Resolve the parent on demand with `getCryptoCurrencyById(token.parentCurrencyId)` (or `findCryptoCurrencyById` when a missing parent must be tolerated). The CAL token converter and persistence layer now read/write `parentCurrencyId` directly, aligning the legacy type with the `@domain/entity-currency-token` schema.

- [#18312](https://github.com/LedgerHQ/ledger-live/pull/18312) [`621a175`](https://github.com/LedgerHQ/ledger-live/commit/621a1756ef8b59844a086a610ff45819521ff633) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Surface insufficient fee-token balance on Celo Send Desktop as an explicit error banner.

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7), [`b9a2a9e`](https://github.com/LedgerHQ/ledger-live/commit/b9a2a9e5b85f9fb5556ef2de83bd0418e5326e89), [`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7), [`da1c0c8`](https://github.com/LedgerHQ/ledger-live/commit/da1c0c87b3d2540eff9e51c665df8192b4486855), [`031097a`](https://github.com/LedgerHQ/ledger-live/commit/031097ac469c39e4ab475b92d9f6960ebb9a1ad3), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`05d8db8`](https://github.com/LedgerHQ/ledger-live/commit/05d8db8489e8338b50a7faa2b7a6db64b80aa516), [`16b9bbc`](https://github.com/LedgerHQ/ledger-live/commit/16b9bbcf1df6546a8894acf22b58fb6e35576ed4), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`21c7211`](https://github.com/LedgerHQ/ledger-live/commit/21c72111bd99680eca39f97b908d9df0de41e041), [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9), [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166), [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0
  - @ledgerhq/types-live@6.112.0
  - @ledgerhq/coin-evm@4.3.0
  - @ledgerhq/cryptoassets@13.52.0
  - @ledgerhq/ledger-wallet-framework@2.2.0
  - @ledgerhq/live-network@2.6.5
  - @ledgerhq/hw-app-eth@7.8.7

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
