# @features/flow-contacts

## 0.4.0-next.0

### Minor Changes

- [#20032](https://github.com/LedgerHQ/ledger-live/pull/20032) [`dbffe41`](https://github.com/LedgerHQ/ledger-live/commit/dbffe417f903844a973b7a284206e7313b7a8e5a) Thanks [@deepyjr](https://github.com/deepyjr)! - Render Me-specific contact detail actions and copy on mobile.

- [#19964](https://github.com/LedgerHQ/ledger-live/pull/19964) [`86bbd1d`](https://github.com/LedgerHQ/ledger-live/commit/86bbd1d829ee60b76af040c064d93acc15561855) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add the one-time Contacts feature introduction drawer on Mobile with shared native content and dismissal preference.

- [#20107](https://github.com/LedgerHQ/ledger-live/pull/20107) [`54b3d2b`](https://github.com/LedgerHQ/ledger-live/commit/54b3d2b6032f1336d4d9fb2e238fa2347e45cc81) Thanks [@deepyjr](https://github.com/deepyjr)! - Add shared Coin Integration address validation to Contacts

- [#20146](https://github.com/LedgerHQ/ledger-live/pull/20146) [`8a6b086`](https://github.com/LedgerHQ/ledger-live/commit/8a6b0868b0f0d760d83ece3edafa40716df4fc2f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Desktop contacts list scroll so the add contact row stays full size at the end of the list.

- [#19995](https://github.com/LedgerHQ/ledger-live/pull/19995) [`281a7f3`](https://github.com/LedgerHQ/ledger-live/commit/281a7f358d6fe176a0cbba349d081942ed32ea64) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render validation errors in the Desktop add contact dialog.

- [#20053](https://github.com/LedgerHQ/ledger-live/pull/20053) [`2e410a6`](https://github.com/LedgerHQ/ledger-live/commit/2e410a67f5a88b5cb8d79184b97bcded0d4eaadf) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared contact detail edit/delete scenario state and contact edit requirement helper.

- [#19985](https://github.com/LedgerHQ/ledger-live/pull/19985) [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7) Thanks [@deepyjr](https://github.com/deepyjr)! - Reorganize the contacts flow package around a /steps folder (List, AddContact, Introduction, Detail), promote shared helpers to src/utils, curate root barrels, and rename public views to ContactsListView and ContactDetailView. No runtime behavior change.

- [#20065](https://github.com/LedgerHQ/ledger-live/pull/20065) [`91da072`](https://github.com/LedgerHQ/ledger-live/commit/91da072ea17f564824d6c04d13934ec88d86d348) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared contact address detail view model with selected address payload, QR payload string, and not-found state.

- [#20041](https://github.com/LedgerHQ/ledger-live/pull/20041) [`e58258b`](https://github.com/LedgerHQ/ledger-live/commit/e58258b3a130ba606bdf8d882b02d59eb3571082) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared populated contact detail view model with network-ordered address rows, address count, and open-detail intents.

- [#20027](https://github.com/LedgerHQ/ledger-live/pull/20027) [`6131b15`](https://github.com/LedgerHQ/ledger-live/commit/6131b15d376b0ea2677df401564872a9c19d2151) Thanks [@deepyjr](https://github.com/deepyjr)! - Add shared Add Address session state and start it from Mobile contact details

- [#20022](https://github.com/LedgerHQ/ledger-live/pull/20022) [`f334b43`](https://github.com/LedgerHQ/ledger-live/commit/f334b430c82892f603221fb3ffe5d3964215bcad) Thanks [@deepyjr](https://github.com/deepyjr)! - Resolve Contacts MAD eligible production networks from feature flags and store the final currency
  selection

- [#20035](https://github.com/LedgerHQ/ledger-live/pull/20035) [`67df284`](https://github.com/LedgerHQ/ledger-live/commit/67df284e2ccb916cff51896e42ef21846249b3e7) Thanks [@deepyjr](https://github.com/deepyjr)! - Select a native asset or token and its eligible network with the Mobile modular drawer before
  entering a contact address.

- [#20098](https://github.com/LedgerHQ/ledger-live/pull/20098) [`18bc180`](https://github.com/LedgerHQ/ledger-live/commit/18bc180446f0d7410a3aedd953e2fb0ce2b43f4c) Thanks [@deepyjr](https://github.com/deepyjr)! - Add shared Contacts address entry validation state.

- [#19880](https://github.com/LedgerHQ/ledger-live/pull/19880) [`26ee89d`](https://github.com/LedgerHQ/ledger-live/commit/26ee89d7e3bba9b800a7b6f08db52b079fcd8bd5) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the shared native empty contact detail page and wire it into Mobile.

- [#20118](https://github.com/LedgerHQ/ledger-live/pull/20118) [`5de8391`](https://github.com/LedgerHQ/ledger-live/commit/5de839159cbd681c5a764976197ca4f028195124) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add populated contact detail with network-grouped address rows, crypto icons, and shared address detail dialog.

- [#19892](https://github.com/LedgerHQ/ledger-live/pull/19892) [`66edf4d`](https://github.com/LedgerHQ/ledger-live/commit/66edf4da2d94165a82f36680f3df323f1a62b45e) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add the Desktop Add contact dialog and shared web form wired to add-contact state.

- [#19998](https://github.com/LedgerHQ/ledger-live/pull/19998) [`e4e009f`](https://github.com/LedgerHQ/ledger-live/commit/e4e009f60792d3d0c9dd79c19406b02cec66b22b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop contact detail empty state using shared flow-contacts Detail step.

### Patch Changes

- Updated dependencies [[`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c), [`91da072`](https://github.com/LedgerHQ/ledger-live/commit/91da072ea17f564824d6c04d13934ec88d86d348), [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd)]:
  - @domain/entity-currency-crypto@0.8.0-next.0
  - @domain/entity-currency-token@0.3.0-next.0
  - @domain/entity-contact@0.4.0-next.0
  - @shared/feature-flags@0.16.0-next.0
  - @features/platform-feature-flags@0.6.3-next.0

## 0.3.0

### Minor Changes

- [#19855](https://github.com/LedgerHQ/ledger-live/pull/19855) [`6b6f59e`](https://github.com/LedgerHQ/ledger-live/commit/6b6f59e77df6fc6794c13d12f476733624a53c96) Thanks [@deepyjr](https://github.com/deepyjr)! - Align Contacts Jest configuration with the shared Flow tooling.

- [#19757](https://github.com/LedgerHQ/ledger-live/pull/19757) [`f115fc2`](https://github.com/LedgerHQ/ledger-live/commit/f115fc2cd159bd170bee3b9cdcc3f65f521017db) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Contacts list view-model and helper test coverage.

- [#19666](https://github.com/LedgerHQ/ledger-live/pull/19666) [`732faa2`](https://github.com/LedgerHQ/ledger-live/commit/732faa27e81899b49a08e6a9c8fe2c8b75ac17ea) Thanks [@deepyjr](https://github.com/deepyjr)! - Add mock Ledger Sync presentation variants to Desktop Contacts.

- [#19742](https://github.com/LedgerHQ/ledger-live/pull/19742) [`022f431`](https://github.com/LedgerHQ/ledger-live/commit/022f43122a713f9d4b2e10daaec0d44c91b58c9f) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Ledger Sync checking and introduction presentation variants to Mobile Contacts.

- [#19790](https://github.com/LedgerHQ/ledger-live/pull/19790) [`d942108`](https://github.com/LedgerHQ/ledger-live/commit/d9421087b45b4a0febaee63b1f1a097c2f42a2a5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared add-contact scenario state and save hook for Contacts flows

- [#19830](https://github.com/LedgerHQ/ledger-live/pull/19830) [`d7f59ec`](https://github.com/LedgerHQ/ledger-live/commit/d7f59ecfa0e7a549b0206042738244ec89c68b95) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Expose shared add-contact invalid name validation state

- [#19827](https://github.com/LedgerHQ/ledger-live/pull/19827) [`35e9528`](https://github.com/LedgerHQ/ledger-live/commit/35e952874f86878788d636d7d362d239374738cd) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared Contacts feature introduction state, preference port, and Ledger Sync priority resolvers

- [#19781](https://github.com/LedgerHQ/ledger-live/pull/19781) [`f8164bd`](https://github.com/LedgerHQ/ledger-live/commit/f8164bdd7fb0dc138c399d424eda1c8c129dd477) Thanks [@deepyjr](https://github.com/deepyjr)! - Add an interactive section index to the Mobile Contacts list

- [#19776](https://github.com/LedgerHQ/ledger-live/pull/19776) [`d43ab1d`](https://github.com/LedgerHQ/ledger-live/commit/d43ab1d5dcc111534b1633f4da051787d0ef3d2f) Thanks [@deepyjr](https://github.com/deepyjr)! - Render Contacts search results in Ledger Wallet Mobile.

- [#19878](https://github.com/LedgerHQ/ledger-live/pull/19878) [`8e21dc0`](https://github.com/LedgerHQ/ledger-live/commit/8e21dc0eee799be29803d63b582da3463f1593b3) Thanks [@deepyjr](https://github.com/deepyjr)! - Add shared selection for an empty contact detail.

- [#19902](https://github.com/LedgerHQ/ledger-live/pull/19902) [`ab74170`](https://github.com/LedgerHQ/ledger-live/commit/ab7417038021e37f932bac5551b862dce6a2c39f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add the Contacts feature introduction dialog, hero asset, and shared page wiring with a closed default state for apps.

- [#19712](https://github.com/LedgerHQ/ledger-live/pull/19712) [`fd1e33b`](https://github.com/LedgerHQ/ledger-live/commit/fd1e33bb3976c8986e16579a4995c9fcf4dc52aa) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render the populated Desktop Contacts list and add Dev Tool controls to load mock contacts for testing.

- [#19730](https://github.com/LedgerHQ/ledger-live/pull/19730) [`067b570`](https://github.com/LedgerHQ/ledger-live/commit/067b57005f76858bdaf2699dffde07ada4b5fa86) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Contacts search results and no-result state

- [#19740](https://github.com/LedgerHQ/ledger-live/pull/19740) [`03dbe82`](https://github.com/LedgerHQ/ledger-live/commit/03dbe82bcaff5b4f0aedac2e6ea3cca767a0e05c) Thanks [@deepyjr](https://github.com/deepyjr)! - Render grouped populated Contacts lists on mobile.

- [#19812](https://github.com/LedgerHQ/ledger-live/pull/19812) [`729a6f8`](https://github.com/LedgerHQ/ledger-live/commit/729a6f8bce7914da53b0f404ddc8904fa4339d9f) Thanks [@deepyjr](https://github.com/deepyjr)! - Keep the Mobile Contacts search input visible while the populated list scrolls.

### Patch Changes

- Updated dependencies [[`d7f59ec`](https://github.com/LedgerHQ/ledger-live/commit/d7f59ecfa0e7a549b0206042738244ec89c68b95), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f)]:
  - @domain/entity-contact@0.3.0
  - @shared/feature-flags@0.15.0
  - @features/platform-feature-flags@0.6.2

## 0.3.0-next.0

### Minor Changes

- [#19855](https://github.com/LedgerHQ/ledger-live/pull/19855) [`6b6f59e`](https://github.com/LedgerHQ/ledger-live/commit/6b6f59e77df6fc6794c13d12f476733624a53c96) Thanks [@deepyjr](https://github.com/deepyjr)! - Align Contacts Jest configuration with the shared Flow tooling.

- [#19757](https://github.com/LedgerHQ/ledger-live/pull/19757) [`f115fc2`](https://github.com/LedgerHQ/ledger-live/commit/f115fc2cd159bd170bee3b9cdcc3f65f521017db) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Contacts list view-model and helper test coverage.

- [#19666](https://github.com/LedgerHQ/ledger-live/pull/19666) [`732faa2`](https://github.com/LedgerHQ/ledger-live/commit/732faa27e81899b49a08e6a9c8fe2c8b75ac17ea) Thanks [@deepyjr](https://github.com/deepyjr)! - Add mock Ledger Sync presentation variants to Desktop Contacts.

- [#19742](https://github.com/LedgerHQ/ledger-live/pull/19742) [`022f431`](https://github.com/LedgerHQ/ledger-live/commit/022f43122a713f9d4b2e10daaec0d44c91b58c9f) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Ledger Sync checking and introduction presentation variants to Mobile Contacts.

- [#19790](https://github.com/LedgerHQ/ledger-live/pull/19790) [`d942108`](https://github.com/LedgerHQ/ledger-live/commit/d9421087b45b4a0febaee63b1f1a097c2f42a2a5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared add-contact scenario state and save hook for Contacts flows

- [#19830](https://github.com/LedgerHQ/ledger-live/pull/19830) [`d7f59ec`](https://github.com/LedgerHQ/ledger-live/commit/d7f59ecfa0e7a549b0206042738244ec89c68b95) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Expose shared add-contact invalid name validation state

- [#19827](https://github.com/LedgerHQ/ledger-live/pull/19827) [`35e9528`](https://github.com/LedgerHQ/ledger-live/commit/35e952874f86878788d636d7d362d239374738cd) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared Contacts feature introduction state, preference port, and Ledger Sync priority resolvers

- [#19781](https://github.com/LedgerHQ/ledger-live/pull/19781) [`f8164bd`](https://github.com/LedgerHQ/ledger-live/commit/f8164bdd7fb0dc138c399d424eda1c8c129dd477) Thanks [@deepyjr](https://github.com/deepyjr)! - Add an interactive section index to the Mobile Contacts list

- [#19776](https://github.com/LedgerHQ/ledger-live/pull/19776) [`d43ab1d`](https://github.com/LedgerHQ/ledger-live/commit/d43ab1d5dcc111534b1633f4da051787d0ef3d2f) Thanks [@deepyjr](https://github.com/deepyjr)! - Render Contacts search results in Ledger Wallet Mobile.

- [#19878](https://github.com/LedgerHQ/ledger-live/pull/19878) [`8e21dc0`](https://github.com/LedgerHQ/ledger-live/commit/8e21dc0eee799be29803d63b582da3463f1593b3) Thanks [@deepyjr](https://github.com/deepyjr)! - Add shared selection for an empty contact detail.

- [#19902](https://github.com/LedgerHQ/ledger-live/pull/19902) [`ab74170`](https://github.com/LedgerHQ/ledger-live/commit/ab7417038021e37f932bac5551b862dce6a2c39f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add the Contacts feature introduction dialog, hero asset, and shared page wiring with a closed default state for apps.

- [#19712](https://github.com/LedgerHQ/ledger-live/pull/19712) [`fd1e33b`](https://github.com/LedgerHQ/ledger-live/commit/fd1e33bb3976c8986e16579a4995c9fcf4dc52aa) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render the populated Desktop Contacts list and add Dev Tool controls to load mock contacts for testing.

- [#19730](https://github.com/LedgerHQ/ledger-live/pull/19730) [`067b570`](https://github.com/LedgerHQ/ledger-live/commit/067b57005f76858bdaf2699dffde07ada4b5fa86) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Contacts search results and no-result state

- [#19740](https://github.com/LedgerHQ/ledger-live/pull/19740) [`03dbe82`](https://github.com/LedgerHQ/ledger-live/commit/03dbe82bcaff5b4f0aedac2e6ea3cca767a0e05c) Thanks [@deepyjr](https://github.com/deepyjr)! - Render grouped populated Contacts lists on mobile.

- [#19812](https://github.com/LedgerHQ/ledger-live/pull/19812) [`729a6f8`](https://github.com/LedgerHQ/ledger-live/commit/729a6f8bce7914da53b0f404ddc8904fa4339d9f) Thanks [@deepyjr](https://github.com/deepyjr)! - Keep the Mobile Contacts search input visible while the populated list scrolls.

### Patch Changes

- Updated dependencies [[`d7f59ec`](https://github.com/LedgerHQ/ledger-live/commit/d7f59ecfa0e7a549b0206042738244ec89c68b95), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f)]:
  - @domain/entity-contact@0.3.0-next.0
  - @shared/feature-flags@0.15.0-next.0
  - @features/platform-feature-flags@0.6.2-next.0

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
