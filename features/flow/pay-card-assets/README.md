# @features/flow-pay-card-assets

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Pay tab **Assets** list for the card: the wallets linked to the card, with name, ticker, icon,
crypto amount, and countervalue.

Data comes from [`@features/flow-pay-card-wallets`](../pay-card-wallets/README.md). The section hides
while nobody is signed in (`useIsCardSignedIn` from
[`@features/flow-pay-card-auth`](../pay-card-auth/README.md)). Pricing stays with the host: rates live
in each app, so callers pass `currencies`, `priceWallet`, and `formatCountervalue`.

## Usage

```tsx
import { CardAssets } from "@features/flow-pay-card-assets";

<CardAssets
  currencies={currencies}
  priceWallet={priceWallet}
  formatCountervalue={formatCountervalue}
/>;
```

Public API is the container, `CardAssetsProps`, and `useCardWalletsTotal`. The orchestrator
([`@features/flow-pay-card`](../pay-card/README.md)) mounts this when the host passes `assets`, and
reads `useCardWalletsTotal(assets, isSignedIn)` for the balance on the card face: the provider
answers no total, so it sums what the same wallets query already carries. A wallet nothing could
price adds nothing to it.

## Dialogs and history

On web, `useCardAssetDialogs` holds which dialog is open and the selected asset. Mobile keeps no
such state here: the Card details sheet routes each asset scene and carries the asset in its route.
Both call `onManageOpen` / `onManageClose` so a changed debit order is tracked the same way.

Tapping a row opens `CardAssetDetailsDialog`; "Withdraw" opens `CardAssetDetailsWithdrawDialog` on
top of it, and closing the withdraw dialog returns to the details one.

The details dialog previews the asset's last 3 transactions. With none, it drops the Transactions
header and shows Card's empty state instead — the contacts layout, a `CreditCard` `Spot` above
`payTab.cardTransactions.history.empty.title` ("No card transactions yet").
There is no server-side asset filter: the view model filters the fetched list with
`isCardTransactionFundedBy` from
[`@features/flow-pay-card-transactions`](../pay-card-transactions/README.md), the one predicate the
history route uses too. Unknown `currency`/`network` pairs list nothing.

"Transactions" hands the asset back through `onShowHistory` and closes the dialogs: history is a host
route, not a dialog. In Ledger Wallet Desktop that route is `/history?tab=card&asset=<ticker>`, the
existing card history page ([`@features/flow-pay-card-transactions`](../pay-card-transactions/README.md)),
which the `asset` param scopes to one asset. There is no asset-specific history component.

## MVVM

- `useCardAssetsViewModel` reads linked wallets and builds rows. It holds no dialog state.
- `useCardAssetDialogs.web.ts` owns the web dialog state on top of it.
- `CardAssetsView.web.tsx` / `CardAssetsView.native.tsx` are the presentational views.
- `CardAssets` (web) wires the hook to the web view.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-card-assets/
├── package.json
└── src/
    ├── CardAssets.web.tsx
    ├── CardAssetsView.web.tsx
    ├── CardAssetsView.native.tsx
    ├── useCardAssetsViewModel.ts
    ├── useCardAssetDialogs.web.ts
    ├── types.ts
    ├── index.ts
    └── index.native.ts
```
