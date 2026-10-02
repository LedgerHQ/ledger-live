# Analytics (mobile)

## Shared analytics

Mobile uses the shared packages for analytics: [`@shared/analytics`](../../../shared/analytics/README.md) and [`@shared/analytics-react`](../../../shared/analytics-react/README.md).

`~/analytics` imports are historical compatibility shims and will be removed with [LIVE-35992](https://ledgerhq.atlassian.net/browse/LIVE-35992). New code should call the shared packages directly.

## Setup

[`src/analytics/segment.ts`](../src/analytics/segment.ts) wires in the React Native Segment client:

- `start(store)` creates the client and registers it (`setAnalytics`, `setEnabledFn`, extra props)
- `updateIdentify` sends Segment identify traits, including after consent changes

## Debug

The [`AnalyticsConsole`](../src/components/AnalyticsConsole/index.tsx) can be switched on via `ANALYTICS_CONSOLE` (see [Environment variables](../README.md#environment-variables)). It can also be toggled via settings in the app:

Settings → Debug → Configuration
