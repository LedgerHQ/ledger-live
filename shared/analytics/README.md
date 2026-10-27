# @shared/analytics

> [!NOTE]
> **Status: STABLE** — `track`, `trackPage`, and the host registry are the contract. Apps register their Segment client and consent here, along with any app-specific filters; they do not re-export `track` or `trackPage`. Import them from this package.

React-free tracking pipeline. React adapters (`Track`, `TrackScreen`) live in [`@shared/analytics-react`](../analytics-react/README.md).

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

## Personal data guard

`deliver` scrubs the event name and props before the client, `log` or `analyticsEvents$` sees them. Apps cannot turn it off.

It finds:

- values under a sensitive key, such as `address`, `xpub`, `signature`, `txHash` or `email`
- value shapes: EVM addresses and hashes, extended public keys, bech32 addresses, Ledger account ids, emails, and the id in explorer `/tx/`, `/address/` and `/account/` links
- the same shapes in property names
- objects more than 8 levels deep, which it does not inspect (`max_depth`)

What happens depends on `NODE_ENV`:

- `development` or `test`: the event is not sent, `analyticsEvents$` gets `blocked_pii`, and `track` rejects with `AnalyticsPiiError`. The error names the paths and kinds, never the values.
- any other value: the event is sent with `[REDACTED:<kind>]` in place of each value, and the published event carries `piiFindings`.

E2E tests can subscribe to `analyticsEvents$` and fail on any event with `piiFindings`.

Do not work around the guard. Send a category, a currency id or a boolean instead of the value.

## Host registration (apps only)

Desktop and mobile register their Segment clients, consent, extra props, and filters in their app `segment.ts`; other hosts such as wallet-cli may register only the callbacks relevant to their runtime.

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
