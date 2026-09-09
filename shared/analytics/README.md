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

`track` returns `void` and is fire-and-forget. Enrichment and delivery run asynchronously inside the package.

Tracking is off until enabled explicitly. Pass `{ mandatory: true }` to skip that check.

```ts
track("Mandatory Event", { foo: "bar" }, { mandatory: true });
```

Extra props and the registered analytics client may be sync or async. Extra props from the function overwrite the same keys on the caller’s payload.
