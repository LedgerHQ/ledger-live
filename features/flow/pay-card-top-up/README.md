# Pay Card Top-up

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Dual-platform flow package for the amount step of the Pay tab **Card top-up**: the body of a Lumen
`Dialog` on desktop and a full screen with an in-app keypad on mobile.

The view is presentational. Each app owns the view model (amounts, fiat/crypto switch, maximum
spendable amount) and the device signing that follows the review.

## Usage

```tsx
import { CardTopUpAmountView } from "@features/flow-pay-card-top-up";

<CardTopUpAmountView {...amountViewModel} />;
```

On mobile, `CardTopUpHeaderTitle` renders the asset and source account in the navigation header.

Copy comes from the `payTab.cardTopUp.*` keys, which both apps ship.
