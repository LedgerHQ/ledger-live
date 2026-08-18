# @features/flow-pay-card-auth

## 0.3.0-next.0

### Minor Changes

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

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

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005), [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd)]:
  - @domain/api-card-management@0.2.0-next.0

## 0.2.0

### Minor Changes

- [#20404](https://github.com/LedgerHQ/ledger-live/pull/20404) [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the legacy Pay Card placeholders with the shared authentication flow on desktop and mobile

- [#20459](https://github.com/LedgerHQ/ledger-live/pull/20459) [`6258380`](https://github.com/LedgerHQ/ledger-live/commit/62583805c47b3af4724f6cf693f209c7744228bc) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Split Pay Card authentication configuration and entry points by platform

- [#20489](https://github.com/LedgerHQ/ledger-live/pull/20489) [`e1e005d`](https://github.com/LedgerHQ/ledger-live/commit/e1e005daff0d3e01ef397ac752cbc711245539a7) Thanks [@ysitbon](https://github.com/ysitbon)! - Take the shared flow jest configuration from `@support/jest-features-flow` instead of `@features/platform-jest-config`. The package moved to the `support/` layer, which is where development-only tooling belongs; its API is unchanged.

- [#20495](https://github.com/LedgerHQ/ledger-live/pull/20495) [`6694d77`](https://github.com/LedgerHQ/ledger-live/commit/6694d77f1fc4a691e2d97a2d44e8bf9513cecb1e) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Fix platform-specific CardLogin entry point detection

### Patch Changes

- Updated dependencies [[`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c)]:
  - @domain/entity-pay-card@0.3.0
  - @domain/api-pay-card@0.2.1

## 0.2.0-next.0

### Minor Changes

- [#20404](https://github.com/LedgerHQ/ledger-live/pull/20404) [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the legacy Pay Card placeholders with the shared authentication flow on desktop and mobile

- [#20459](https://github.com/LedgerHQ/ledger-live/pull/20459) [`6258380`](https://github.com/LedgerHQ/ledger-live/commit/62583805c47b3af4724f6cf693f209c7744228bc) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Split Pay Card authentication configuration and entry points by platform

- [#20489](https://github.com/LedgerHQ/ledger-live/pull/20489) [`e1e005d`](https://github.com/LedgerHQ/ledger-live/commit/e1e005daff0d3e01ef397ac752cbc711245539a7) Thanks [@ysitbon](https://github.com/ysitbon)! - Take the shared flow jest configuration from `@support/jest-features-flow` instead of `@features/platform-jest-config`. The package moved to the `support/` layer, which is where development-only tooling belongs; its API is unchanged.

- [#20495](https://github.com/LedgerHQ/ledger-live/pull/20495) [`6694d77`](https://github.com/LedgerHQ/ledger-live/commit/6694d77f1fc4a691e2d97a2d44e8bf9513cecb1e) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Fix platform-specific CardLogin entry point detection

### Patch Changes

- Updated dependencies [[`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c)]:
  - @domain/entity-pay-card@0.3.0-next.0
  - @domain/api-pay-card@0.2.1-next.0
