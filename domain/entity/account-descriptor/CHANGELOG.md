# @domain/entity-account-descriptor

## 0.3.0-next.0

### Minor Changes

- [#23710](https://github.com/LedgerHQ/ledger-live/pull/23710) [`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-descriptor): identify the network by its CAL network_id

  The descriptor becomes `account:2:<type>:<network_id>:<key>:<path>` and the entity only reads version 2.

  wallet-cli, breaking:

  - The upgrade is one-way: `session.yaml` is rewritten to version 2 on the next write (e.g. `account discover`), and an older wallet-cli can no longer read it. Don't roll back, pin an older install or run two versions on the same session.
  - `network` in the JSON envelope and in analytics events is now the network id (`ethereum`, `bitcoin_testnet`), no longer `<name>:<env>` (`ethereum:main`).

### Patch Changes

- Updated dependencies [[`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8)]:
  - @domain/entity-currency-crypto@0.17.0-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e)]:
  - @domain/entity-currency-crypto@0.16.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e)]:
  - @domain/entity-currency-crypto@0.16.0-next.0

## 0.2.0

### Minor Changes

- [#23135](https://github.com/LedgerHQ/ledger-live/pull/23135) [`4864e53`](https://github.com/LedgerHQ/ledger-live/commit/4864e53391f1c544e13b7593c2464f55737ccae8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read the "'" and "H" hardened markers of a descriptor path as "h"

- [#22994](https://github.com/LedgerHQ/ledger-live/pull/22994) [`e1742ea`](https://github.com/LedgerHQ/ledger-live/commit/e1742ea357bd113d34c0b29c701fd6080b9614a1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the account descriptor entity: schema, string form shared with wallet-cli, canonical key and AccountUUID.

### Patch Changes

- Updated dependencies [[`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9)]:
  - @domain/entity-currency-crypto@0.15.0

## 0.2.0-next.0

### Minor Changes

- [#23135](https://github.com/LedgerHQ/ledger-live/pull/23135) [`4864e53`](https://github.com/LedgerHQ/ledger-live/commit/4864e53391f1c544e13b7593c2464f55737ccae8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read the "'" and "H" hardened markers of a descriptor path as "h"

- [#22994](https://github.com/LedgerHQ/ledger-live/pull/22994) [`e1742ea`](https://github.com/LedgerHQ/ledger-live/commit/e1742ea357bd113d34c0b29c701fd6080b9614a1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the account descriptor entity: schema, string form shared with wallet-cli, canonical key and AccountUUID.

### Patch Changes

- Updated dependencies [[`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9)]:
  - @domain/entity-currency-crypto@0.15.0-next.0
