# @shared/analytics

> [!CAUTION]
>
> **Status: WIP** — New package for LIVE-37157. Delete this note once the work is complete.

Shared `track` for Ledger Wallet apps. Each app registers its own analytics client (e.g. Segment), consent check, and extra properties.

## Example Setup

```ts
import {
  setAnalytics,
  setEnabledFunction,
  setExtraPropertiesFunction,
  setMandatoryExtraPropertiesFunction,
  setPropertyFilter,
  track,
} from "@shared/analytics";

setEnabledFunction(() => analyticsEnabledSelector(store.getState()));
setExtraPropertiesFunction(() =>
  analyticsExtraPropertiesSelector(store.getState())
);
setMandatoryExtraPropertiesFunction(() =>
  analyticsMandatoryPropertiesSelector(store.getState())
);
setPropertyFilter((properties) => yourFilter(properties));

setAnalytics({
  track: (event, properties) => {
    void segment.track(event, properties);
  },
});

track("Your Event", { foo: "bar" });
```

Tracking is off until enabled explicitly. Pass `{ mandatory: true }` to skip that check.

`setExtraPropertiesFunction` and `setMandatoryExtraPropertiesFunction` may be async. Extra properties from the function overwrite the same keys on the caller’s payload.

`trackSubject` provides an event bus (using RxJS) for in-app analytics consoles.
