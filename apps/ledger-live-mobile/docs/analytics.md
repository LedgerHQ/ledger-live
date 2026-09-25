# Analytics (mobile)

How to emit events: [`@shared/analytics`](../../../shared/analytics/README.md) and [`@shared/analytics-react`](../../../shared/analytics-react/README.md).

Existing `~/analytics` imports are compatibility shims. New code imports the packages. [LIVE-35992](https://ledgerhq.atlassian.net/browse/LIVE-35992) removes the barrels.

## What stays in the app

[`src/analytics/segment.ts`](../src/analytics/segment.ts) owns the React Native Segment client:

- `start(store)` creates the client and registers it (`setAnalytics`, `setEnabledFn`, extra props)
- `updateIdentify` sends Segment identify traits, including after consent changes

Debug overlay: `ANALYTICS_CONSOLE` (see [Environment variables](../README.md#environment-variables)) renders [`src/components/AnalyticsConsole`](../src/components/AnalyticsConsole/index.tsx). Settings → Debug → Configuration toggles the same flag.

`Button` and `Touchable` accept `event` and `eventProperties` and call `track` on press. That wrapper is app-only. New call sites that are not those components use `@shared/analytics`.
