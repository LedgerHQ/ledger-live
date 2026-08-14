# @features/flow-pay-card-auth

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
