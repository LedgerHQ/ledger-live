# @shared/analytics

> [!CAUTION]
> **Status: UNSTABLE** — New package; consumers are wired in under LIVE-35068 (Desktop) and LIVE-35069 (Mobile).

The **tracking pipeline** shared by Ledger Wallet Desktop, Mobile and `wallet-cli`, plus the screen
refs the pipeline reads.

This package is React-free and Redux-free on purpose: `apps/wallet-cli` is a Node process with
neither, and the hard split against [`@shared/analytics-react`](../analytics-react/README.md) keeps
React out of the CLI bundle.

**Each app keeps owning its Segment SDK**, its logger, its extra properties and its consent state,
and registers them here. There is no Segment client inside this package.

## The pipeline

```text
track(event, props, mandatory?) / trackPage(…) / screen(…)
  → update route refs   (trackPage & screen only, BEFORE the gate — see unification 1 below)
  → consent gate        (registered tracking selector, or always-on when none)
  → build the base      (inject `page` from the refs, or `source`, then the caller's props)
  → filter the base     (registered property filter, e.g. desktop's confidentialityFilter)
  → enrich              (registered enricher, or the mandatory enricher when `mandatory`)
  → merge               (extras win over caller props)
  → transport.track()   (app-owned Segment client)
  → trackSubject.next() (dev bus, with delivery status)
```

The filter runs on the base only, so it can scrub ref-derived and caller properties but never the
enricher's extras.

## Injection points

Every setter takes `undefined` to unregister.

| Setter | Purpose |
| --- | --- |
| `setAnalytics(transport)` | The app's Segment client. Transport only: no gate, no enrichment, no merge. |
| `setStore(store)` | Anything with a `getState()`. The package never imports Redux or an app `State`. |
| `setTrackingSelector(fn)` | Consent gate. **While unset, tracking is always enabled** — the CLI relies on this. |
| `setEnricher(fn)` | Normal-path extra properties. May be async (mobile awaits native permission state). |
| `setMandatoryEnricher(fn)` | Consent-safe extra properties used *instead of* the enricher for mandatory events. |
| `setPropertyFilter(fn)` | Optional payload rewrite before send. Defaults to identity. |

`setMandatoryEnricher` is **required for correctness**: `mandatory` swaps the property set, it does
not merely bypass the gate. It is safe to omit — mandatory events then carry no extra properties at
all — but never register the normal enricher there.

`identify` is deliberately absent from the transport: the two apps' `updateIdentify` signatures
differ and mobile gates `userId` on its own rules, so identify stays app-side.

## Tracking

| Export | Notes |
| --- | --- |
| `track(event, properties?, mandatory?)` | Returns `void` for a sync enricher, a promise for an async one. |
| `trackPage(category, name?, properties?, updateRoutes?, refreshSource?, mandatory?)` | Backs Desktop's `<TrackPage>`. |
| `screen(category?, name?, properties?, updateRoutes?, refreshSource?, avoidDuplicates?, mandatory?)` | Backs Mobile's `<TrackScreen>`. |
| `getIsTracking(state, mandatory?)` | The consent gate, exported for callers that need to check it. |
| `flush()` / `closeAndFlush()` | Delegate to the transport. |
| `trackSubject` | `ReplaySubject<LoggableEvent>(30)` dev bus for the in-app analytics consoles. |

`trackPage` and `screen` both build `` `Page ${category}${name ? " " + name : ""}` `` and send it as
a **track** event — neither app calls Segment's `page()` / `screen()`, and that must not change.

### The sync fast path

`track` resolves the enricher without forcing a microtask when the enricher is synchronous, so
Desktop's `trackSubject` assertions still hold synchronously after a render. Only Mobile's async
enricher makes `track` return a promise.

## `@shared/analytics/screenRefs`

```ts
import { currentRouteNameRef, getCurrentTrackingPage, setTrackingSource } from "@shared/analytics/screenRefs";
```

Route names live in the React-free core because the pipeline reads them. They are **ref objects**,
not module-level `let`s: an exported `let` cannot be assigned by an importer, and at least one
consumer writes `currentRouteNameRef.current` directly.

> [!NOTE]
> Exporting the raw refs next to the getters is **interim**. LIVE-36002 narrows this subpath to a
> function-only API.

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
import { setAnalytics, setEnricher, setMandatoryEnricher, setStore, setTrackingSelector, track } from "@shared/analytics";

setStore(store);
setTrackingSelector(state => trackingEnabledSelector(state as AppState));
setEnricher(state => extraProperties(state as AppState));
setMandatoryEnricher(state => getMandatoryProperties(state as AppState));
setAnalytics({
  track: (event, properties) => segment.track(event, properties).then(() => "enqueued" as const),
  flush: () => segment.flush(),
});

track("Some Event", { foo: "bar" });
```
