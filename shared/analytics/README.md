# @shared/analytics

> [!CAUTION]
>
> **Status: WIP** — New package for LIVE-37157. Delete this note once the work is complete.

Shared `track` for Ledger Wallet apps. Each app registers its own analytics client (e.g. Segment), consent check, and extra properties.

## Example Setup

```ts
import {
  setAnalytics,
  setAnalyticsStore,
  setEnricher,
  setIsTrackingEnabledSelector,
  setMandatoryEnricher,
  setPropertyFilter,
  track,
} from "@shared/analytics";

setAnalyticsStore(store);
setIsTrackingEnabledSelector((state) => yourSelector(state));
setEnricher((state) => yourExtraProperties(state));
setMandatoryEnricher((state) => yourMandatoryProperties(state));
setPropertyFilter((properties) => yourFilter(properties));

setAnalytics({
  track: (event, properties) => {
    void segment.track(event, properties);
  },
});

track("Your Event", { foo: "bar" });
```

Tracking is off until a store selector says it is enabled. Pass `{ mandatory: true }` to skip that check.

`setEnricher` may be async. Extra properties from the enricher overwrite the same keys on the caller’s payload.

`trackSubject` provides an event bus (using RxJS) for in-app analytics consoles.
