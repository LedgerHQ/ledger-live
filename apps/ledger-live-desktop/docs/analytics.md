# Analytics (desktop)

## Shared analytics

Desktop uses the shared packages for analytics: [`@shared/analytics`](../../../shared/analytics/README.md) and [`@shared/analytics-react`](../../../shared/analytics-react/README.md).

`~/renderer/analytics/segment`, `Track`, and `TrackPage` imports are compatibility shims. New code should import the packages directly. [LIVE-35992](https://ledgerhq.atlassian.net/browse/LIVE-35992) removes the barrels.

## Setup

[`src/renderer/analytics/segment.ts`](../src/renderer/analytics/segment.ts) wires in the Segment web client:

- `startAnalytics(store)` creates the client and registers it (`setAnalytics`, `setEnabledFn`, extra props, `setPropsFilter`)
- `confidentialityFilter` replaces account objects with display names and scrubs account ids from `page` and `source`
- `updateIdentify` sends Segment identify traits. `{ force: true }` sends even when the analytics opt-in is off (for example after "Refuse all")

## Debug

The [`AnalyticsConsole`](../src/renderer/components/AnalyticsConsole/index.tsx) can be switched on via `ANALYTICS_CONSOLE` (see [Environment variables](../README.md#environment-variables)). It can also be toggled via settings in the app:

Settings → Developer
