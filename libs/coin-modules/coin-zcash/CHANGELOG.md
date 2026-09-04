# @ledgerhq/coin-zcash

## 0.6.0-next.0

### Minor Changes

- [#21045](https://github.com/LedgerHQ/ledger-live/pull/21045) [`4342943`](https://github.com/LedgerHQ/ledger-live/commit/43429435e5411592f61099f1d40712f055578b0c) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix missing memo in Zcash shielded operation details. After a shielded send with a memo, the memo is now persisted in the operation extra and displayed in Transaction details.

- [#21032](https://github.com/LedgerHQ/ledger-live/pull/21032) [`f9f6b71`](https://github.com/LedgerHQ/ledger-live/commit/f9f6b71d91c051b8e611a44f5b564cf5062cedb8) Thanks [@pawell24](https://github.com/pawell24)! - Default the Zcash shielded-balance birthday to Ironwood (NU6.3) mainnet activation
  instead of Orchard/NU5 activation, and reject a birthday dated in the future.

- [#21136](https://github.com/LedgerHQ/ledger-live/pull/21136) [`bf22729`](https://github.com/LedgerHQ/ledger-live/commit/bf22729942b9dc114644dd3dc32962c08012c1cc) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Fix flaky note-reservation boundary test by using fake timers

- [#21179](https://github.com/LedgerHQ/ledger-live/pull/21179) [`46ed356`](https://github.com/LedgerHQ/ledger-live/commit/46ed356e325028c4e8e461b72f7dce631c7362e3) Thanks [@pawell24](https://github.com/pawell24)! - Fix the Zcash shielded-balance "Stop sync" action, which previously did nothing when the
  running sync was started automatically by the standard wallet sync rather than by the
  manual start button, and could resume on its own shortly after a manual stop otherwise
  succeeded.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.5.0

### Minor Changes

- [#20995](https://github.com/LedgerHQ/ledger-live/pull/20995) [`8ebdb6a`](https://github.com/LedgerHQ/ledger-live/commit/8ebdb6aff25864883e189ebc3206a9901f5798a4) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Send transparent funds without the account's UFVK. Every Zcash send required one, so a public t→t send failed at the device step with "Missing UFVK — account not yet synced" on any account that had not run the viewing-key export flow — which is a device confirmation, and which the send flow deliberately does not ask for (only the private transfer option is gated on it). Transparent funds were therefore unspendable until the user activated their private balance.

  This needs `@ledgerhq/zcash-utils` 2.2.0, which the catalog now pins: earlier versions require the viewing key for every build, whatever the flow.

  The shielded pools stay out of reach in exchange: a unified address carrying an Orchard receiver is now refused as a recipient when the account has no UFVK, reported on the address field instead of accepted and failed at the device step. A malformed or Sapling address keeps its own error, so the user is not sent to the export flow over a typo.

  A transparent send carries no shielded bundle and reads no shielded key material: the only key it needs is the account-level transparent pubkey, which is the payload of the account xpub the account already holds. It is now read from there (`accountPubkeyFromXpub`, the counterpart of the existing `composeXpub`) and passed to the builder in place of the UFVK, whose absence no longer blocks the flow. An account that does have a UFVK keeps using it, so its code path is unchanged. Flows that spend or create shielded value still require the UFVK and now report it as a typed `ZcashShieldedKeyMissing` rather than a bare error.

- [#21034](https://github.com/LedgerHQ/ledger-live/pull/21034) [`17a4154`](https://github.com/LedgerHQ/ledger-live/commit/17a415450136066be114ede1f7e591fa4ec3ee5f) Thanks [@cted-ledger](https://github.com/cted-ledger)! - [ZEC] Reject a transparent-output amount below the network's dust threshold at the Amount step instead of signing and failing at broadcast.

- [#20949](https://github.com/LedgerHQ/ledger-live/pull/20949) [`a56baa8`](https://github.com/LedgerHQ/ledger-live/commit/a56baa8d0b71460066bc8173767920049aa50e37) Thanks [@pawell24](https://github.com/pawell24)! - Fold a Zcash account's shielded balance sync into the standard automatic wallet sync instead of requiring a manual trigger, and make that trigger unconditional and spam-proof. The account page's shielded balance now refreshes on launch and on the regular sync interval, the Amount step of a send refreshes it when moving on from the Recipient step, and a completed private transfer triggers a follow-up sync so the account page converges without a manual refresh. The manual "sync balance" action is now offered and enabled in every state, including once a scan has completed, and clicking it while a sync is already running no longer cancels and restarts it.

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.5.0-next.0

### Minor Changes

- [#20995](https://github.com/LedgerHQ/ledger-live/pull/20995) [`8ebdb6a`](https://github.com/LedgerHQ/ledger-live/commit/8ebdb6aff25864883e189ebc3206a9901f5798a4) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Send transparent funds without the account's UFVK. Every Zcash send required one, so a public t→t send failed at the device step with "Missing UFVK — account not yet synced" on any account that had not run the viewing-key export flow — which is a device confirmation, and which the send flow deliberately does not ask for (only the private transfer option is gated on it). Transparent funds were therefore unspendable until the user activated their private balance.

  This needs `@ledgerhq/zcash-utils` 2.2.0, which the catalog now pins: earlier versions require the viewing key for every build, whatever the flow.

  The shielded pools stay out of reach in exchange: a unified address carrying an Orchard receiver is now refused as a recipient when the account has no UFVK, reported on the address field instead of accepted and failed at the device step. A malformed or Sapling address keeps its own error, so the user is not sent to the export flow over a typo.

  A transparent send carries no shielded bundle and reads no shielded key material: the only key it needs is the account-level transparent pubkey, which is the payload of the account xpub the account already holds. It is now read from there (`accountPubkeyFromXpub`, the counterpart of the existing `composeXpub`) and passed to the builder in place of the UFVK, whose absence no longer blocks the flow. An account that does have a UFVK keeps using it, so its code path is unchanged. Flows that spend or create shielded value still require the UFVK and now report it as a typed `ZcashShieldedKeyMissing` rather than a bare error.

- [#21034](https://github.com/LedgerHQ/ledger-live/pull/21034) [`17a4154`](https://github.com/LedgerHQ/ledger-live/commit/17a415450136066be114ede1f7e591fa4ec3ee5f) Thanks [@cted-ledger](https://github.com/cted-ledger)! - [ZEC] Reject a transparent-output amount below the network's dust threshold at the Amount step instead of signing and failing at broadcast.

- [#20949](https://github.com/LedgerHQ/ledger-live/pull/20949) [`a56baa8`](https://github.com/LedgerHQ/ledger-live/commit/a56baa8d0b71460066bc8173767920049aa50e37) Thanks [@pawell24](https://github.com/pawell24)! - Fold a Zcash account's shielded balance sync into the standard automatic wallet sync instead of requiring a manual trigger, and make that trigger unconditional and spam-proof. The account page's shielded balance now refreshes on launch and on the regular sync interval, the Amount step of a send refreshes it when moving on from the Recipient step, and a completed private transfer triggers a follow-up sync so the account page converges without a manual refresh. The manual "sync balance" action is now offered and enabled in every state, including once a scan has completed, and clicking it while a sync is already running no longer cancels and restarts it.

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.4.0

### Minor Changes

- [#20815](https://github.com/LedgerHQ/ledger-live/pull/20815) [`54fcd49`](https://github.com/LedgerHQ/ledger-live/commit/54fcd49f48deaed0aec71941c8b9926e6b6aee2e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Exclude immature Ironwood notes from the spendable pool. A shielded note is only spendable once its transaction is buried deep enough to have a witness at the builder's anchor, so a freshly scanned change note is no longer selected while a second send is prepared within the same confirmation window. The rule is applied wherever the spendable pool is derived — note selection, max-spendable and amount validation — and the send flow now reports insufficient spendable funds instead of failing when the transaction is built. Funds held by maturing notes stay part of the account's total balance.

- [#20658](https://github.com/LedgerHQ/ledger-live/pull/20658) [`a79b9aa`](https://github.com/LedgerHQ/ledger-live/commit/a79b9aacb2f21c89bd192342bc6b98a4265d4345) Thanks [@semeano](https://github.com/semeano)! - Zcash: add self transfer option on send modal

- [#20798](https://github.com/LedgerHQ/ledger-live/pull/20798) [`1de6156`](https://github.com/LedgerHQ/ledger-live/commit/1de61569d59e56b73a8797397cbdd1a10b069b08) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Name the Ironwood shielded operations and stop listing Zcash self-transfers.

  The Ironwood operation types were declared and given icons but never labelled, so a received or sent Ironwood transaction rendered its raw key in the history. They now carry the same labels, address cells and "Private (Ironwood)" transaction-type detail as the Sapling and Orchard ones.

  A shielded transaction that moved no value across the wallet boundary — every note landing on the account's own internal address — was also emitted as a history row of its own: no counterparty, a value of 0, and, when it was the shielded leg of a transparent-funded sweep, a duplicate of the transparent operation already listing that transaction. Such a transaction now produces an operation typed `NONE`, which keeps it in the account data while leaving it out of the lists. Its classification is unchanged, so the fee and balance logic that reads it is unaffected.

- [#20707](https://github.com/LedgerHQ/ledger-live/pull/20707) [`4cc31ec`](https://github.com/LedgerHQ/ledger-live/commit/4cc31ec90cae0a36663b35da3a569222e8e8efdf) Thanks [@semeano](https://github.com/semeano)! - Carry the Ironwood bundle through to the device signer.

- [#20756](https://github.com/LedgerHQ/ledger-live/pull/20756) [`02ddf7e`](https://github.com/LedgerHQ/ledger-live/commit/02ddf7e9d7542d6f0fcdb18d7f9461c37a8b8ce1) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Forward Ironwood spend-auth signatures to PCZT finalization (LIVE-35956).

  `signOperation` now passes the device's Ironwood `spendAuthSig` values to `combine`, so a V6 PCZT (any shielded or shielding send) finalizes through the same `finalizeTransaction` entry point as a V5 one — `@ledgerhq/zcash-utils` (bumped to 2.1.1) injects both pools' signatures and extracts the signed transaction. `ironwoodSignatures` is omitted rather than sent empty when the device signed no Ironwood action, because zcash-utils length-checks each pool's list against the PCZT.

- [#20714](https://github.com/LedgerHQ/ledger-live/pull/20714) [`93406e8`](https://github.com/LedgerHQ/ledger-live/commit/93406e87ae4398e314f899a0b30e54653b73c18b) Thanks [@semeano](https://github.com/semeano)! - Show a warning in the send flow when the Zcash private balance is selected as source and funds were shielded in the last 15 minutes, explaining that recently shielded funds need confirmations and scanning before they are spendable

### Patch Changes

- Updated dependencies [[`8a93a70`](https://github.com/LedgerHQ/ledger-live/commit/8a93a701d631bd18b6c5125f77588802c0325b4c), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.4.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1
  - @ledgerhq/live-signer-zcash@0.10.0-next.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.4.0-next.0

### Minor Changes

- [#20815](https://github.com/LedgerHQ/ledger-live/pull/20815) [`54fcd49`](https://github.com/LedgerHQ/ledger-live/commit/54fcd49f48deaed0aec71941c8b9926e6b6aee2e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Exclude immature Ironwood notes from the spendable pool. A shielded note is only spendable once its transaction is buried deep enough to have a witness at the builder's anchor, so a freshly scanned change note is no longer selected while a second send is prepared within the same confirmation window. The rule is applied wherever the spendable pool is derived — note selection, max-spendable and amount validation — and the send flow now reports insufficient spendable funds instead of failing when the transaction is built. Funds held by maturing notes stay part of the account's total balance.

- [#20658](https://github.com/LedgerHQ/ledger-live/pull/20658) [`a79b9aa`](https://github.com/LedgerHQ/ledger-live/commit/a79b9aacb2f21c89bd192342bc6b98a4265d4345) Thanks [@semeano](https://github.com/semeano)! - Zcash: add self transfer option on send modal

- [#20798](https://github.com/LedgerHQ/ledger-live/pull/20798) [`1de6156`](https://github.com/LedgerHQ/ledger-live/commit/1de61569d59e56b73a8797397cbdd1a10b069b08) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Name the Ironwood shielded operations and stop listing Zcash self-transfers.

  The Ironwood operation types were declared and given icons but never labelled, so a received or sent Ironwood transaction rendered its raw key in the history. They now carry the same labels, address cells and "Private (Ironwood)" transaction-type detail as the Sapling and Orchard ones.

  A shielded transaction that moved no value across the wallet boundary — every note landing on the account's own internal address — was also emitted as a history row of its own: no counterparty, a value of 0, and, when it was the shielded leg of a transparent-funded sweep, a duplicate of the transparent operation already listing that transaction. Such a transaction now produces an operation typed `NONE`, which keeps it in the account data while leaving it out of the lists. Its classification is unchanged, so the fee and balance logic that reads it is unaffected.

- [#20707](https://github.com/LedgerHQ/ledger-live/pull/20707) [`4cc31ec`](https://github.com/LedgerHQ/ledger-live/commit/4cc31ec90cae0a36663b35da3a569222e8e8efdf) Thanks [@semeano](https://github.com/semeano)! - Carry the Ironwood bundle through to the device signer.

- [#20756](https://github.com/LedgerHQ/ledger-live/pull/20756) [`02ddf7e`](https://github.com/LedgerHQ/ledger-live/commit/02ddf7e9d7542d6f0fcdb18d7f9461c37a8b8ce1) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Forward Ironwood spend-auth signatures to PCZT finalization (LIVE-35956).

  `signOperation` now passes the device's Ironwood `spendAuthSig` values to `combine`, so a V6 PCZT (any shielded or shielding send) finalizes through the same `finalizeTransaction` entry point as a V5 one — `@ledgerhq/zcash-utils` (bumped to 2.1.1) injects both pools' signatures and extracts the signed transaction. `ironwoodSignatures` is omitted rather than sent empty when the device signed no Ironwood action, because zcash-utils length-checks each pool's list against the PCZT.

- [#20714](https://github.com/LedgerHQ/ledger-live/pull/20714) [`93406e8`](https://github.com/LedgerHQ/ledger-live/commit/93406e87ae4398e314f899a0b30e54653b73c18b) Thanks [@semeano](https://github.com/semeano)! - Show a warning in the send flow when the Zcash private balance is selected as source and funds were shielded in the last 15 minutes, explaining that recently shielded funds need confirmations and scanning before they are spendable

### Patch Changes

- Updated dependencies [[`8a93a70`](https://github.com/LedgerHQ/ledger-live/commit/8a93a701d631bd18b6c5125f77588802c0325b4c), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/live-signer-zcash@0.10.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.3.0

### Minor Changes

- [#20608](https://github.com/LedgerHQ/ledger-live/pull/20608) [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add `deriveShieldedAddress(ufvk)` to derive the Orchard unified address host-side from a UFVK without requiring a device connection. Persists `shieldedAddress` in `ZcashPrivateInfo` with backward-compatible serialisation (null fallback for legacy accounts).

- [#20216](https://github.com/LedgerHQ/ledger-live/pull/20216) [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758) Thanks [@semeano](https://github.com/semeano)! - Restrict the Zcash balance, operations and shielded send flow to the Ironwood pool only.

- [#20328](https://github.com/LedgerHQ/ledger-live/pull/20328) [`79789ba`](https://github.com/LedgerHQ/ledger-live/commit/79789ba23f1105c033574ae8f8c552a3a757d74c) Thanks [@semeano](https://github.com/semeano)! - Add optimistic note reservation for Zcash Ironwood shielded sends, released when the operation spending the notes is confirmed or retired, and carried across a restart by the nullifiers recorded on the pending operation

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`ec0be9c`](https://github.com/LedgerHQ/ledger-live/commit/ec0be9c545259dd0dc2d2578dfabef3211f72e76), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0
  - @ledgerhq/ledger-wallet-framework@2.8.0
  - @ledgerhq/live-signer-zcash@0.9.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.3.0-next.0

### Minor Changes

- [#20608](https://github.com/LedgerHQ/ledger-live/pull/20608) [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add `deriveShieldedAddress(ufvk)` to derive the Orchard unified address host-side from a UFVK without requiring a device connection. Persists `shieldedAddress` in `ZcashPrivateInfo` with backward-compatible serialisation (null fallback for legacy accounts).

- [#20216](https://github.com/LedgerHQ/ledger-live/pull/20216) [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758) Thanks [@semeano](https://github.com/semeano)! - Restrict the Zcash balance, operations and shielded send flow to the Ironwood pool only.

- [#20328](https://github.com/LedgerHQ/ledger-live/pull/20328) [`79789ba`](https://github.com/LedgerHQ/ledger-live/commit/79789ba23f1105c033574ae8f8c552a3a757d74c) Thanks [@semeano](https://github.com/semeano)! - Add optimistic note reservation for Zcash Ironwood shielded sends, released when the operation spending the notes is confirmed or retired, and carried across a restart by the nullifiers recorded on the pending operation

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`ec0be9c`](https://github.com/LedgerHQ/ledger-live/commit/ec0be9c545259dd0dc2d2578dfabef3211f72e76), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0
  - @ledgerhq/live-signer-zcash@0.9.0-next.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.2.0

### Minor Changes

- [#20221](https://github.com/LedgerHQ/ledger-live/pull/20221) [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Serve Zcash accounts with a standalone `@ledgerhq/coin-zcash` coin-module (LIVE-34556).

  The module owns all four transfer flows — t→t, t→z, z→t, z→z — and crafts, signs and broadcasts each one as a PCZT through the native `@ledgerhq/zcash-utils` engine, with no legacy PSBT path: it owns the transparent UTXO path itself via `@ledgerhq/wallet-btc` instead of delegating to the Bitcoin bridge. Shielded balances, notes and operations come from the sync engine, so a shielded account reports the balance and history the chain-adapter could only report for its transparent side.

  Which module serves a Zcash account is decided by the existing `zcashShielded` feature flag, mirrored into `live-common` (`src/bridge/zcashRouting.ts`) because a coin-module cannot read React feature flags. OFF (the default) keeps `@ledgerhq/coin-bitcoin`'s Zcash chain-adapter and its legacy transparent path, so nothing changes for users until the flag is turned on; the two implementations are kept accounting-equivalent by differential tests that run both bridges over the same fixtures.

  Desktop hosts the engine in a dedicated utility process, reached over a `zcash:`-prefixed IPC contract owned by the module.

  Two flows do not complete on a NU6.3 chain, where newly shielded value goes to the Ironwood pool: z→z has no builder, since it would need Orchard spends alongside an Ironwood output; and a flow that does build a V6 PCZT cannot be finalized until `@ledgerhq/zcash-utils` exposes a V6 finalizer.

### Patch Changes

- Updated dependencies [[`7b4b965`](https://github.com/LedgerHQ/ledger-live/commit/7b4b965ce521cc6289ebeba50cca1a317f3417cd), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/live-signer-zcash@0.8.0
  - @ledgerhq/types-live@6.118.0
  - @ledgerhq/ledger-wallet-framework@2.7.0
  - @ledgerhq/wallet-btc@0.3.0

## 0.2.0-next.0

### Minor Changes

- [#20221](https://github.com/LedgerHQ/ledger-live/pull/20221) [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Serve Zcash accounts with a standalone `@ledgerhq/coin-zcash` coin-module (LIVE-34556).

  The module owns all four transfer flows — t→t, t→z, z→t, z→z — and crafts, signs and broadcasts each one as a PCZT through the native `@ledgerhq/zcash-utils` engine, with no legacy PSBT path: it owns the transparent UTXO path itself via `@ledgerhq/wallet-btc` instead of delegating to the Bitcoin bridge. Shielded balances, notes and operations come from the sync engine, so a shielded account reports the balance and history the chain-adapter could only report for its transparent side.

  Which module serves a Zcash account is decided by the existing `zcashShielded` feature flag, mirrored into `live-common` (`src/bridge/zcashRouting.ts`) because a coin-module cannot read React feature flags. OFF (the default) keeps `@ledgerhq/coin-bitcoin`'s Zcash chain-adapter and its legacy transparent path, so nothing changes for users until the flag is turned on; the two implementations are kept accounting-equivalent by differential tests that run both bridges over the same fixtures.

  Desktop hosts the engine in a dedicated utility process, reached over a `zcash:`-prefixed IPC contract owned by the module.

  Two flows do not complete on a NU6.3 chain, where newly shielded value goes to the Ironwood pool: z→z has no builder, since it would need Orchard spends alongside an Ironwood output; and a flow that does build a V6 PCZT cannot be finalized until `@ledgerhq/zcash-utils` exposes a V6 finalizer.

### Patch Changes

- Updated dependencies [[`7b4b965`](https://github.com/LedgerHQ/ledger-live/commit/7b4b965ce521cc6289ebeba50cca1a317f3417cd), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/live-signer-zcash@0.8.0-next.0
  - @ledgerhq/types-live@6.118.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0
  - @ledgerhq/wallet-btc@0.3.0
