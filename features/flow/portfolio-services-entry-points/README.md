# @features/flow-portfolio-services-entry-points

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Services entry points (Perps, Borrow) displayed as Lumen cards on the Ledger Wallet portfolio, between
the Crypto and Stablecoins sections. They replace the Perps and Borrow banners behind an A/B test.

## Exports

| Export | Description |
| --- | --- |
| `ServicesEntryPoints` | The cards, in the flag order. Tracks `button_clicked` and calls `onOpenService(service)`. Its view is split in `.web` / `.native` |
| `ServicesEntryPointsProps` | `{ page, onOpenService }` |
| `useServicesEntryPointsFeature()` | `ServicesEntryPointsFeature`: `{ isEnabled, services }`. Apps hide the legacy entry points when `isEnabled` |
| `getServicesEntryPointsAttributes(flag)` | Analytics properties for the A/B test |
| `ServiceEntryPointId` | `"perps" \| "borrow"` |

## Feature flag

`entryPointsServices` (`@shared/feature-flags`, team Wallet XP):

- `enabled` shows the section and hides the legacy Perps and Borrow entry points. It only applies
  with the Wallet 4.0 asset section (`lwdWallet40` / `lwmWallet40` `assetSection`): without it there
  is no Crypto and Stablecoins section, so the legacy entry points stay.
- `params.services` sets which services are shown and their order, e.g. `["borrow", "perps"]`.
  Without `params`, the default order applies.

A service is shown only when its own feature is on: `ptxPerpsLiveApp` on desktop,
`ptxPerpsLiveAppMobile` on mobile, `ptxBorrowLiveApp` on both.

## Usage

```tsx
import { ServicesEntryPoints } from "@features/flow-portfolio-services-entry-points";

<ServicesEntryPoints page="Portfolio" onOpenService={openService} />;
```

Navigation stays in each app. Wording keys live under `servicesEntryPoints` in each app catalog.
