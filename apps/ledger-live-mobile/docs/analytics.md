# Analytics (mobile)

## Shared analytics

Mobile calls [`@shared/analytics`](../../../shared/analytics/README.md) and [`@shared/analytics-react`](../../../shared/analytics-react/README.md) directly.

```ts
import { track, trackPage } from "@shared/analytics";
import { Track, TrackScreen } from "@shared/analytics-react";
```

`~/analytics` wires the React Native Segment client, consent, and identify. It does not re-export `track`, `trackPage`, `Track`, or `TrackScreen`.

`AnalyticsContext` ([`src/analytics/AnalyticsContext.tsx`](../src/analytics/AnalyticsContext.tsx)) holds the current `source` and `screen` for the app. Read them with `useContext(AnalyticsContext)`.

## Setup

[`src/analytics/segment.ts`](../src/analytics/segment.ts) wires in the React Native Segment client:

- `start(store)` creates the client and registers it (`setAnalytics`, `setEnabledFn`, extra props)
- `updateIdentify` sends Segment identify traits, including after consent changes

## Debug

The [`AnalyticsConsole`](../src/components/AnalyticsConsole/index.tsx) can be switched on via `ANALYTICS_CONSOLE` (see [Environment variables](../README.md#environment-variables)). It can also be toggled via settings in the app:

Settings → Debug → Configuration
