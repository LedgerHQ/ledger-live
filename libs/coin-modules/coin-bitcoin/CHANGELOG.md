# @ledgerhq/coin-bitcoin

## 0.52.0

### Minor Changes

- [#21420](https://github.com/LedgerHQ/ledger-live/pull/21420) [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix an undecodable/corrupted xpub crashing the whole Bitcoin address-scan block. `getPubkeyAt` now throws a typed `InvalidXpub` error; `checkAddressesBlock` uses `Promise.allSettled` so a bad xpub no longer aborts the block scan.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`6656f90`](https://github.com/LedgerHQ/ledger-live/commit/6656f90769c3419e1f121c0c2368eab4566e48ba)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-env@4.0.0
  - @ledgerhq/wallet-btc@0.4.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.52.0-next.0

### Minor Changes

- [#21420](https://github.com/LedgerHQ/ledger-live/pull/21420) [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix an undecodable/corrupted xpub crashing the whole Bitcoin address-scan block. `getPubkeyAt` now throws a typed `InvalidXpub` error; `checkAddressesBlock` uses `Promise.allSettled` so a bad xpub no longer aborts the block scan.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`6656f90`](https://github.com/LedgerHQ/ledger-live/commit/6656f90769c3419e1f121c0c2368eab4566e48ba)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0
  - @ledgerhq/wallet-btc@0.4.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.51.3

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-env@3.2.0
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.51.3-next.0

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.51.2

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.51.2-next.0

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.51.1

### Patch Changes

- Updated dependencies [[`8a93a70`](https://github.com/LedgerHQ/ledger-live/commit/8a93a701d631bd18b6c5125f77588802c0325b4c), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.51.1-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1
  - @ledgerhq/live-signer-zcash@0.10.0-next.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.51.1-next.0

### Patch Changes

- Updated dependencies [[`8a93a70`](https://github.com/LedgerHQ/ledger-live/commit/8a93a701d631bd18b6c5125f77588802c0325b4c), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/live-signer-zcash@0.10.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.51.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20477](https://github.com/LedgerHQ/ledger-live/pull/20477) [`8559d54`](https://github.com/LedgerHQ/ledger-live/commit/8559d54293b7854ea2dc900625bdb746720a4a85) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Remove the legacy Zcash shielded/PCZT chain-adapter (LIVE-35524).

  Its shielded path is superseded by the standalone `@ledgerhq/coin-zcash` module, which now carries all Zcash traffic when the `zcashShielded` feature flag is on; the toggle inside `coin-bitcoin` has been hardcoded off for a while, so the PCZT build/sign/broadcast, the shielded balance/status/sync and the native Halo2/IPC engine were dead code exercised only by this package's own tests. Removed along with the now-unreachable Zcash-specific branches in `getTransactionStatus`/`updateTransaction`/`errors` and the `@ledgerhq/zcash-utils` dependency.

  The transparent PSBT path used when the flag is off is unchanged: `createSigner`, `getAddress`, `getWalletXpub`, `getFullViewingKey` and the ZIP-317 fee pricer still back it exactly as before.

- [#20615](https://github.com/LedgerHQ/ledger-live/pull/20615) [`4d27e41`](https://github.com/LedgerHQ/ledger-live/commit/4d27e41c217cfae16526357a1a78db15c6980950) Thanks [@semeano](https://github.com/semeano)! - Fix Zcash shielded state (the unified full viewing key) being dropped on every restart.

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`ec0be9c`](https://github.com/LedgerHQ/ledger-live/commit/ec0be9c545259dd0dc2d2578dfabef3211f72e76), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0
  - @ledgerhq/ledger-wallet-framework@2.8.0
  - @ledgerhq/live-signer-zcash@0.9.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.51.0-next.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20477](https://github.com/LedgerHQ/ledger-live/pull/20477) [`8559d54`](https://github.com/LedgerHQ/ledger-live/commit/8559d54293b7854ea2dc900625bdb746720a4a85) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Remove the legacy Zcash shielded/PCZT chain-adapter (LIVE-35524).

  Its shielded path is superseded by the standalone `@ledgerhq/coin-zcash` module, which now carries all Zcash traffic when the `zcashShielded` feature flag is on; the toggle inside `coin-bitcoin` has been hardcoded off for a while, so the PCZT build/sign/broadcast, the shielded balance/status/sync and the native Halo2/IPC engine were dead code exercised only by this package's own tests. Removed along with the now-unreachable Zcash-specific branches in `getTransactionStatus`/`updateTransaction`/`errors` and the `@ledgerhq/zcash-utils` dependency.

  The transparent PSBT path used when the flag is off is unchanged: `createSigner`, `getAddress`, `getWalletXpub`, `getFullViewingKey` and the ZIP-317 fee pricer still back it exactly as before.

- [#20615](https://github.com/LedgerHQ/ledger-live/pull/20615) [`4d27e41`](https://github.com/LedgerHQ/ledger-live/commit/4d27e41c217cfae16526357a1a78db15c6980950) Thanks [@semeano](https://github.com/semeano)! - Fix Zcash shielded state (the unified full viewing key) being dropped on every restart.

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`ec0be9c`](https://github.com/LedgerHQ/ledger-live/commit/ec0be9c545259dd0dc2d2578dfabef3211f72e76), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0
  - @ledgerhq/live-signer-zcash@0.9.0-next.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.50.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20221](https://github.com/LedgerHQ/ledger-live/pull/20221) [`facb60a`](https://github.com/LedgerHQ/ledger-live/commit/facb60a8abbc42b5067fb4d69d68577c6da2f232) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash transparent sends being rejected from the mempool for "unpaid actions is higher than the limit" (LIVE-35152).

  ZIP-317 charges per logical action — `max(inputs, outputs)`, floored at two actions, so 10 000 zats minimum — while the shared Bitcoin path prices transactions in sat/vByte. The account-wide rate was derived from the marginal fee spread over one input (5000 zats over ~148 vBytes ⇒ 34 sat/vB), which billed only 7684 zats on a one-input, two-output send: below the floor, and rejected by the node.

  A single rate cannot express ZIP-317, since the floor stays flat while the byte count grows — a rate covering a one-input send would charge nearly double the fee owed on a two-input one. The rate is now chosen per transaction: `getAccountNetworkInfo` provides the rate that covers ZIP-317 for any layout (~53 sat/vB, set by the smallest transaction), and the Zcash chain adapter tightens it to the transaction's actual layout through the new `ChainAdapter.resolveFeePerByte` hook, falling back to the safe rate whenever the tighter one cannot be confirmed. Resulting fees land within ~2% above the ZIP-317 amount instead of under it.

  Only the legacy transparent path is affected — the flows routed to the PCZT builder already compute their ZIP-317 fee directly.

### Patch Changes

- Updated dependencies [[`7b4b965`](https://github.com/LedgerHQ/ledger-live/commit/7b4b965ce521cc6289ebeba50cca1a317f3417cd), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/live-signer-zcash@0.8.0
  - @ledgerhq/types-live@6.118.0
  - @ledgerhq/ledger-wallet-framework@2.7.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.50.0-next.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20221](https://github.com/LedgerHQ/ledger-live/pull/20221) [`facb60a`](https://github.com/LedgerHQ/ledger-live/commit/facb60a8abbc42b5067fb4d69d68577c6da2f232) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash transparent sends being rejected from the mempool for "unpaid actions is higher than the limit" (LIVE-35152).

  ZIP-317 charges per logical action — `max(inputs, outputs)`, floored at two actions, so 10 000 zats minimum — while the shared Bitcoin path prices transactions in sat/vByte. The account-wide rate was derived from the marginal fee spread over one input (5000 zats over ~148 vBytes ⇒ 34 sat/vB), which billed only 7684 zats on a one-input, two-output send: below the floor, and rejected by the node.

  A single rate cannot express ZIP-317, since the floor stays flat while the byte count grows — a rate covering a one-input send would charge nearly double the fee owed on a two-input one. The rate is now chosen per transaction: `getAccountNetworkInfo` provides the rate that covers ZIP-317 for any layout (~53 sat/vB, set by the smallest transaction), and the Zcash chain adapter tightens it to the transaction's actual layout through the new `ChainAdapter.resolveFeePerByte` hook, falling back to the safe rate whenever the tighter one cannot be confirmed. Resulting fees land within ~2% above the ZIP-317 amount instead of under it.

  Only the legacy transparent path is affected — the flows routed to the PCZT builder already compute their ZIP-317 fee directly.

### Patch Changes

- Updated dependencies [[`7b4b965`](https://github.com/LedgerHQ/ledger-live/commit/7b4b965ce521cc6289ebeba50cca1a317f3417cd), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/live-signer-zcash@0.8.0-next.0
  - @ledgerhq/types-live@6.118.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.49.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

- [#20349](https://github.com/LedgerHQ/ledger-live/pull/20349) [`f79de59`](https://github.com/LedgerHQ/ledger-live/commit/f79de59f95ed384fc2b2e49dfa28efb1a0493d4a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash transparent sends being rejected from the mempool for "unpaid actions is higher than the limit" (LIVE-35152).

  ZIP-317 charges per logical action — `max(inputs, outputs)`, floored at two actions, so 10 000 zats minimum — while the shared Bitcoin path prices transactions in sat/vByte. The account-wide rate was derived from the marginal fee spread over one input (5000 zats over ~148 vBytes ⇒ 34 sat/vB), which billed only 7684 zats on a one-input, two-output send: below the floor, and rejected by the node.

  A single rate cannot express ZIP-317, since the floor stays flat while the byte count grows — a rate covering a one-input send would charge nearly double the fee owed on a two-input one. The rate is now chosen per transaction: `getAccountNetworkInfo` provides the rate that covers ZIP-317 for any layout (~53 sat/vB, set by the smallest transaction), and the Zcash chain adapter tightens it to the transaction's actual layout through the new `ChainAdapter.resolveFeePerByte` hook, falling back to the safe rate whenever the tighter one cannot be confirmed. Resulting fees land within ~2% above the ZIP-317 amount instead of under it.

  Only the legacy transparent path is affected — the flows routed to the PCZT builder already compute their ZIP-317 fee directly.

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

- [#20114](https://github.com/LedgerHQ/ledger-live/pull/20114) [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa) Thanks [@semeano](https://github.com/semeano)! - Add Ironwood support to Zcash

- [#20021](https://github.com/LedgerHQ/ledger-live/pull/20021) [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report what a Zcash transaction actually did, rather than what an explorer can infer from its transparent bundle. An explorer that sees only the transparent side is wrong about two things whenever value crosses a shielded boundary:

  - **The fee**, derived as `Σ transparent inputs − Σ transparent outputs`, swallows any value that entered a shielded pool: a transparent-to-shielded send of 0.1 ZEC paying 0.00055 in fees was reported as having paid 0.10055.
  - **The destination**, since the payee lives in an encrypted output, fell back to the transparent change address — which pays the sender back rather than the payee.

  Both are now recovered from the raw transaction in a single fetch, through a `transactionDetails` method on the ZCash client (native and IPC) backed by `@ledgerhq/zcash-utils`: the fee from the value balance of every pool, the payee by trial-decrypting our own outputs with the account's viewing key.

  A new `resolveTransactionDetails` chain-adapter hook applies fees to transactions before operations are derived, so a transaction's sender and recipient agree on its cost, and supersedes the change address with the recovered payee while keeping any genuine transparent recipient. When an optimistic operation is reconciled with its confirmed counterpart, the address the user actually entered is preferred over the recovered one, which is the same destination but not necessarily the same string. A transaction that cannot be resolved keeps the fee and recipients the explorer reported.

- [#20021](https://github.com/LedgerHQ/ledger-live/pull/20021) [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix how a Zcash account holding shielded funds accounts for its own history. The account is described by two syncs that see different things — the transparent one reads an explorer, the shielded one scans compact blocks with the viewing key — and where they meet, five things were wrong:

  - **A shielded-to-transparent send looked like an internal transfer of 0 ZEC.** Classification only looked at the shielded pools, where such a send nets out; the value that left had gone to a transparent output nobody was reading. It is now classified on what left the pools _and_ what reached the transparent bundle, using the transparent totals the native scanner reports.
  - **An outgoing shielded operation reported an amount excluding the fee**, unlike every other outgoing operation and unlike the optimistic operation shown before confirmation — so the displayed amount changed once the transaction confirmed. The fee is now counted in the amount.
  - **Spendable balance dropped to the transparent balance** each time a transparent sync landed, then recovered on the next shielded sync. The chain now states its balance once and it serves as both balance and spendable balance.
  - **The shielded scan cursor could move backwards**, notably to zero when the scanner was already at the tip, triggering a full rescan on the next sync. The cursor now only ever advances.
  - **The optimistic operation was never reconciled**, since a confirmed shielded operation carries a different identifier than the pending one it replaces, leaving the send listed twice. Pending operations are now matched by transaction hash.

- [#20188](https://github.com/LedgerHQ/ledger-live/pull/20188) [`f8b5b51`](https://github.com/LedgerHQ/ledger-live/commit/f8b5b51856c57c68ca50d13b00d124d261c26504) Thanks [@semeano](https://github.com/semeano)! - Fix Zcash fee pricing calculations and max estimation.

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`f715aa5`](https://github.com/LedgerHQ/ledger-live/commit/f715aa516225f72124e083e3ffa0f254b9d5df4f), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa), [`0afef49`](https://github.com/LedgerHQ/ledger-live/commit/0afef49b60283afb44172de65891e435c2f0d637)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/live-network@3.0.0
  - @ledgerhq/live-signer-zcash@0.7.0
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/live-env@3.0.0
  - @ledgerhq/types-live@6.117.0

## 0.49.0-next.1

### Minor Changes

- [#20349](https://github.com/LedgerHQ/ledger-live/pull/20349) [`f79de59`](https://github.com/LedgerHQ/ledger-live/commit/f79de59f95ed384fc2b2e49dfa28efb1a0493d4a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash transparent sends being rejected from the mempool for "unpaid actions is higher than the limit" (LIVE-35152).

  ZIP-317 charges per logical action — `max(inputs, outputs)`, floored at two actions, so 10 000 zats minimum — while the shared Bitcoin path prices transactions in sat/vByte. The account-wide rate was derived from the marginal fee spread over one input (5000 zats over ~148 vBytes ⇒ 34 sat/vB), which billed only 7684 zats on a one-input, two-output send: below the floor, and rejected by the node.

  A single rate cannot express ZIP-317, since the floor stays flat while the byte count grows — a rate covering a one-input send would charge nearly double the fee owed on a two-input one. The rate is now chosen per transaction: `getAccountNetworkInfo` provides the rate that covers ZIP-317 for any layout (~53 sat/vB, set by the smallest transaction), and the Zcash chain adapter tightens it to the transaction's actual layout through the new `ChainAdapter.resolveFeePerByte` hook, falling back to the safe rate whenever the tighter one cannot be confirmed. Resulting fees land within ~2% above the ZIP-317 amount instead of under it.

  Only the legacy transparent path is affected — the flows routed to the PCZT builder already compute their ZIP-317 fee directly.

### Patch Changes

- Updated dependencies [[`f715aa5`](https://github.com/LedgerHQ/ledger-live/commit/f715aa516225f72124e083e3ffa0f254b9d5df4f)]:
  - @ledgerhq/live-signer-zcash@0.7.0-next.1

## 0.49.0-next.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

- [#20114](https://github.com/LedgerHQ/ledger-live/pull/20114) [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa) Thanks [@semeano](https://github.com/semeano)! - Add Ironwood support to Zcash

- [#20021](https://github.com/LedgerHQ/ledger-live/pull/20021) [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report what a Zcash transaction actually did, rather than what an explorer can infer from its transparent bundle. An explorer that sees only the transparent side is wrong about two things whenever value crosses a shielded boundary:

  - **The fee**, derived as `Σ transparent inputs − Σ transparent outputs`, swallows any value that entered a shielded pool: a transparent-to-shielded send of 0.1 ZEC paying 0.00055 in fees was reported as having paid 0.10055.
  - **The destination**, since the payee lives in an encrypted output, fell back to the transparent change address — which pays the sender back rather than the payee.

  Both are now recovered from the raw transaction in a single fetch, through a `transactionDetails` method on the ZCash client (native and IPC) backed by `@ledgerhq/zcash-utils`: the fee from the value balance of every pool, the payee by trial-decrypting our own outputs with the account's viewing key.

  A new `resolveTransactionDetails` chain-adapter hook applies fees to transactions before operations are derived, so a transaction's sender and recipient agree on its cost, and supersedes the change address with the recovered payee while keeping any genuine transparent recipient. When an optimistic operation is reconciled with its confirmed counterpart, the address the user actually entered is preferred over the recovered one, which is the same destination but not necessarily the same string. A transaction that cannot be resolved keeps the fee and recipients the explorer reported.

- [#20021](https://github.com/LedgerHQ/ledger-live/pull/20021) [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix how a Zcash account holding shielded funds accounts for its own history. The account is described by two syncs that see different things — the transparent one reads an explorer, the shielded one scans compact blocks with the viewing key — and where they meet, five things were wrong:

  - **A shielded-to-transparent send looked like an internal transfer of 0 ZEC.** Classification only looked at the shielded pools, where such a send nets out; the value that left had gone to a transparent output nobody was reading. It is now classified on what left the pools _and_ what reached the transparent bundle, using the transparent totals the native scanner reports.
  - **An outgoing shielded operation reported an amount excluding the fee**, unlike every other outgoing operation and unlike the optimistic operation shown before confirmation — so the displayed amount changed once the transaction confirmed. The fee is now counted in the amount.
  - **Spendable balance dropped to the transparent balance** each time a transparent sync landed, then recovered on the next shielded sync. The chain now states its balance once and it serves as both balance and spendable balance.
  - **The shielded scan cursor could move backwards**, notably to zero when the scanner was already at the tip, triggering a full rescan on the next sync. The cursor now only ever advances.
  - **The optimistic operation was never reconciled**, since a confirmed shielded operation carries a different identifier than the pending one it replaces, leaving the send listed twice. Pending operations are now matched by transaction hash.

- [#20188](https://github.com/LedgerHQ/ledger-live/pull/20188) [`f8b5b51`](https://github.com/LedgerHQ/ledger-live/commit/f8b5b51856c57c68ca50d13b00d124d261c26504) Thanks [@semeano](https://github.com/semeano)! - Fix Zcash fee pricing calculations and max estimation.

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa), [`0afef49`](https://github.com/LedgerHQ/ledger-live/commit/0afef49b60283afb44172de65891e435c2f0d637)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @ledgerhq/wallet-btc@0.3.0-next.0
  - @ledgerhq/live-env@3.0.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0
  - @ledgerhq/live-signer-zcash@0.7.0-next.0

## 0.48.0

### Minor Changes

- [#19736](https://github.com/LedgerHQ/ledger-live/pull/19736) [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Extract the shared UTXO engine (xpub scanning, coin-selection, storage, address crypto) into a standalone `@ledgerhq/wallet-btc` package, dependency-inverted so it no longer imports `@ledgerhq/cryptoassets` or `@ledgerhq/ledger-wallet-framework`: the currency is injected as a typed `WalletBtcCurrency`. Transaction build/sign, RBF fee computation, the device signer, and the `getWalletAccount` resolver stay in `@ledgerhq/coin-bitcoin`. Internal refactor with no behavior change; consumers (`@ledgerhq/live-common`, `ledger-live-desktop`) are rewired to the new import paths.

- [#19727](https://github.com/LedgerHQ/ledger-live/pull/19727) [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6) Thanks [@semeano](https://github.com/semeano)! - Fix wrong ZIP-244 txid

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0
  - @ledgerhq/wallet-btc@0.2.0
  - @ledgerhq/live-network@2.7.0
  - @ledgerhq/live-signer-zcash@0.6.0
  - @ledgerhq/ledger-wallet-framework@2.5.0

## 0.48.0-next.0

### Minor Changes

- [#19736](https://github.com/LedgerHQ/ledger-live/pull/19736) [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Extract the shared UTXO engine (xpub scanning, coin-selection, storage, address crypto) into a standalone `@ledgerhq/wallet-btc` package, dependency-inverted so it no longer imports `@ledgerhq/cryptoassets` or `@ledgerhq/ledger-wallet-framework`: the currency is injected as a typed `WalletBtcCurrency`. Transaction build/sign, RBF fee computation, the device signer, and the `getWalletAccount` resolver stay in `@ledgerhq/coin-bitcoin`. Internal refactor with no behavior change; consumers (`@ledgerhq/live-common`, `ledger-live-desktop`) are rewired to the new import paths.

- [#19727](https://github.com/LedgerHQ/ledger-live/pull/19727) [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6) Thanks [@semeano](https://github.com/semeano)! - Fix wrong ZIP-244 txid

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0-next.0
  - @ledgerhq/wallet-btc@0.2.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0
  - @ledgerhq/live-signer-zcash@0.6.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0

## 0.47.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

- [#19217](https://github.com/LedgerHQ/ledger-live/pull/19217) [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d) Thanks [@qperrot](https://github.com/qperrot)! - families/bitcoin/bridgeExtensions.ts now implements the full edit-transaction contract: getEditTransactionPatch, getEditTransactionStatus, getFormattedFeeFields, hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp, isStrategyDisabled, isTransactionConfirmed.
  The Bitcoin edit-transaction helpers (RBF replace/cancel, fee formatting, strategy validation) live under ledger-live-common/src/families/bitcoin/editTransaction/, with unit tests.
  Desktop & mobile Bitcoin edit flows (Body.tsx, StepFees, StepMethod, MethodSelection, EditTransactionSummary) reach these helpers through getAccountBridge(account) instead of importing them directly.

  hasMinimumFundsToCancel / hasMinimumFundsToSpeedUp now return Promise<boolean>. Bitcoin's minimum-funds checks are inherently async (RBF fee lookup) and all call sites already await them; EVM's implementations were updated accordingly.

  Bitcoin's isStrategyDisabled uses a slightly different shape than the generic contract, adapted via a thin wrapper (same pattern as EVM): it maps the contract's feeData to Bitcoin's feesStrategy, and its transaction param was widened to accept the real (nullable) feePerByte with a guard. isTransactionConfirmed follows the { account, hash } contract signature directly.

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`7094236`](https://github.com/LedgerHQ/ledger-live/commit/7094236545524bae7f501bbee1ee606ece868a14), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/types-live@6.115.0
  - @ledgerhq/live-signer-zcash@0.5.0
  - @ledgerhq/live-network@2.6.8

## 0.47.0-next.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

- [#19217](https://github.com/LedgerHQ/ledger-live/pull/19217) [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d) Thanks [@qperrot](https://github.com/qperrot)! - families/bitcoin/bridgeExtensions.ts now implements the full edit-transaction contract: getEditTransactionPatch, getEditTransactionStatus, getFormattedFeeFields, hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp, isStrategyDisabled, isTransactionConfirmed.
  The Bitcoin edit-transaction helpers (RBF replace/cancel, fee formatting, strategy validation) live under ledger-live-common/src/families/bitcoin/editTransaction/, with unit tests.
  Desktop & mobile Bitcoin edit flows (Body.tsx, StepFees, StepMethod, MethodSelection, EditTransactionSummary) reach these helpers through getAccountBridge(account) instead of importing them directly.

  hasMinimumFundsToCancel / hasMinimumFundsToSpeedUp now return Promise<boolean>. Bitcoin's minimum-funds checks are inherently async (RBF fee lookup) and all call sites already await them; EVM's implementations were updated accordingly.

  Bitcoin's isStrategyDisabled uses a slightly different shape than the generic contract, adapted via a thin wrapper (same pattern as EVM): it maps the contract's feeData to Bitcoin's feesStrategy, and its transaction param was widened to accept the real (nullable) feePerByte with a guard. isTransactionConfirmed follows the { account, hash } contract signature directly.

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`7094236`](https://github.com/LedgerHQ/ledger-live/commit/7094236545524bae7f501bbee1ee606ece868a14), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0-next.0
  - @ledgerhq/live-env@2.42.0-next.0
  - @ledgerhq/types-live@6.115.0-next.0
  - @ledgerhq/live-signer-zcash@0.5.0-next.0
  - @ledgerhq/live-network@2.6.8-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
