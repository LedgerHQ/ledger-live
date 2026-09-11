# @shared/analytics

> [!CAUTION]
>
> **Status: WIP** — New package for LIVE-37157. Delete this note once the work is complete.

Shared `track` for Ledger Wallet apps. Each app registers its own analytics client (e.g. Segment), consent check, and extra props.

## Example Setup

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

setEnabledFn(() => analyticsEnabledSelector(store.getState()));
setExtraPropsFn(() => analyticsExtraPropsSelector(store.getState()));
setMandatoryExtraPropsFn(() =>
  analyticsMandatoryPropsSelector(store.getState())
);
setPropsFilter((props) => yourFilter(props));
setAnalytics({
  track: (event, props) => {
    void segment.track(event, props);
  },
  log: console.log,
});

// track events
track("Your Event", { foo: "bar" });

// subscribe to the event bus, e.g. for a dev console
const myDebugging: LoggableEvent[] = [];
const sub = analyticsEvents$.subscribe((event) => myEvents.push(event));
const unsubscribe = sub.unsubscribe;
```

Tracking is off until enabled explicitly. Pass `{ mandatory: true }` to skip that check.

```ts
track("Mandatory Event", { foo: "bar" }, { mandatory: true });
```

`track` is generally fire-and-forget. Delivery status is published on `analyticsEvents$`. When you need to wait until an event is enqueued await the call.

```ts
await track("Your Event", { foo: "bar" });
```

Extra props and the registered analytics client may be sync or async.

Extra props override event props if they have the same key.
