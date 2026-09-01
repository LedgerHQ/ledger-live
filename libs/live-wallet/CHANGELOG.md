# @ledgerhq/live-wallet

## 1.1.1-next.0

### Patch Changes

- Updated dependencies [[`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682)]:
  - @domain/entity-currency-crypto@0.11.0-next.0
  - @shared/cloud-sync-module@0.4.0-next.0
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @domain/entity-contact@0.8.1-next.0
  - @domain/entity-account-name@0.2.2-next.0
  - @domain/entity-recent-addresses@0.2.1-next.0

## 1.1.0

### Minor Changes

- [#21063](https://github.com/LedgerHQ/ledger-live/pull/21063) [`c566744`](https://github.com/LedgerHQ/ledger-live/commit/c566744a1a52db2843b3edeeb57c22043e704655) Thanks [@deepyjr](https://github.com/deepyjr)! - Persist Contacts locally and synchronize them through Ledger Sync.

- [#20555](https://github.com/LedgerHQ/ledger-live/pull/20555) [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Isolate wallet sync module failures instead of failing the whole sync: the aggregator validates each module slice on its own and quarantines a broken one, preserving its raw distant value, while every other module keeps syncing. A quarantine is reported as the module key plus the failure kind only, never the offending data.

  A distant document is now typed as what it is — a `DistantDocument` (`Record<string, unknown>`) whose slices are trusted per module — instead of the aggregate of the module schemas that nothing validates. `parseDistantState` is removed: it cast an unvalidated document to a validated type, and the aggregator already narrows the document at runtime. `CloudSyncSDK` drops its `schema` constructor option, which was never applied to anything and only served to infer that same misleading type; the class is now parameterised by its document type directly.

  `recentAddresses` drops its corrupted-address repair path. `CorruptedNestedAddressDistantSchema` and the lenient `z.array(z.unknown())` wrapper that swallowed every bad entry are removed together: a corrupted distant entry now quarantines the module, so the slice is preserved verbatim and reported, instead of being silently rewritten — or, had only the transform been removed, silently dropped. The local-cache repair in `schema.ts`/`store.ts` is untouched; it migrates data on disk, which quarantine does not cover.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @domain/entity-contact@0.8.0
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @shared/cloud-sync-module@0.3.0
  - @domain/entity-recent-addresses@0.2.0
  - @domain/entity-account-name@0.2.1

## 1.1.0-next.0

### Minor Changes

- [#21063](https://github.com/LedgerHQ/ledger-live/pull/21063) [`c566744`](https://github.com/LedgerHQ/ledger-live/commit/c566744a1a52db2843b3edeeb57c22043e704655) Thanks [@deepyjr](https://github.com/deepyjr)! - Persist Contacts locally and synchronize them through Ledger Sync.

- [#20555](https://github.com/LedgerHQ/ledger-live/pull/20555) [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Isolate wallet sync module failures instead of failing the whole sync: the aggregator validates each module slice on its own and quarantines a broken one, preserving its raw distant value, while every other module keeps syncing. A quarantine is reported as the module key plus the failure kind only, never the offending data.

  A distant document is now typed as what it is — a `DistantDocument` (`Record<string, unknown>`) whose slices are trusted per module — instead of the aggregate of the module schemas that nothing validates. `parseDistantState` is removed: it cast an unvalidated document to a validated type, and the aggregator already narrows the document at runtime. `CloudSyncSDK` drops its `schema` constructor option, which was never applied to anything and only served to infer that same misleading type; the class is now parameterised by its document type directly.

  `recentAddresses` drops its corrupted-address repair path. `CorruptedNestedAddressDistantSchema` and the lenient `z.array(z.unknown())` wrapper that swallowed every bad entry are removed together: a corrupted distant entry now quarantines the module, so the slice is preserved verbatim and reported, instead of being silently rewritten — or, had only the transform been removed, silently dropped. The local-cache repair in `schema.ts`/`store.ts` is untouched; it migrates data on disk, which quarantine does not cover.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @domain/entity-contact@0.8.0-next.0
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @shared/cloud-sync-module@0.3.0-next.0
  - @domain/entity-recent-addresses@0.2.0-next.0
  - @domain/entity-account-name@0.2.1-next.0

## 1.0.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0

## 1.0.1-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1

## 1.0.1-next.0

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0

## 1.0.0

### Major Changes

- [#20423](https://github.com/LedgerHQ/ledger-live/pull/20423) [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Complete the WalletSync DDD extraction: apps now compose the DDD slices directly

  `@ledgerhq/live-wallet` no longer owns sync infrastructure. `src/cloudsync/`, `src/walletsync/`,
  `src/accountName.ts` and `src/store.ts` are removed in favour of `@shared/cloud-sync`,
  `@shared/wallet-sync`, `@features/platform-wallet-sync`, `@domain/entity-account-name` and
  `@domain/entity-recent-addresses`. What remains is the account list sync module (`src/accounts/`)
  plus `src/walletSyncComposition.ts`, which assembles the sync modules into the wallet-sync schema.

  Desktop and mobile replace the monolithic `wallet` reducer with a `combineReducers` of the entity
  slices (`accountNames`, `starredAccountIds`, `walletSync`, `recentAddresses`, `nonImportedAccountInfos`)
  and wire the watch loop and trustchain lifecycle from `@features/platform-wallet-sync` at bootstrap.
  `@ledgerhq/live-common` drops its `@ledgerhq/live-wallet` runtime dependency: the wallet-api,
  platform and CSV-export helpers now take an `AccountNamesState` instead of the whole `WalletState`.

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

### Patch Changes

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @domain/entity-currency-crypto@0.10.0
  - @domain/entity-account-name@0.2.0
  - @shared/cloud-sync-module@0.2.0
  - @ledgerhq/types-live@6.119.0
  - @ledgerhq/ledger-wallet-framework@2.8.0
  - @domain/entity-recent-addresses@0.1.1

## 1.0.0-next.0

### Major Changes

- [#20423](https://github.com/LedgerHQ/ledger-live/pull/20423) [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Complete the WalletSync DDD extraction: apps now compose the DDD slices directly

  `@ledgerhq/live-wallet` no longer owns sync infrastructure. `src/cloudsync/`, `src/walletsync/`,
  `src/accountName.ts` and `src/store.ts` are removed in favour of `@shared/cloud-sync`,
  `@shared/wallet-sync`, `@features/platform-wallet-sync`, `@domain/entity-account-name` and
  `@domain/entity-recent-addresses`. What remains is the account list sync module (`src/accounts/`)
  plus `src/walletSyncComposition.ts`, which assembles the sync modules into the wallet-sync schema.

  Desktop and mobile replace the monolithic `wallet` reducer with a `combineReducers` of the entity
  slices (`accountNames`, `starredAccountIds`, `walletSync`, `recentAddresses`, `nonImportedAccountInfos`)
  and wire the watch loop and trustchain lifecycle from `@features/platform-wallet-sync` at bootstrap.
  `@ledgerhq/live-common` drops its `@ledgerhq/live-wallet` runtime dependency: the wallet-api,
  platform and CSV-export helpers now take an `AccountNamesState` instead of the whole `WalletState`.

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

### Patch Changes

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @domain/entity-currency-crypto@0.10.0-next.0
  - @domain/entity-account-name@0.2.0-next.0
  - @shared/cloud-sync-module@0.2.0-next.0
  - @ledgerhq/types-live@6.119.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0
  - @domain/entity-recent-addresses@0.1.1-next.0

## 0.30.2

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/types-live@6.118.0
  - @shared/env@0.2.0
  - @ledgerhq/ledger-key-ring-protocol@0.18.0
  - @domain/entity-currency-crypto@0.9.0
  - @ledgerhq/ledger-wallet-framework@2.7.0

## 0.30.2-next.0

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/types-live@6.118.0-next.0
  - @shared/env@0.2.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.18.0-next.0
  - @domain/entity-currency-crypto@0.9.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0

## 0.30.1

### Patch Changes

- Updated dependencies [[`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/live-network@3.0.0
  - @domain/entity-currency-crypto@0.8.0
  - @domain/entity-currency-token@0.3.0
  - @ledgerhq/types-live@6.117.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.2
  - @shared/env@0.1.1

## 0.30.1-next.0

### Patch Changes

- Updated dependencies [[`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @domain/entity-currency-crypto@0.8.0-next.0
  - @domain/entity-currency-token@0.3.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.2-next.0
  - @shared/env@0.1.1-next.0

## 0.30.0

### Minor Changes

- [#19800](https://github.com/LedgerHQ/ledger-live/pull/19800) [`0ee3ad8`](https://github.com/LedgerHQ/ledger-live/commit/0ee3ad8ef853baa7b17bb4ca07f41f1bed12268e) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint cryptoasset/fiat currency lookups off @ledgerhq/cryptoassets onto @domain/entity-currency-crypto and @domain/entity-currency-fiat

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0
  - @domain/entity-currency-crypto@0.7.0
  - @ledgerhq/live-network@2.7.0
  - @ledgerhq/ledger-wallet-framework@2.5.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.1

## 0.30.0-next.0

### Minor Changes

- [#19800](https://github.com/LedgerHQ/ledger-live/pull/19800) [`0ee3ad8`](https://github.com/LedgerHQ/ledger-live/commit/0ee3ad8ef853baa7b17bb4ca07f41f1bed12268e) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint cryptoasset/fiat currency lookups off @ledgerhq/cryptoassets onto @domain/entity-currency-crypto and @domain/entity-currency-fiat

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0-next.0
  - @domain/entity-currency-crypto@0.7.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.1-next.0

## 0.29.0

### Minor Changes

- [#19553](https://github.com/LedgerHQ/ledger-live/pull/19553) [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo UI changes for mobile

- [#19228](https://github.com/LedgerHQ/ledger-live/pull/19228) [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Fix Tezos `account.getPublicKey` (Wallet API): resolve the account public key from `xpub` instead of `seedIdentifier`, which is derived from a different path (`44'/1729'/0'`) and returned the same wrong address for every Tezos account. When `xpub` does not contain a valid base58 Tezos public key (edpk/sppk/p2pk), the request is rejected with a dedicated `AccountPublicKeyUnavailable` error and Ledger Live surfaces it natively (error modal on desktop, bottom modal on mobile), prompting the user to re-add the account instead of failing silently. The per-family resolver map is retained for chains that need bespoke retrieval. Also stop seeding `xpub` with the address on Tezos QR import.

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`2ee5ac1`](https://github.com/LedgerHQ/ledger-live/commit/2ee5ac15540a462143b61f2d546063ed9c8cfe40), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`d9dc6e6`](https://github.com/LedgerHQ/ledger-live/commit/d9dc6e621df877b13148688adec0b038983574e0), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/cryptoassets@13.55.0
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/types-live@6.115.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.0
  - @ledgerhq/live-network@2.6.8

## 0.29.0-next.0

### Minor Changes

- [#19553](https://github.com/LedgerHQ/ledger-live/pull/19553) [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo UI changes for mobile

- [#19228](https://github.com/LedgerHQ/ledger-live/pull/19228) [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Fix Tezos `account.getPublicKey` (Wallet API): resolve the account public key from `xpub` instead of `seedIdentifier`, which is derived from a different path (`44'/1729'/0'`) and returned the same wrong address for every Tezos account. When `xpub` does not contain a valid base58 Tezos public key (edpk/sppk/p2pk), the request is rejected with a dedicated `AccountPublicKeyUnavailable` error and Ledger Live surfaces it natively (error modal on desktop, bottom modal on mobile), prompting the user to re-add the account instead of failing silently. The per-family resolver map is retained for chains that need bespoke retrieval. Also stop seeding `xpub` with the address on Tezos QR import.

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`2ee5ac1`](https://github.com/LedgerHQ/ledger-live/commit/2ee5ac15540a462143b61f2d546063ed9c8cfe40), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`d9dc6e6`](https://github.com/LedgerHQ/ledger-live/commit/d9dc6e621df877b13148688adec0b038983574e0), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0-next.0
  - @ledgerhq/cryptoassets@13.55.0-next.0
  - @ledgerhq/live-env@2.42.0-next.0
  - @ledgerhq/types-live@6.115.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.0-next.0
  - @ledgerhq/live-network@2.6.8-next.0

## 0.28.0

### Minor Changes

- [#19020](https://github.com/LedgerHQ/ledger-live/pull/19020) [`9c42adf`](https://github.com/LedgerHQ/ledger-live/commit/9c42adf9e20ac7c9b4418652a40b5552afe6106d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Wallet Sync: log the non-imported accounts (id + attempts) so account discrepancies can be diagnosed from exported logs

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`c22afcb`](https://github.com/LedgerHQ/ledger-live/commit/c22afcba4dda045b2be9294abc67c5a96e5f4016), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @ledgerhq/cryptoassets@13.54.0
  - @ledgerhq/types-live@6.114.0
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/ledger-wallet-framework@2.3.0
  - @ledgerhq/types-cryptoassets@7.39.0
  - @ledgerhq/ledger-key-ring-protocol@0.16.0
  - @ledgerhq/live-promise@0.3.0
  - @ledgerhq/live-network@2.6.7

## 0.28.0-next.0

### Minor Changes

- [#19020](https://github.com/LedgerHQ/ledger-live/pull/19020) [`9c42adf`](https://github.com/LedgerHQ/ledger-live/commit/9c42adf9e20ac7c9b4418652a40b5552afe6106d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Wallet Sync: log the non-imported accounts (id + attempts) so account discrepancies can be diagnosed from exported logs

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`c22afcb`](https://github.com/LedgerHQ/ledger-live/commit/c22afcba4dda045b2be9294abc67c5a96e5f4016), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @ledgerhq/cryptoassets@13.54.0-next.0
  - @ledgerhq/types-live@6.114.0-next.0
  - @ledgerhq/live-env@2.41.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.3.0-next.0
  - @ledgerhq/types-cryptoassets@7.39.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.16.0-next.0
  - @ledgerhq/live-promise@0.3.0-next.0
  - @ledgerhq/live-network@2.6.7-next.0

## 0.27.4

### Patch Changes

- Updated dependencies [[`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @ledgerhq/types-live@6.113.0
  - @ledgerhq/live-env@2.40.0
  - @ledgerhq/cryptoassets@13.53.0
  - @ledgerhq/ledger-wallet-framework@2.2.1
  - @ledgerhq/ledger-key-ring-protocol@0.15.2
  - @ledgerhq/live-network@2.6.6

## 0.27.4-next.0

### Patch Changes

- Updated dependencies [[`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @ledgerhq/types-live@6.113.0-next.0
  - @ledgerhq/live-env@2.40.0-next.0
  - @ledgerhq/cryptoassets@13.53.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.2.1-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.15.2-next.0
  - @ledgerhq/live-network@2.6.6-next.0

## 0.27.3

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7), [`b9a2a9e`](https://github.com/LedgerHQ/ledger-live/commit/b9a2a9e5b85f9fb5556ef2de83bd0418e5326e89), [`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7), [`da1c0c8`](https://github.com/LedgerHQ/ledger-live/commit/da1c0c87b3d2540eff9e51c665df8192b4486855), [`031097a`](https://github.com/LedgerHQ/ledger-live/commit/031097ac469c39e4ab475b92d9f6960ebb9a1ad3), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9), [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166), [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0
  - @ledgerhq/types-live@6.112.0
  - @ledgerhq/cryptoassets@13.52.0
  - @ledgerhq/types-cryptoassets@7.38.0
  - @ledgerhq/ledger-wallet-framework@2.2.0
  - @ledgerhq/ledger-key-ring-protocol@0.15.1
  - @ledgerhq/live-network@2.6.5

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
