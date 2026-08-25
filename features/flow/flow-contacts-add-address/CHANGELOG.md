# @features/flow-contacts-add-address

## 0.2.0-next.0

### Minor Changes

- [#20910](https://github.com/LedgerHQ/ledger-live/pull/20910) [`a86fe14`](https://github.com/LedgerHQ/ledger-live/commit/a86fe1498de34b86c2a89077a02886a26c6e158a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add a prefilled Add Address flow that bypasses the Modular Asset Drawer, with a name-only Desktop naming step and a dedicated review step, while keeping the existing MAD path unchanged.

- [#20673](https://github.com/LedgerHQ/ledger-live/pull/20673) [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts Add address flow and centralize shared Contacts configuration in Platform Contacts.

- [#20972](https://github.com/LedgerHQ/ledger-live/pull/20972) [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e) Thanks [@deepyjr](https://github.com/deepyjr)! - Centralize dual-platform Knip configuration.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @domain/entity-contact@0.8.0-next.0
  - @features/platform-contacts@0.4.0-next.0
