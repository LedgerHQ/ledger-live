import type {
  AnalyticsStore,
  AnalyticsTransport,
  Enricher,
  MandatoryEnricher,
  Props,
  PropertyFilter,
  TrackingSelector,
} from "./types";

let transport: AnalyticsTransport | undefined;
let store: AnalyticsStore | undefined;
let trackingSelector: TrackingSelector | undefined;
let enricher: Enricher | undefined;
let mandatoryEnricher: MandatoryEnricher | undefined;
let propertyFilter: PropertyFilter | undefined;

/**
 * Register the app's Segment client. Transport only: the pipeline has already applied the consent
 * gate, the enricher, the property filter and the merge by the time `track` is called.
 *
 * Every setter accepts `undefined` to unregister.
 */
export function setAnalytics(next?: AnalyticsTransport): void {
  transport = next;
}

export function getAnalytics(): AnalyticsTransport | undefined {
  return transport;
}

/** Anything with a `getState()`. The package never imports Redux or an app `State` type. */
export function setStore(next?: AnalyticsStore): void {
  store = next;
}

export function getAnalyticsState(): unknown {
  return store?.getState();
}

/** Consent gate. While no selector is registered, tracking is ALWAYS ENABLED — the CLI contract. */
export function setTrackingSelector(next?: TrackingSelector): void {
  trackingSelector = next;
}

export function getTrackingSelector(): TrackingSelector | undefined {
  return trackingSelector;
}

export function setEnricher(next?: Enricher): void {
  enricher = next;
}

/**
 * Consent-safe extra properties, sent *instead of* the enricher's when an event is mandatory.
 * `mandatory` swaps the property set, it does not merely bypass the gate: without this registered,
 * mandatory events carry no extra properties at all rather than the full payload.
 */
export function setMandatoryEnricher(next?: MandatoryEnricher): void {
  mandatoryEnricher = next;
}

export function resolveExtraProperties(
  state: unknown,
  mandatory?: boolean | null,
): Props | Promise<Props> | undefined {
  return mandatory ? mandatoryEnricher?.(state) : enricher?.(state);
}

/** Optional payload rewrite before send (desktop's `confidentialityFilter`). */
export function setPropertyFilter(next?: PropertyFilter): void {
  propertyFilter = next;
}

export function applyPropertyFilter(properties: Props): Props {
  return propertyFilter ? propertyFilter(properties) : properties;
}
