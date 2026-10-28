# @features/flow-account-detail-hero

## 0.2.0-next.0

### Minor Changes

- [#23761](https://github.com/LedgerHQ/ledger-live/pull/23761) [`35233dc`](https://github.com/LedgerHQ/ledger-live/commit/35233dc9e0f3389644536070fc3b9a2624d79826) Thanks [@LucasWerey](https://github.com/LucasWerey)! - LWD Account Detail shows the account hero: the account balance (native and token sub-accounts countervalue) and the Receive · Send · Buy · Sell · Earn quick actions. The hero package exposes web views through a new `./web` entry, including an account-scoped asset picker dialog. On desktop, Sell is now hidden when the currency is not on the ramp, like Buy. Both apps now build the hero port with shared `useAvailableAssetsByAction` and `useAccountHeroStatus` hooks from the hero package.

- [#23811](https://github.com/LedgerHQ/ledger-live/pull/23811) [`7077a0a`](https://github.com/LedgerHQ/ledger-live/commit/7077a0ac3e17ba9922562ca286232bd7c475a4f4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - LWD Account Detail shows the swap console in the right panel, prefilled with the account. It is gated by the `accountDetail` flag (not the swap-console A/B test) and hidden when the currency is unsupported or no asset of the account can be swapped. `resolveSwapConsole` only needs the currency support and swap availability.

- [#23616](https://github.com/LedgerHQ/ledger-live/pull/23616) [`fab7c15`](https://github.com/LedgerHQ/ledger-live/commit/fab7c1541531f1f50efbc0c3efec1fbecda63ff9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail hero logic: `AccountHeroPort` (balance, availability, funds, activity, `onAction` injected by each app) and `useAccountHeroViewModel`, which resolves the account-scoped quick actions and the mobile tile layout from `@features/platform-quick-actions` and owns the More sheet state. Also `resolveSwapConsole` and `resolveEmptyState`.

- [#23617](https://github.com/LedgerHQ/ledger-live/pull/23617) [`102829a`](https://github.com/LedgerHQ/ledger-live/commit/102829a0c606564a8d36541391fac354ffb5b0cc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Native Account Detail hero: `AccountHero` renders the balance (Lumen `AmountDisplay`, discreet mode, loading), the quick-action tiles from `layoutQuickActionTiles`, and the More sheet (Buy · Sell · Earn) on `@shared/ui-queued-bottom-sheet`.

- [#23861](https://github.com/LedgerHQ/ledger-live/pull/23861) [`5b0e4e1`](https://github.com/LedgerHQ/ledger-live/commit/5b0e4e112e84cc236adea3fad7d2dba119286aac) Thanks [@LucasWerey](https://github.com/LucasWerey)! - The hero package exposes `AccountEmptyState` (`./web` and `./native`): a Lumen `Spot` with the coins icon, "No activity yet" and a description of the funding actions available on the account (Receive, Swap, Buy), one full sentence per combination. Both apps get the English copy. The empty-state rule model is renamed `AccountEmptyStateModel`.

- [#23854](https://github.com/LedgerHQ/ledger-live/pull/23854) [`292b712`](https://github.com/LedgerHQ/ledger-live/commit/292b7129a233b43150c9c452b0efb20629a0bb58) Thanks [@LucasWerey](https://github.com/LucasWerey)! - The account hero balance comes from a shared `useAccountCountervalue` hook in `@features/flow-account-detail-hero`: the apps only inject their countervalue callback. On LWM, an account whose assets are all empty now shows `$0.00`, like LWD, and a funded asset without a quote no longer counts as a known zero.

- [#23888](https://github.com/LedgerHQ/ledger-live/pull/23888) [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065) Thanks [@zel-kass](https://github.com/zel-kass)! - Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.

### Patch Changes

- Updated dependencies [[`35233dc`](https://github.com/LedgerHQ/ledger-live/commit/35233dc9e0f3389644536070fc3b9a2624d79826), [`55a8889`](https://github.com/LedgerHQ/ledger-live/commit/55a88899741201271f070f7e79995f110817d677), [`93b62c3`](https://github.com/LedgerHQ/ledger-live/commit/93b62c317f1aeb5666f74ae91bff9d589c5ac1d5), [`a8a7b16`](https://github.com/LedgerHQ/ledger-live/commit/a8a7b163245a4efc1e1e4bb6869f34f66b8d43e2), [`9092dc3`](https://github.com/LedgerHQ/ledger-live/commit/9092dc350ccb833de3bd9b4254408a98cd264645), [`5eed48e`](https://github.com/LedgerHQ/ledger-live/commit/5eed48ed200b672ba41afb663c6b648628ebaf3e)]:
  - @features/platform-quick-actions@0.1.0-next.0
  - @shared/ui-queued-bottom-sheet@0.8.0-next.0
  - @shared/i18n@0.2.0

## 0.1.0

### Minor Changes

- [#23363](https://github.com/LedgerHQ/ledger-live/pull/23363) [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail packages: `@features/flow-account-detail` (layout and `accountDetail` flag gate), `@features/flow-account-detail-hero` and `@features/flow-account-detail-settings` skeletons.

## 0.1.0-next.0

### Minor Changes

- [#23363](https://github.com/LedgerHQ/ledger-live/pull/23363) [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail packages: `@features/flow-account-detail` (layout and `accountDetail` flag gate), `@features/flow-account-detail-hero` and `@features/flow-account-detail-settings` skeletons.
