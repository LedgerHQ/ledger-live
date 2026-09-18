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

Public API is the container and `CardAssetsProps`. The orchestrator
([`@features/flow-pay-card`](../pay-card/README.md)) mounts this when the host passes `assets`.

## Dialogs and history

Tapping a row opens `CardAssetDetailsDialog`; "Withdraw" opens `CardAssetDetailsWithdrawDialog` on
top of it, and closing the withdraw dialog returns to the details one.

The details dialog previews the asset's last 3 transactions and leaves the section out when empty.
There is no server-side asset filter: the view model filters the fetched list with
`isCardTransactionFundedBy` from
[`@features/flow-pay-card-transactions`](../pay-card-transactions/README.md), the one predicate the
history route uses too, keyed on the row's Ledger currency id. A wallet the catalog does not resolve
lists nothing.

"Transactions" hands the asset back through `onShowHistory` and closes the dialogs: history is a host
route, not a dialog. In Ledger Wallet Desktop that route is `/history?tab=card&asset=<ledgerId>`, the
existing card history page ([`@features/flow-pay-card-transactions`](../pay-card-transactions/README.md)),
which the `asset` param scopes to one asset. There is no asset-specific history component.

## MVVM

- `useCardAssetsViewModel` (private) reads linked wallets and builds rows.
- `CardAssetsView.web.tsx` / `CardAssetsView.native.tsx` are the presentational views.
- `CardAssets` wires the hook to the platform view.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-card-assets/
├── package.json
└── src/
    ├── CardAssets.tsx
    ├── CardAssetsView.web.tsx
    ├── CardAssetsView.native.tsx
    ├── useCardAssetsViewModel.ts
    ├── types.ts
    ├── index.ts
    └── index.native.ts
```
