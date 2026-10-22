# @features/flow-account-detail

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Account Detail page (Wallet 4.0) shared by Ledger Wallet desktop and mobile. Like
`@features/flow-pay-card`, this main package composes one package per shared section:

| Package | Content |
| --- | --- |
| `@features/flow-account-detail-hero` | Balance, quick actions, empty state |
| `@features/flow-account-detail-settings` | Settings menu, advanced logs, remove account |

The sections that depend on `libs/` (custom place, assets, transactions) stay in the apps and are
passed to the layout as slots.

## Exports

| Export | Description |
| --- | --- |
| `AccountDetailLayout` | Lays out the page in Figma order: hero → custom place → assets → transactions (`.web` / `.native`) |
| `useAccountDetailFeature(currencyId)` | `true` when the `accountDetail` flag is on and the currency is not in `excludedCurrencyIds` |
| `isAccountDetailEnabledFor(feature, currencyId)` | Pure version of the gate, for code that already holds the flag |

## Feature flag

`accountDetail` (`@shared/feature-flags`, Firebase key `feature_account_detail`) is decided **per
account**: the apps render the new page for an account whose main currency is not excluded, and
the legacy page otherwise.

```tsx
import { AccountDetailLayout, useAccountDetailFeature } from "@features/flow-account-detail";

const isNewPage = useAccountDetailFeature(mainAccount?.currency.id);
```
