# @shared/analytics

> [!NOTE]
> **Status: STABLE** — `track`, `trackPage`, and the host registry are the contract. App re-export barrels stay until [LIVE-35992](https://ledgerhq.atlassian.net/browse/LIVE-35992). New code imports this package, not those barrels.

React-free tracking pipeline. React adapters (`Track`, `TrackPage`, `TrackScreen`) live in [`@shared/analytics-react`](../analytics-react/README.md).

## Track events

```ts
import { track, trackPage } from "@shared/analytics";

track("Your Event", { foo: "bar" });
await track("Your Crucial Event", { foo: "bar" });

trackPage({
  category: "Modal send",
  name: "step recipient",
  props: { flow: "send" },
});
```

`track` always returns `Promise<void>`. Fire-and-forget still runs enrichment and delivery inside the package. The final status is published on `analyticsEvents$`.

`trackPage` emits `Page ${category} ${name}`.

```ts
track("Mandatory Event", { foo: "bar" }, { mandatory: true });

trackPage(
  { category: "Modal send", name: "step recipient" },
  { avoidDuplicates: true, mandatory: true, refreshSource: true, updateRoutes: true },
);
```

- `mandatory` — send even when consent is off
- `avoidDuplicates` — skip a repeated page event when a screen remounts
- `updateRoutes` and `refreshSource` — keep `page` and `source` on later events

`track` adds `page` from the current tracking page when one is set. Callers can still pass their own `page`.

```ts
import {
  getCurrentTrackingPage,
  getPreviousTrackingPage,
  resetTrackingPages,
  setTrackingSource,
} from "@shared/analytics";

getCurrentTrackingPage({ fallback: "Unknown" });
getPreviousTrackingPage({ fallback: "Portfolio" });
setTrackingSource("Portfolio");
resetTrackingPages();
```

Both getters return `""` when the page is unknown.

## Delivery

Register `Analytics.track` so it **awaits** the vendor SDK. Discarding that promise makes every call look `enqueued` and leaves SDK rejections unobserved.

- no registered client → `skipped_no_client`
- return `"skipped_no_client"` when the SDK instance is missing
- resolve `void` → `enqueued` (do not return the SDK payload)
- return another `DeliveryStatus` to override
- throw or reject → `failed_tracking`

```ts
import { analyticsEvents$, closeAndFlush, flush } from "@shared/analytics";

analyticsEvents$.subscribe(event => console.log(event.deliveryStatus, event.eventProperties));
await flush();
await closeAndFlush();
```

`flush` and `closeAndFlush` resolve without error when no client is registered or the client omits them. Pipeline events include `deliveryStatus`; manually published compatibility events may omit it.

`publishAnalyticsEvent` is deprecated. It exists for unmigrated `updateIdentify` behaviour. New events come from the pipeline.

## Host registration (apps only)

Feature code does not call these. Each app registers its Segment client, consent, extra props, and filter in its `segment.ts`.

```ts
import {
  setAnalytics,
  setEnabledFn,
  setExtraPropsFn,
  setMandatoryExtraPropsFn,
  setPropsFilter,
} from "@shared/analytics";

setEnabledFn(() => trackingEnabledSelector(store.getState()));
setExtraPropsFn(() => extraProperties(store));
setMandatoryExtraPropsFn(() => mandatoryProperties(store));
setPropsFilter(scrubSensitive);

setAnalytics({
  track: async (event, props) => {
    if (!segment) return "skipped_no_client";
    await segment.track(event, props);
  },
  log: console.log,
  flush: () => segment.flush(),
  closeAndFlush: () => segment.closeAndFlush(),
});
```

Tracking stays off until `setEnabledFn` returns true. `mandatory: true` bypasses that check and uses `setMandatoryExtraPropsFn` instead of `setExtraPropsFn`. `setPropsFilter` runs before the client sees the payload.

Consent state lives in [`@domain/entity-analytics-consent`](../../domain/entity/analytics-consent/README.md) and [`@features/flow-analytics-consent`](../../features/flow/analytics-consent/README.md). App wiring: [desktop](../../apps/ledger-live-desktop/docs/analytics.md), [mobile](../../apps/ledger-live-mobile/docs/analytics.md).
