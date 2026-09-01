# @domain/entity-contact

## 0.8.1-next.0

### Patch Changes

- Updated dependencies [[`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8)]:
  - @domain/entity-currency-crypto@0.11.0-next.0
  - @shared/cloud-sync-module@0.4.0-next.0
  - @shared/schema-primitives@0.5.0-next.0
  - @domain/entity-currency-token@0.5.1-next.0

## 0.8.0

### Minor Changes

- [#20917](https://github.com/LedgerHQ/ledger-live/pull/20917) [`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow numbers in contact names and hide add-contact actions when a Contacts search has no results.

- [#20963](https://github.com/LedgerHQ/ledger-live/pull/20963) [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Edit contact journey, share contact-name input primitives through Platform Contacts, and
  own the contact-name length limit in the Contact entity.

### Patch Changes

- Updated dependencies [[`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249)]:
  - @shared/cloud-sync-module@0.3.0

## 0.8.0-next.0

### Minor Changes

- [#20917](https://github.com/LedgerHQ/ledger-live/pull/20917) [`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow numbers in contact names and hide add-contact actions when a Contacts search has no results.

- [#20963](https://github.com/LedgerHQ/ledger-live/pull/20963) [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Edit contact journey, share contact-name input primitives through Platform Contacts, and
  own the contact-name length limit in the Contact entity.

### Patch Changes

- Updated dependencies [[`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249)]:
  - @shared/cloud-sync-module@0.3.0-next.0

## 0.7.0

### Minor Changes

- [#20570](https://github.com/LedgerHQ/ledger-live/pull/20570) [`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a) Thanks [@deepyjr](https://github.com/deepyjr)! - Add typed Device Intent data and a Cloud Sync document for Contacts.

### Patch Changes

- Updated dependencies [[`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @domain/entity-currency-token@0.5.0

## 0.7.0-next.0

### Minor Changes

- [#20570](https://github.com/LedgerHQ/ledger-live/pull/20570) [`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a) Thanks [@deepyjr](https://github.com/deepyjr)! - Add typed Device Intent data and a Cloud Sync document for Contacts.

### Patch Changes

- Updated dependencies [[`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @domain/entity-currency-token@0.5.0-next.0

## 0.6.0

### Minor Changes

- [#20653](https://github.com/LedgerHQ/ledger-live/pull/20653) [`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c) Thanks [@deepyjr](https://github.com/deepyjr)! - Add formatting checks to Contacts packages.

- [#20582](https://github.com/LedgerHQ/ledger-live/pull/20582) [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the currency id schemas to the packages that own them.

  `CryptoCurrencyIdSchema`, `TokenCurrencyIdSchema` and `FiatCurrencyIdSchema` (and their inferred
  types) now live in `@domain/entity-currency-crypto`, `@domain/entity-currency-token` and
  `@domain/entity-currency-fiat` respectively, instead of `@shared/schema-primitives`. A primitives
  package has no business knowing about crypto, tokens or fiat.

  The crypto and token packages used to re-export these symbols from primitives, which made them
  proxies: two import paths for the same thing, and no obvious original provider. Consumers already
  importing from `@domain/entity-currency-*` are unaffected, since the symbols genuinely moved there.
  Anything importing them from `@shared/schema-primitives` must now import the owning domain package.

- [#20510](https://github.com/LedgerHQ/ledger-live/pull/20510) [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Model Me as the default self contact with shared display-name formatting, external address counts, and a Ledger Wallet accounts intent.

- [#20380](https://github.com/LedgerHQ/ledger-live/pull/20380) [`79d2278`](https://github.com/LedgerHQ/ledger-live/commit/79d22789896f55d9a7196392632b08488997d937) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared address edit signer validation state with mocked signer mismatch handling for Desktop and Mobile.

### Patch Changes

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3)]:
  - @domain/entity-currency-crypto@0.10.0
  - @domain/entity-currency-token@0.4.0
  - @shared/schema-primitives@0.4.0

## 0.6.0-next.0

### Minor Changes

- [#20653](https://github.com/LedgerHQ/ledger-live/pull/20653) [`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c) Thanks [@deepyjr](https://github.com/deepyjr)! - Add formatting checks to Contacts packages.

- [#20582](https://github.com/LedgerHQ/ledger-live/pull/20582) [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the currency id schemas to the packages that own them.

  `CryptoCurrencyIdSchema`, `TokenCurrencyIdSchema` and `FiatCurrencyIdSchema` (and their inferred
  types) now live in `@domain/entity-currency-crypto`, `@domain/entity-currency-token` and
  `@domain/entity-currency-fiat` respectively, instead of `@shared/schema-primitives`. A primitives
  package has no business knowing about crypto, tokens or fiat.

  The crypto and token packages used to re-export these symbols from primitives, which made them
  proxies: two import paths for the same thing, and no obvious original provider. Consumers already
  importing from `@domain/entity-currency-*` are unaffected, since the symbols genuinely moved there.
  Anything importing them from `@shared/schema-primitives` must now import the owning domain package.

- [#20510](https://github.com/LedgerHQ/ledger-live/pull/20510) [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Model Me as the default self contact with shared display-name formatting, external address counts, and a Ledger Wallet accounts intent.

- [#20380](https://github.com/LedgerHQ/ledger-live/pull/20380) [`79d2278`](https://github.com/LedgerHQ/ledger-live/commit/79d22789896f55d9a7196392632b08488997d937) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared address edit signer validation state with mocked signer mismatch handling for Desktop and Mobile.

### Patch Changes

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3)]:
  - @domain/entity-currency-crypto@0.10.0-next.0
  - @domain/entity-currency-token@0.4.0-next.0
  - @shared/schema-primitives@0.4.0-next.0

## 0.5.0

### Minor Changes

- [#20319](https://github.com/LedgerHQ/ledger-live/pull/20319) [`4d3ae1b`](https://github.com/LedgerHQ/ledger-live/commit/4d3ae1bea30b444281698844214072d95665e07a) Thanks [@deepyjr](https://github.com/deepyjr)! - Restrict Contacts address labels to printable ASCII characters

- [#20316](https://github.com/LedgerHQ/ledger-live/pull/20316) [`36a08f1`](https://github.com/LedgerHQ/ledger-live/commit/36a08f1aea939fc42e7dafd8d734ef8dce88d7d0) Thanks [@deepyjr](https://github.com/deepyjr)! - Add address label validation and flow

- [#20222](https://github.com/LedgerHQ/ledger-live/pull/20222) [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3) Thanks [@deepyjr](https://github.com/deepyjr)! - Model contact address labels with asset defaults and per-contact uniqueness

- [#20252](https://github.com/LedgerHQ/ledger-live/pull/20252) [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Me contact detail by default with Me display-name formatting and external address CTA.

- [#20348](https://github.com/LedgerHQ/ledger-live/pull/20348) [`e7a22a6`](https://github.com/LedgerHQ/ledger-live/commit/e7a22a6e3c8c444640cfe8df88637ecad738e26a) Thanks [@deepyjr](https://github.com/deepyjr)! - Standardize contact validation error contracts.

- [#20379](https://github.com/LedgerHQ/ledger-live/pull/20379) [`9d56877`](https://github.com/LedgerHQ/ledger-live/commit/9d568778b657961ef06ba04d5fa616677afec7b8) Thanks [@deepyjr](https://github.com/deepyjr)! - Standardize Contacts validation input schemas and error names

- [#20321](https://github.com/LedgerHQ/ledger-live/pull/20321) [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58) Thanks [@deepyjr](https://github.com/deepyjr)! - Block duplicate Contacts names before creation

## 0.5.0-next.0

### Minor Changes

- [#20319](https://github.com/LedgerHQ/ledger-live/pull/20319) [`4d3ae1b`](https://github.com/LedgerHQ/ledger-live/commit/4d3ae1bea30b444281698844214072d95665e07a) Thanks [@deepyjr](https://github.com/deepyjr)! - Restrict Contacts address labels to printable ASCII characters

- [#20316](https://github.com/LedgerHQ/ledger-live/pull/20316) [`36a08f1`](https://github.com/LedgerHQ/ledger-live/commit/36a08f1aea939fc42e7dafd8d734ef8dce88d7d0) Thanks [@deepyjr](https://github.com/deepyjr)! - Add address label validation and flow

- [#20222](https://github.com/LedgerHQ/ledger-live/pull/20222) [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3) Thanks [@deepyjr](https://github.com/deepyjr)! - Model contact address labels with asset defaults and per-contact uniqueness

- [#20252](https://github.com/LedgerHQ/ledger-live/pull/20252) [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Me contact detail by default with Me display-name formatting and external address CTA.

- [#20348](https://github.com/LedgerHQ/ledger-live/pull/20348) [`e7a22a6`](https://github.com/LedgerHQ/ledger-live/commit/e7a22a6e3c8c444640cfe8df88637ecad738e26a) Thanks [@deepyjr](https://github.com/deepyjr)! - Standardize contact validation error contracts.

- [#20379](https://github.com/LedgerHQ/ledger-live/pull/20379) [`9d56877`](https://github.com/LedgerHQ/ledger-live/commit/9d568778b657961ef06ba04d5fa616677afec7b8) Thanks [@deepyjr](https://github.com/deepyjr)! - Standardize Contacts validation input schemas and error names

- [#20321](https://github.com/LedgerHQ/ledger-live/pull/20321) [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58) Thanks [@deepyjr](https://github.com/deepyjr)! - Block duplicate Contacts names before creation

## 0.4.0

### Minor Changes

- [#20065](https://github.com/LedgerHQ/ledger-live/pull/20065) [`91da072`](https://github.com/LedgerHQ/ledger-live/commit/91da072ea17f564824d6c04d13934ec88d86d348) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared contact address detail view model with selected address payload, QR payload string, and not-found state.

## 0.4.0-next.0

### Minor Changes

- [#20065](https://github.com/LedgerHQ/ledger-live/pull/20065) [`91da072`](https://github.com/LedgerHQ/ledger-live/commit/91da072ea17f564824d6c04d13934ec88d86d348) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared contact address detail view model with selected address payload, QR payload string, and not-found state.

## 0.3.0

### Minor Changes

- [#19830](https://github.com/LedgerHQ/ledger-live/pull/19830) [`d7f59ec`](https://github.com/LedgerHQ/ledger-live/commit/d7f59ecfa0e7a549b0206042738244ec89c68b95) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Expose shared add-contact invalid name validation state

## 0.3.0-next.0

### Minor Changes

- [#19830](https://github.com/LedgerHQ/ledger-live/pull/19830) [`d7f59ec`](https://github.com/LedgerHQ/ledger-live/commit/d7f59ecfa0e7a549b0206042738244ec89c68b95) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Expose shared add-contact invalid name validation state

## 0.2.0

### Minor Changes

- [#19563](https://github.com/LedgerHQ/ledger-live/pull/19563) [`5bada3c`](https://github.com/LedgerHQ/ledger-live/commit/5bada3c49491daa95ee59cf06df1022141b864a2) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the empty Contacts list view model and validate contact text fields.

- [#19387](https://github.com/LedgerHQ/ledger-live/pull/19387) [`e89bc86`](https://github.com/LedgerHQ/ledger-live/commit/e89bc86cc3daa0e38c43fbd933c233c840a9a657) Thanks [@deepyjr](https://github.com/deepyjr)! - Create the Contacts domain entity package.

- [#19524](https://github.com/LedgerHQ/ledger-live/pull/19524) [`5890c95`](https://github.com/LedgerHQ/ledger-live/commit/5890c951b33708923b6ae646ec5a2ea278f6982f) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Contacts local state, mutations, and selectors.

- [#19613](https://github.com/LedgerHQ/ledger-live/pull/19613) [`b48b348`](https://github.com/LedgerHQ/ledger-live/commit/b48b3485eb7ddbc6733435099b39fa641bfad8d1) Thanks [@deepyjr](https://github.com/deepyjr)! - Flatten the Contacts entity source structure.

- [#19438](https://github.com/LedgerHQ/ledger-live/pull/19438) [`94b454b`](https://github.com/LedgerHQ/ledger-live/commit/94b454bd9676198c49ee4c4c0c49063e87175f70) Thanks [@deepyjr](https://github.com/deepyjr)! - Relax Contact address schema to store currency-specific addresses as generic non-empty strings.

## 0.2.0-next.0

### Minor Changes

- [#19563](https://github.com/LedgerHQ/ledger-live/pull/19563) [`5bada3c`](https://github.com/LedgerHQ/ledger-live/commit/5bada3c49491daa95ee59cf06df1022141b864a2) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the empty Contacts list view model and validate contact text fields.

- [#19387](https://github.com/LedgerHQ/ledger-live/pull/19387) [`e89bc86`](https://github.com/LedgerHQ/ledger-live/commit/e89bc86cc3daa0e38c43fbd933c233c840a9a657) Thanks [@deepyjr](https://github.com/deepyjr)! - Create the Contacts domain entity package.

- [#19524](https://github.com/LedgerHQ/ledger-live/pull/19524) [`5890c95`](https://github.com/LedgerHQ/ledger-live/commit/5890c951b33708923b6ae646ec5a2ea278f6982f) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Contacts local state, mutations, and selectors.

- [#19613](https://github.com/LedgerHQ/ledger-live/pull/19613) [`b48b348`](https://github.com/LedgerHQ/ledger-live/commit/b48b3485eb7ddbc6733435099b39fa641bfad8d1) Thanks [@deepyjr](https://github.com/deepyjr)! - Flatten the Contacts entity source structure.

- [#19438](https://github.com/LedgerHQ/ledger-live/pull/19438) [`94b454b`](https://github.com/LedgerHQ/ledger-live/commit/94b454bd9676198c49ee4c4c0c49063e87175f70) Thanks [@deepyjr](https://github.com/deepyjr)! - Relax Contact address schema to store currency-specific addresses as generic non-empty strings.
