# @features/flow-pay-card-assets

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Pay tab **Assets** list for the card: the linked wallets, formatted as crypto amounts.

Data comes from [`@features/flow-pay-card-wallets`](../pay-card-wallets/README.md). The section hides
while nobody is signed in (`useIsCardSignedIn` from
[`@features/flow-pay-card-auth`](../pay-card-auth/README.md)).

## Usage

```tsx
import { CardAssets } from "@features/flow-pay-card-assets";

<CardAssets />;
```

Public API is the container. Desktop lists each linked wallet as icon + ticker, with `balance` +
ticker on the trailing side (`125.40 USDC`; no trailing amount when unknown). Native still renders
`null`.

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
