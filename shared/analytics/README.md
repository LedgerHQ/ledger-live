# @shared/analytics

> [!CAUTION]
>
> **Status: WIP** — This is a new package that will be wired in via other tickets (LIVE-35068, LIVE-35069). Once those apps are wired in this note should be deleted.
> **Notes for wiring in:** – `identify` is deliberately absent from the transport: the two apps' `updateIdentify` signatures differ and mobile gates `userId` on its own rules, so identify stays app-side.

The **analytics methods** shared by Ledger Wallet Desktop, Mobile and `wallet-cli`, and utils to setup.

This package is React-free and Redux-free on purpose (since `apps/wallet-cli` doesn't use either). See [`@shared/analytics-react`](../analytics-react/README.md) for consuming the React and Redux components.

Each app owns its own **SDK**, **logger**, **extra properties** and **consent state**, and registers it here. There is no Segment client inside this package – each app brings it's own.

## The pipeline

```text
track / trackPage / trackScreen(event, props, mandatory?)
  → update route refs     (for trackPage and trackScreen only)
  → check consent gate    (uses a registered tracking selector)
  → build the base        (injects `page` from the refs, or `source`, then the caller's props)
  → filter the base       (uses registered property filter)
  → enrich                (uses registered enricher, or the mandatory enricher when `mandatory`)
  → merge                 (extra props win over caller props)
  → transport.track()     (triggers the app registered function)
  → trackSubject.next()   (for dev console to replay events)
```

\*The filter runs on the base only, so it can scrub ref-derived and caller properties but never the enricher's extras.

## Injection points

| Setter                     | Sets                                 | Notes                                                                |
| -------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `setAnalytics(transport)`  | The app's Segment client             | Transport only: no gate, no enrichment, no merge                     |
| `setStore(store)`          | Anything with a `getState()`         | The package never imports Redux or an app `State`                    |
| `setTrackingSelector(fn)`  | Consent gate                         | **While unset, tracking is always enabled** — the CLI relies on this |
| `setEnricher(fn)`          | Normal-path extra properties         | May be async (mobile awaits native permission state)                 |
| `setMandatoryEnricher(fn)` | Consent-safe extra properties        | Used _instead of_ the enricher for mandatory events                  |
| `setPropertyFilter(fn)`    | Optional payload rewrite before send | Defaults to filtering identity                                       |

`setMandatoryEnricher` is **required for correctness**: `mandatory` swaps the property set, it does not merely bypass the gate.
It is safe to omit this setter — mandatory events then carry no extra properties at all — but never register the normal enricher there.

Every setter accepts `undefined` to unregister it.

## Tracking

| Export                                                                                                    | Notes                                                           |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `track(event, properties?, mandatory?)`                                                                   | Returns `void` for a sync enricher, a promise for an async one. |
| `trackPage(category, name?, properties?, updateRoutes?, refreshSource?, mandatory?)`                      | Backs `<TrackPage>` used by React web implementation            |
| `trackScreen(category?, name?, properties?, updateRoutes?, refreshSource?, avoidDuplicates?, mandatory?)` | Backs `<TrackScreen>` used by React native implementation.      |
| `getIsTracking(state, mandatory?)`                                                                        | The consent gate, exported for callers to check.                |
| `flush()` / `closeAndFlush()`                                                                             | Delegate to the transport.                                      |
| `trackSubject`                                                                                            | Dev bus for the in-app analytics consoles.                      |

### The sync fast path

`track` resolves the enricher without forcing a microtask when the enricher is synchronous, so `trackSubject` assertions can still hold synchronously after a render.

**Both halves have to be synchronous.** `emit` also defers `trackSubject.next` whenever `transport.track` returns a thenable, so returning Segment's promise re-introduces the microtask
even with a sync enricher — and `AnalyticsBrowser.track` does return one. A Desktop transport that wants the synchronous guarantee has to drop it:

```ts
setAnalytics({
  track: (event, properties) => void segment.track(event, properties),
});
```

The trade-off is the delivery status: a transport that returns nothing is always reported as
`enqueued`, because there is no longer anything to await before deciding it `failed`.

## `@shared/analytics/screenRefs`

```ts
import {
  currentRouteNameRef,
  getCurrentTrackingPage,
  setTrackingSource,
} from "@shared/analytics/screenRefs";
```

Route names live in the React-free core because the pipeline reads them. They are **ref objects**,
not module-level `let`s: an exported `let` cannot be assigned by an importer, and app code assigns
`currentRouteNameRef.current` directly in around a dozen files — the wallet-API webviews on both
apps, and mobile's global search.

> [!NOTE]
> Exporting the raw refs next to the getters is **interim**. LIVE-36002 narrows this subpath to a
> function-only API — which will need a setter for the current page, not just `setTrackingSource`.

## Behaviour this package unifies

Both apps had drifted; the pipeline picks one behaviour for each divergence.

1. **Route refs update before the consent gate** (Mobile's behaviour). Desktop gated first, so with
   analytics off `getCurrentTrackingPage()` returned `""` to its non-analytics consumers.
2. **Extras win over caller props** (Mobile's `track` / `screen`, Desktop's `trackPage`). Desktop's
   `track` used to let caller props win.
3. **The property filter applies to the whole base** — the ref-derived `page` / `source` as well as
   the caller's props, where previously only the caller's props were scrubbed. It still never sees
   the enricher's extras, which are merged in afterwards.

## Usage

```ts
import {
  setAnalytics,
  setEnricher,
  setMandatoryEnricher,
  setStore,
  setTrackingSelector,
  track,
} from "@shared/analytics";

setStore(store);
setTrackingSelector((state) => trackingEnabledSelector(state as AppState));
setEnricher((state) => extraProperties(state as AppState));
setMandatoryEnricher((state) => getMandatoryProperties(state as AppState));
setAnalytics({
  track: (event, properties) =>
    segment.track(event, properties).then(() => "enqueued" as const),
  flush: () => segment.flush(),
});

track("Some Event", { foo: "bar" });
```
