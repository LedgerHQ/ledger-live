---
"@shared/analytics": minor
"@shared/analytics-react": minor
---

Add the `@shared/analytics` and `@shared/analytics-react` packages: one tracking pipeline for Desktop, Mobile and `wallet-cli`, split along the React boundary.

`@shared/analytics` is the React-free, Redux-free core. Each app keeps owning its Segment SDK, its logger, its extra properties and its consent state, and registers them through `setAnalytics` / `setStore` / `setTrackingSelector` / `setEnricher` / `setMandatoryEnricher` / `setPropertyFilter`. There is no Segment client inside the package, which is what lets `wallet-cli` — a Node process with neither React nor Redux — consume the pipeline. `track` resolves the enricher without forcing a microtask when that enricher is synchronous, so Desktop's synchronous `trackSubject` assertions still hold. The screen refs live here too, at `@shared/analytics/screenRefs`, because the pipeline reads them; the raw refs are exported next to the getters as an interim step retired by LIVE-36002.

`@shared/analytics-react` holds the components: `<Track>` on both platforms, `<TrackPage>` on web, `<TrackScreen>` on native. `<TrackPage>` and `<TrackScreen>` are deliberately not merged — page events are Desktop's model, screen events are Mobile's. `useAnalytics` and `useTrack` are deliberately absent; each injected a property read from React context that a module-level `track()` cannot see, and they are removed app-side before the wiring lands.

Three behaviours the two apps had drifted on are unified: route refs now update before the consent gate (Mobile's behaviour, which fixes `getCurrentTrackingPage()` returning `""` to Desktop's non-analytics consumers with analytics off), extra properties win over caller props, and the property filter applies to the merged base so ref-derived `page` / `source` are scrubbed too.

No consumer is wired in yet: Desktop lands under LIVE-35068 and Mobile under LIVE-35069, so this change is additive.
