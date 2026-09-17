# @shared/analytics

> [!CAUTION]
>
> **Status: UNSTABLE** — New package for LIVE-37157. Delete this note once the work is complete.

Shared `track` for Ledger Wallet apps. Each app registers its own analytics client (e.g. Segment), consent check, and extra props.

This package is **React-free**. For React lifecycle adapters (`<Track>`, `<TrackPage>`, `<TrackScreen>`), use [`@shared/analytics-react`](../analytics-react/).

## Getting started

### Example setup

```ts
import {
  analyticsEvents$,
  closeAndFlush,
  flush,
  setAnalytics,
  setEnabledFn,
  setExtraPropsFn,
  setMandatoryExtraPropsFn,
  setPropsFilter,
  track,
  trackPage,
  type LoggableEvent,
} from "@shared/analytics";
// register analytics functions
setEnabledFn(() => true);
setExtraPropsFn(() => myExtraPropsSelector(store.getState()));
setMandatoryExtraPropsFn(() => myMandatoryPropsSelector(store.getState()));
setPropsFilter((props) => myFilter(props));

// register tracking client and logger
setAnalytics({
  track: async (event, props) => {
    if (!segment) return "skipped_no_client";
    await segment.track(event, props);
  },
  log: console.log,
  flush: () => segment.flush(),
  closeAndFlush: () => segment.closeAndFlush(),
});

// track events
track("Your Event", { foo: "bar" });

trackPage({
  category: "Modal send",
  name: "step recipient",
  props: { flow: "send" },
});

// subscribe to the event bus, e.g. for a dev console
const myDebug: LoggableEvent[] = [];
const sub = analyticsEvents$.subscribe((event) => myDebug.push(event));
const unsubscribe = () => sub.unsubscribe();
```

## Functions

### Tracking

`track` emits events with a payload of props, e.g.

```ts
track("Your Event", { foo: "bar" });
```

`trackPage` emits events named `Page ${category} ${name}` and a payload of props.

```ts
trackPage({
  category: "Modal send",
  name: "step recipient",
  props: { flow: "send" },
});
```

### Enabling analytics

Tracking is off until enabled explicitly with `setEnabledFn`.

In the example above it is switched on by default. Often you will store user consent in some dynamic state, in this case pass a selector for that state to `setEnabledFn`, e.g.

```ts
setEnabledFn(() => myAnalyticsEnabledSelector(store.getState()));
```

Mandatory events can be used to bypass the `enabled` state. See [Additional options](#additional-options) below.

`trackPage` emits events named `Page ${category} ${name}`. Use `updateRoutes` and `refreshSource` to keep route refs in sync for subsequent `page` and `source` props on other events.

```ts
trackPage(
  { category: "Modal send", name: "step recipient", props: { flow: "send" } },
  { updateRoutes: true, refreshSource: true },
);

trackPage({ category: "Mandatory Page" }, { mandatory: true });
```

Use `avoidDuplicates: true` when a screen component may remount and emit the same page event twice.

### Async and await

`track` can be fire-and-forget – async enrichment and delivery will run inside the package. The final delivery status is published on `analyticsEvents$`.

When you need to wait until an event is enqueued, await the call, e.g.

```ts
await track("My Crucial Event", { foo: "bar" });
await trackPage({ category: "Market" });
```

`deliver` **awaits** the registered `Analytics.track`. Return its promise (or `async`/`await` the vendor SDK). Discarding that promise makes every call look `enqueued` and leaves SDK rejections unobserved.

- no registered client → `skipped_no_client`
- return `"skipped_no_client"` when the SDK instance is missing
- resolve `void` → `enqueued` (do **not** return the SDK payload — it is not a `DeliveryStatus`)
- return another `DeliveryStatus` to override
- throw or reject → `failed_tracking`

### Flush

`flush` and `closeAndFlush` delegate to the registered analytics client when those methods are provided. They resolve without error when no client is registered or when the client omits them.

```ts
await flush();
await closeAndFlush();
```

### Filtering and enriching

Use `setPropsFilter` if you need to check your payload for sensitive data before tracking and use `setExtraPropsFn` and `setMandatoryExtraPropsFn` to add props to every payload, e.g.

```ts
setPropsFilter(scrubSensitive);
setExtraPropsFn(() => ({ appVersion: "1.2.3" }));

await track("track", { theme: "light", sensitive: "from-enricher" });

analyticsEvents$.subscribe((event) => {
  console.log(event.eventProperties);
});

// { appVersion: "1.2.3", theme: "light" },
```

### Screen refs

```ts
import {
  currentRouteNameRef,
  getCurrentTrackingPage,
  setTrackingSource,
} from "@shared/analytics";
```

Tracking routes are used in analytics to provide props like `page` and `source`. They are **ref objects** (similar to React refs) e.g. `currentRouteNameRef.current`.

`track` adds `page` from `getCurrentTrackingPage()` when a current page is set. Callers can still pass their own `page`.

> [!Note]
> Exporting the raw refs is **interim** – [LIVE-36002](https://ledgerhq.atlassian.net/browse/LIVE-36002) narrows this to a function-only API. Also, names are overly-varied (`screenRef`, `routeName` and `trackingSource`) – [LIVE-37304](https://ledgerhq.atlassian.net/browse/LIVE-37304) addresses ambigious names and duplicate logic

## Analytics Events

`analyticsEvents$` provides `.pipe` and `.subscribe` for reading events logged by analytics. Each event includes `deliveryStatus` (`enqueued`, `failed_tracking`, `skipped_no_client`, and related skip/fail values).

`publishAnalyticsEvent` (DEPRECATED) – this function allows events to be pushed to the `analyticsEvents$` observable directly. Today it is here to support unmigrated behaviour around `updateIdentify` but for more events client apps should use the events pushed to `analyticsEvents$` by the internal workings of the package.

## Additional options

```ts
// Track options
track("Mandatory Event", { foo: "bar" }, { mandatory: true });

// Track Page options
trackPage(
  { category: "Unmissable page" },
  {
    avoidDuplicates: true,
    mandatory: true,
    refreshSource: true,
    updateRoutes: true,
  },
);
```

- `mandatory` – for events that do not require consent and should always be sent
- `avoidDuplicates` - to avoid resend the same event when a component mounts repeatedly
- `updateRoutes` and `refreshSource` – to keep `page` and `source` values up to data
