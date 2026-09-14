# @shared/analytics

> [!CAUTION]
>
> **Status: UNSTABLE** — New package for LIVE-37157. Delete this note once the work is complete.

Shared `track` for Ledger Wallet apps. Each app registers its own analytics client (e.g. Segment), consent check, and extra props.

## Getting started

### Example setup

```ts
import {
  analyticsEvents$,
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
  track: (event, props) => segment.track(event, props),
  log: console.log,
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

### Track

`track` emits events with a payload of props, e.g.

```ts
track("Your Event", { foo: "bar" });
```

### Track Page

`trackPage` emits events named `Page ${category} ${name}` and a payload of props.

```ts
trackPage({
  category: "Modal send",
  name: "step recipient",
  props: { flow: "send" },
});
```

### Enabling and mandatory

Tracking is off until enabled explicitly with `setEnabledFn`.

In the example above it is switched on by default but more often you will store user consent in some dynamic state. In this case, pass a selector for that state, e.g.

```ts
setEnabledFn(() => myAnalyticsEnabledSelector(store.getState()));
```

### Async and await

`track` can be fire-and-forget – async enrichment and delivery will run inside the package. The final delivery status is published on `analyticsEvents$`.

When you need to wait until an event is enqueued, await the call, e.g.

```ts
await track("My Crucial Event", { foo: "bar" });
await trackPage({ category: "Market" });
```

The registered analytics client may be sync or async.

### Filtering and enriching

Use `setPropsFilter` if you need to check your payload for sensitive data before tracking and use `setExtraPropsFn` and `setMandatoryExtraPropsFn` to add props to every payload, e.g.

```ts
setPropsFilter(scrubSensitive);
setExtraPropsFn(() => ({ appVersion: "1.2.3" }));

await track("track", { theme: "light", sensitive: "from-enricher" });

analyticsEvents$.subscribe((event) => {
  console.log(event.eventProps);
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

### Additional options

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
  }
);
```

#### General options – for `track` and `trackPage`

- `mandatory` – for events that do not require consent and should always be sent

#### Route options: for `trackPage`

- `avoidDuplicates` - to avoid resend the same event when a component mounts repeatedly
- `updateRoutes` and `refreshSource` – to keep `page` and `source` values up to data
