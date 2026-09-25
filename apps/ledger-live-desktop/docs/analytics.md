# Analytics (desktop)

How to emit events: [`@shared/analytics`](../../../shared/analytics/README.md) and [`@shared/analytics-react`](../../../shared/analytics-react/README.md).

Existing `~/renderer/analytics/segment`, `Track`, and `TrackPage` imports are compatibility shims. New code imports the packages. The barrel still accepts a positional `trackPage`; the package API is the object form. [LIVE-35992](https://ledgerhq.atlassian.net/browse/LIVE-35992) removes the barrels.

## What stays in the app

[`src/renderer/analytics/segment.ts`](../src/renderer/analytics/segment.ts) owns the Segment web client:

- `startAnalytics(store)` creates the client and registers it (`setAnalytics`, `setEnabledFn`, extra props, `setPropsFilter`)
- `confidentialityFilter` replaces account objects with display names and scrubs account ids from `page` and `source`
- `updateIdentify` sends Segment identify traits. `{ force: true }` sends even when the analytics opt-in is off (for example after "Refuse all")

Debug overlay: `ANALYTICS_CONSOLE` (see [Environment variables](../README.md#environment-variables)) renders [`src/renderer/components/AnalyticsConsole`](../src/renderer/components/AnalyticsConsole/index.tsx). Settings → Developer toggles the same flag. Identify success and failure are logged on that overlay.
