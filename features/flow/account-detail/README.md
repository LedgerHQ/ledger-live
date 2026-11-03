# @features/flow-account-detail

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Account Detail page (Wallet 4.0) shared by Ledger Wallet desktop and mobile. Like
`@features/flow-pay-card`, this main package composes one package per shared section:

| Package | Content |
| --- | --- |
| `@features/flow-account-detail-hero` | Balance, quick actions, empty state |
| `@features/flow-account-detail-settings` | Settings menu, advanced logs, remove account |
| `@features/flow-account-detail-analytics-notice` | Analytics introduction eligibility and dismissal |

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

## Tracking

The tracking plan of the page ([Account detail - Tracking Plan](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7644020738)) is
encoded here, so Ledger Wallet desktop and mobile send the same events with the same properties.
The module is **pure**: it builds payloads, the apps call `track(...)` from their view models or
hooks (never from a view).

| Export | Description |
| --- | --- |
| `ACCOUNT_DETAIL_PAGES` | The `page` values: `Account`, `Account Settings`, `Remove Account` |
| `ACCOUNT_DETAIL_EVENTS` | Event names: `Page Account`, `Page Account Settings`, `button_clicked`, `transaction_clicked`, `asset_clicked` |
| `ACCOUNT_DETAIL_BUTTONS` | The `button` values that are not quick actions (`see all transactions`, `account settings`, `edit account name`...) |
| `accountTrackingProps(facts)` | `{ currency, isTokenAccount }`, on every payload. `currency` is the currency **id**, on both apps |
| `accountPageViewProps(facts)` | `Page Account`: `source`, `operationsCount`, `hasTokens` |
| `accountSettingsPageViewProps(facts)` | `Page Account Settings`, from the account page |
| `quickActionClickedProps(facts, button, location)` | Quick actions; `location` is `quick_action` or `quick_action_transfer` |
| `accountButtonClickedProps(facts, button, page)` | Every other `button_clicked` |
| `accountAssetClickedProps`, `accountTransactionClickedProps`, `accountPullToRefreshProps` | `asset_clicked`, `transaction_clicked`, pull to refresh |

`facts` is `{ currencyId, isTokenAccount }`: plain values, no app type.

```ts
import { ACCOUNT_DETAIL_EVENTS, quickActionClickedProps } from "@features/flow-account-detail";

track(ACCOUNT_DETAIL_EVENTS.buttonClicked, quickActionClickedProps(facts, "send"));
```

Two rules of the plan: the page value is `Account` (not `Account Detail`) and the flows started from
the page carry `source: Account`; and an old event that conflicts with a new one is not sent on the
new page (the legacy page keeps its events).

