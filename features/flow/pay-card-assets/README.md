# @features/flow-pay-card-assets

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Pay tab **Assets** list for the card: the wallets linked to the card, formatted as crypto amounts.

Data comes from [`@features/flow-pay-card-wallets`](../pay-card-wallets/README.md). The section hides
while nobody is signed in (`useIsCardSignedIn` from
[`@features/flow-pay-card-auth`](../pay-card-auth/README.md)).

## Usage

```tsx
import { CardAssets } from "@features/flow-pay-card-assets";

<CardAssets />;
```

Public API is the container. Views still render `null` until the desktop/mobile lists land.

## MVVM

- `useCardAssetsViewModel` (private) reads linked wallets and builds rows (`125.40 USDC`; ticker
  only when the balance is unknown).
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
