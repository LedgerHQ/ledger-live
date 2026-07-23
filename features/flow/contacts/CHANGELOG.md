# @features/flow-contacts

## 0.2.0

### Minor Changes

- [#19647](https://github.com/LedgerHQ/ledger-live/pull/19647) [`e379f4d`](https://github.com/LedgerHQ/ledger-live/commit/e379f4d8176d823d068b34d0249e5cb2fe48d0ce) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the populated Contacts list view model.

- [#19563](https://github.com/LedgerHQ/ledger-live/pull/19563) [`5bada3c`](https://github.com/LedgerHQ/ledger-live/commit/5bada3c49491daa95ee59cf06df1022141b864a2) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the empty Contacts list view model and validate contact text fields.

- [#19672](https://github.com/LedgerHQ/ledger-live/pull/19672) [`d7ce552`](https://github.com/LedgerHQ/ledger-live/commit/d7ce5521ad9fa82427ef0f9996c1c657c0709e7a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix mobile Jest resolution for @features/flow-contacts via a logic-only `jest.native.ts` stub, Lumen RN source mappings, and updated integration testing docs.

- [#19565](https://github.com/LedgerHQ/ledger-live/pull/19565) [`293720f`](https://github.com/LedgerHQ/ledger-live/commit/293720fb12143028da875fb1d2e169d2bacc6e57) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Contacts page shell with an empty list to the Desktop Contacts page.

- [#19444](https://github.com/LedgerHQ/ledger-live/pull/19444) [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de) Thanks [@deepyjr](https://github.com/deepyjr)! - Add eligible address family configuration to Contacts feature flags.

- [#19377](https://github.com/LedgerHQ/ledger-live/pull/19377) [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705) Thanks [@deepyjr](https://github.com/deepyjr)! - Register Contacts feature flags and expose Contacts flow access.

- [#19383](https://github.com/LedgerHQ/ledger-live/pull/19383) [`2d58d35`](https://github.com/LedgerHQ/ledger-live/commit/2d58d3505af6592b25be177ea05c56ecc561d422) Thanks [@deepyjr](https://github.com/deepyjr)! - Create the Contacts flow package.

- [#19551](https://github.com/LedgerHQ/ledger-live/pull/19551) [`16edbea`](https://github.com/LedgerHQ/ledger-live/commit/16edbea121ac5c033c185606183c2d857e1debe5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add My Wallet Contact entry and gated empty Contacts page shell backed by domain contacts state.

- [#19672](https://github.com/LedgerHQ/ledger-live/pull/19672) [`2b676ff`](https://github.com/LedgerHQ/ledger-live/commit/2b676ff4d544bc60ae8c2860c0494e6f6d79f85f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add My Wallet Contacts entry and gated empty Contacts page shell backed by domain contacts state.

- [#19569](https://github.com/LedgerHQ/ledger-live/pull/19569) [`fcc75ef`](https://github.com/LedgerHQ/ledger-live/commit/fcc75ef6c3e584b5b73b20335af5e6dcb95e73c7) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the routed Mobile empty Contacts list.

- [#19573](https://github.com/LedgerHQ/ledger-live/pull/19573) [`452be85`](https://github.com/LedgerHQ/ledger-live/commit/452be85b27378f9240041119296ffa8c580fe071) Thanks [@deepyjr](https://github.com/deepyjr)! - Assign Wallet XP as the Contacts flow code owner.

- [#19496](https://github.com/LedgerHQ/ledger-live/pull/19496) [`0b48c73`](https://github.com/LedgerHQ/ledger-live/commit/0b48c737ee15bc74cfd60fdbdba5269eacefb136) Thanks [@deepyjr](https://github.com/deepyjr)! - Move Contacts feature flag parameter normalization and updates into the shared flow package for both debug tools.

- [#19649](https://github.com/LedgerHQ/ledger-live/pull/19649) [`c12485a`](https://github.com/LedgerHQ/ledger-live/commit/c12485ab346a02db79d864e8ecf7837d724a4575) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Contacts search list view model.

### Patch Changes

- Updated dependencies [[`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`5bada3c`](https://github.com/LedgerHQ/ledger-live/commit/5bada3c49491daa95ee59cf06df1022141b864a2), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`e89bc86`](https://github.com/LedgerHQ/ledger-live/commit/e89bc86cc3daa0e38c43fbd933c233c840a9a657), [`5890c95`](https://github.com/LedgerHQ/ledger-live/commit/5890c951b33708923b6ae646ec5a2ea278f6982f), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`b48b348`](https://github.com/LedgerHQ/ledger-live/commit/b48b3485eb7ddbc6733435099b39fa641bfad8d1), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`94b454b`](https://github.com/LedgerHQ/ledger-live/commit/94b454bd9676198c49ee4c4c0c49063e87175f70), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @shared/feature-flags@0.14.0
  - @domain/entity-contact@0.2.0
  - @features/platform-feature-flags@0.6.1

## 0.2.0-next.0

### Minor Changes

- [#19647](https://github.com/LedgerHQ/ledger-live/pull/19647) [`e379f4d`](https://github.com/LedgerHQ/ledger-live/commit/e379f4d8176d823d068b34d0249e5cb2fe48d0ce) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the populated Contacts list view model.

- [#19563](https://github.com/LedgerHQ/ledger-live/pull/19563) [`5bada3c`](https://github.com/LedgerHQ/ledger-live/commit/5bada3c49491daa95ee59cf06df1022141b864a2) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the empty Contacts list view model and validate contact text fields.

- [#19672](https://github.com/LedgerHQ/ledger-live/pull/19672) [`d7ce552`](https://github.com/LedgerHQ/ledger-live/commit/d7ce5521ad9fa82427ef0f9996c1c657c0709e7a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix mobile Jest resolution for @features/flow-contacts via a logic-only `jest.native.ts` stub, Lumen RN source mappings, and updated integration testing docs.

- [#19565](https://github.com/LedgerHQ/ledger-live/pull/19565) [`293720f`](https://github.com/LedgerHQ/ledger-live/commit/293720fb12143028da875fb1d2e169d2bacc6e57) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Contacts page shell with an empty list to the Desktop Contacts page.

- [#19444](https://github.com/LedgerHQ/ledger-live/pull/19444) [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de) Thanks [@deepyjr](https://github.com/deepyjr)! - Add eligible address family configuration to Contacts feature flags.

- [#19377](https://github.com/LedgerHQ/ledger-live/pull/19377) [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705) Thanks [@deepyjr](https://github.com/deepyjr)! - Register Contacts feature flags and expose Contacts flow access.

- [#19383](https://github.com/LedgerHQ/ledger-live/pull/19383) [`2d58d35`](https://github.com/LedgerHQ/ledger-live/commit/2d58d3505af6592b25be177ea05c56ecc561d422) Thanks [@deepyjr](https://github.com/deepyjr)! - Create the Contacts flow package.

- [#19551](https://github.com/LedgerHQ/ledger-live/pull/19551) [`16edbea`](https://github.com/LedgerHQ/ledger-live/commit/16edbea121ac5c033c185606183c2d857e1debe5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add My Wallet Contact entry and gated empty Contacts page shell backed by domain contacts state.

- [#19672](https://github.com/LedgerHQ/ledger-live/pull/19672) [`2b676ff`](https://github.com/LedgerHQ/ledger-live/commit/2b676ff4d544bc60ae8c2860c0494e6f6d79f85f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add My Wallet Contacts entry and gated empty Contacts page shell backed by domain contacts state.

- [#19569](https://github.com/LedgerHQ/ledger-live/pull/19569) [`fcc75ef`](https://github.com/LedgerHQ/ledger-live/commit/fcc75ef6c3e584b5b73b20335af5e6dcb95e73c7) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the routed Mobile empty Contacts list.

- [#19573](https://github.com/LedgerHQ/ledger-live/pull/19573) [`452be85`](https://github.com/LedgerHQ/ledger-live/commit/452be85b27378f9240041119296ffa8c580fe071) Thanks [@deepyjr](https://github.com/deepyjr)! - Assign Wallet XP as the Contacts flow code owner.

- [#19496](https://github.com/LedgerHQ/ledger-live/pull/19496) [`0b48c73`](https://github.com/LedgerHQ/ledger-live/commit/0b48c737ee15bc74cfd60fdbdba5269eacefb136) Thanks [@deepyjr](https://github.com/deepyjr)! - Move Contacts feature flag parameter normalization and updates into the shared flow package for both debug tools.

- [#19649](https://github.com/LedgerHQ/ledger-live/pull/19649) [`c12485a`](https://github.com/LedgerHQ/ledger-live/commit/c12485ab346a02db79d864e8ecf7837d724a4575) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Contacts search list view model.

### Patch Changes

- Updated dependencies [[`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`5bada3c`](https://github.com/LedgerHQ/ledger-live/commit/5bada3c49491daa95ee59cf06df1022141b864a2), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`e89bc86`](https://github.com/LedgerHQ/ledger-live/commit/e89bc86cc3daa0e38c43fbd933c233c840a9a657), [`5890c95`](https://github.com/LedgerHQ/ledger-live/commit/5890c951b33708923b6ae646ec5a2ea278f6982f), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`b48b348`](https://github.com/LedgerHQ/ledger-live/commit/b48b3485eb7ddbc6733435099b39fa641bfad8d1), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`94b454b`](https://github.com/LedgerHQ/ledger-live/commit/94b454bd9676198c49ee4c4c0c49063e87175f70), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @shared/feature-flags@0.14.0-next.0
  - @domain/entity-contact@0.2.0-next.0
  - @features/platform-feature-flags@0.6.1-next.0
