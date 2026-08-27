# @devtools/pay-card

## 0.4.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

## 0.4.0-next.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

## 0.3.0

### Minor Changes

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

- [#20096](https://github.com/LedgerHQ/ledger-live/pull/20096) [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Integrate the Card API and give its endpoints a domain owner

  `@domain/api-card-management` gains the Card Auth contract: authorize initiation, authorization-code
  exchange, session refresh, logout and the user read, with their zod wire schemas and inferred types.
  They inject into the shared `cardApi` service, so one reducer, one middleware and one cache serve the
  Card backend, and the base query supplies the base URL, `x-client-key` and the `Authorization: Bearer`
  header from the `@features/platform-card` session.

  `@features/flow-pay-card-auth` owns no network contract any more. It keeps the auth-only `payCardAuth`
  slice and the `CardLogin` component; `useCardLoginViewModel` imports its hook from
  `@domain/api-card-management`, and that import is what triggers the injection. `@domain/api-pay-card`
  and its in-process mock transport are removed, along with the Pay Card mocks.

  Pay Card UI Redux state is owned by the feature flows that use it: the balance filter by
  `@features/flow-pay-card-balance` and the feature-tour flag by `@features/flow-pay-card-feature-tour`.

  Only the login step ships here. The callback code exchange and the card status read stay behind until
  the session has an owner that can store and refresh it.

## 0.3.0-next.0

### Minor Changes

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

- [#20096](https://github.com/LedgerHQ/ledger-live/pull/20096) [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Integrate the Card API and give its endpoints a domain owner

  `@domain/api-card-management` gains the Card Auth contract: authorize initiation, authorization-code
  exchange, session refresh, logout and the user read, with their zod wire schemas and inferred types.
  They inject into the shared `cardApi` service, so one reducer, one middleware and one cache serve the
  Card backend, and the base query supplies the base URL, `x-client-key` and the `Authorization: Bearer`
  header from the `@features/platform-card` session.

  `@features/flow-pay-card-auth` owns no network contract any more. It keeps the auth-only `payCardAuth`
  slice and the `CardLogin` component; `useCardLoginViewModel` imports its hook from
  `@domain/api-card-management`, and that import is what triggers the injection. `@domain/api-pay-card`
  and its in-process mock transport are removed, along with the Pay Card mocks.

  Pay Card UI Redux state is owned by the feature flows that use it: the balance filter by
  `@features/flow-pay-card-balance` and the feature-tour flag by `@features/flow-pay-card-feature-tour`.

  Only the login step ships here. The callback code exchange and the card status read stay behind until
  the session has an owner that can store and refresh it.

## 0.2.0

### Minor Changes

- [#20461](https://github.com/LedgerHQ/ledger-live/pull/20461) [`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Card / Pay DevTool foundation package (`@devtools/pay-card`): shared `PayCardToolProps` contract, platform-neutral `usePayCardViewModel`, and registry wiring under the Wallet XP team (LIVE-35496).

- [#20463](https://github.com/LedgerHQ/ledger-live/pull/20463) [`1e0edb4`](https://github.com/LedgerHQ/ledger-live/commit/1e0edb42fd2c8c0e6edc4249f4eb3a13162aea2a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the native UI for the Card / Pay DevTool (`@devtools/pay-card`) built with `@ledgerhq/lumen-ui-rnative`: flags, API mock scenarios, quick states and resets sections (LIVE-35511).

- [#20462](https://github.com/LedgerHQ/ledger-live/pull/20462) [`9c2a85e`](https://github.com/LedgerHQ/ledger-live/commit/9c2a85ef5c1c6a264b53bc3f4581385a250be2ad) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web UI for the Card / Pay DevTool (`@devtools/pay-card`) built with `@ledgerhq/lumen-ui-react`: flags, API mock scenarios, quick states and resets sections (LIVE-35510).

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

## 0.2.0-next.0

### Minor Changes

- [#20461](https://github.com/LedgerHQ/ledger-live/pull/20461) [`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Card / Pay DevTool foundation package (`@devtools/pay-card`): shared `PayCardToolProps` contract, platform-neutral `usePayCardViewModel`, and registry wiring under the Wallet XP team (LIVE-35496).

- [#20463](https://github.com/LedgerHQ/ledger-live/pull/20463) [`1e0edb4`](https://github.com/LedgerHQ/ledger-live/commit/1e0edb42fd2c8c0e6edc4249f4eb3a13162aea2a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the native UI for the Card / Pay DevTool (`@devtools/pay-card`) built with `@ledgerhq/lumen-ui-rnative`: flags, API mock scenarios, quick states and resets sections (LIVE-35511).

- [#20462](https://github.com/LedgerHQ/ledger-live/pull/20462) [`9c2a85e`](https://github.com/LedgerHQ/ledger-live/commit/9c2a85ef5c1c6a264b53bc3f4581385a250be2ad) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web UI for the Card / Pay DevTool (`@devtools/pay-card`) built with `@ledgerhq/lumen-ui-react`: flags, API mock scenarios, quick states and resets sections (LIVE-35510).

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool
