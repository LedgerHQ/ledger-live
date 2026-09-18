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
