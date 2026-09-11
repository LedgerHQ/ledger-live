# @shared/analytics

> [!CAUTION]
>
> **Status: WIP** — New package for LIVE-37157. Delete this note once the work is complete.

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

// subscribe to the event bus, e.g. for a dev console
const myDebug: LoggableEvent[] = [];
const sub = analyticsEvents$.subscribe((event) => myDebug.push(event));
const unsubscribe = () => sub.unsubscribe();
```

### Enabling and mandatory

Tracking is off until enabled explicitly with `setEnabledFn`.

In the example above it is switched on by default but more often you will store user consent in some dynamic state. In this case, pass a selector for that state, e.g.

```ts
setEnabledFn(() => myAnalyticsEnabledSelector(store.getState()));
```

For events that do not require consent use the mandatory option, e.g.

```ts
track("Mandatory Event", { foo: "bar" }, { mandatory: true });
```

### Async and await

`track` can be fire-and-forget – async enrichment and delivery will run inside the package. The final delivery status is published on `analyticsEvents$`.

When you need to wait until an event is enqueued, await the call, e.g.

```ts
await track("My Crucial Event", { foo: "bar" });
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
