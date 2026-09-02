/**
 * Public `@shared/analytics/screenRefs` surface.
 *
 * The raw refs sit next to the getters because app code both reads them and assigns
 * `currentRouteNameRef.current` directly — the wallet-API webviews on both apps, and mobile's
 * global search. LIVE-36002 narrows this file to a function-only API, which therefore needs a
 * setter for the current page, not just `setTrackingSource`.
 */
export * from "./internals/screenRefs";
