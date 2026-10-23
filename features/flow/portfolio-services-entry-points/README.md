# @features/flow-portfolio-services-entry-points

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Services entry points (Perps, Borrow) displayed as tiles on the Ledger Wallet portfolio, between
the Crypto and Stablecoins sections. They replace the Perps and Borrow banners behind an A/B test.

## Exports

| Export | Description |
| --- | --- |
| `ServicesEntryPoints` | The tiles, in the flag order. Tracks `button_clicked` and calls `onOpenService(service)` (`.web` / `.native`) |
| `useServicesEntryPointsFeature()` | `{ isEnabled, services }`: apps hide the legacy entry points when `isEnabled` |
| `getServicesEntryPointsAttributes(flag)` | Analytics properties for the A/B test |

## Feature flag

`entryPointsServices` (`@shared/feature-flags`, team Wallet XP):

- `enabled` shows the section and hides the legacy Perps and Borrow entry points.
- `params.services` sets which services are shown and their order, e.g. `["borrow", "perps"]`.

A service is shown only when its own feature is on: `ptxPerpsLiveApp` on desktop,
`ptxPerpsLiveAppMobile` on mobile, `ptxBorrowLiveApp` on both.

## Usage

```tsx
import { ServicesEntryPoints } from "@features/flow-portfolio-services-entry-points";

<ServicesEntryPoints page="Portfolio" onOpenService={service => navigateTo(service)} />;
```

Navigation stays in each app. Wording keys live under `servicesEntryPoints` in each app catalog.
