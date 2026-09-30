# Pay analytics

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Shared Pay tracking helpers for Desktop and Mobile. Trackers are module-level functions built on
`@shared/analytics`, which each app configures at startup. There is no provider and no context: a
Pay screen imports the tracker it needs, so tracking keeps working inside portalled UI such as
`@gorhom/bottom-sheet` modals, where React context from the Pay navigator is not reachable.

```tsx
import { trackButtonClicked, PayTrackPage } from "@features/platform-pay-analytics";

trackButtonClicked({ button: "verify", page: "Request complete", flow: "request" });
```

`PayTrackPage` fires the page view for the mounted screen. It resolves per platform: `TrackPage` on
web, `TrackScreen` on native (the same component LWM uses in drawers). Native sheets still have
navigation context because `BottomSheetModalProvider` sits inside `NavigationContainer`.

```tsx
<PayTrackPage page="Feature Intro" name={flow} flow={flow} />
```

Each tracker takes a typed property object and owns its event name, so a call site never repeats a
literal event or button name. `createPayAnalyticsHelper` holds those literals and is covered by
`src/__tests__/createPayAnalyticsHelper.test.ts`.

## Testing

Feature and app tests must not hit the real trackers. Mock the package with the test double
shipped at `@features/platform-pay-analytics/testing/module-mock`, which exposes every tracker as a
`jest.fn()` plus a `trackedPages()` helper returning the props of every rendered `PayTrackPage`.

```ts
import { trackButtonClicked } from "@features/platform-pay-analytics/testing/module-mock";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);
```
