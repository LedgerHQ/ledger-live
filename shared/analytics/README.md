# @shared/analytics

> [!CAUTION]
>
> **Status: WIP** — New package for LIVE-37157. Delete this note once the work is complete.

Shared `track` for Ledger Wallet apps. Each app registers its own analytics client (e.g. Segment), consent check, and extra props.

## Example Setup

```ts
import {
  setAnalytics,
  setEnabledFn,
  setExtraPropsFn,
  setMandatoryExtraPropsFn,
  setPropsFilter,
  track,
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
});

void track("Your Event", { foo: "bar" });
```

`track` is async. Callers can fire-and-forget with `void track(...)` or `await track(...)` when they need to wait for enrichment and delivery.

Tracking is off until enabled explicitly. Pass `{ mandatory: true }` to skip that check.

Extra props and the registered analytics client may be sync or async; `track` awaits both. Extra props from the function overwrite the same keys on the caller’s payload.

`analyticsEvents$` is a read-only RxJS stream for in-app diagnostic (success, skip and failure events).
