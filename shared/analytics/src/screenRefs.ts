/**
 * Public `@shared/analytics/screenRefs` surface.
 *
 * The raw refs are exposed alongside the getters only because 39 call sites read (and one writes)
 * `currentRouteNameRef.current` directly. LIVE-36002 narrows this file to the function-only API.
 */
export * from "./internals/screenRefs";
