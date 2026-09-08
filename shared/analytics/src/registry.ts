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

export function setAnalytics(next: AnalyticsTransport): void {
  transport = next;
}

export function getAnalytics(): AnalyticsTransport | undefined {
  return transport;
}

export function setStore(next: AnalyticsStore): void {
  store = next;
}

export function getAnalyticsState(): unknown {
  return store?.getState();
}

export function setIsTrackingEnabledSelector(next?: TrackingSelector): void {
  trackingSelector = next;
}

export function getIsTrackingEnabledSelector(): TrackingSelector | undefined {
  return trackingSelector;
}

export function setEnricher(next?: Enricher): void {
  enricher = next;
}

export function setMandatoryEnricher(next?: MandatoryEnricher): void {
  mandatoryEnricher = next;
}

export function resolveExtraProperties(
  state: unknown,
  mandatory: boolean = false
): Props | Promise<Props> | undefined {
  return mandatory ? mandatoryEnricher?.(state) : enricher?.(state);
}

export function setPropertyFilter(next?: PropertyFilter): void {
  propertyFilter = next;
}

export function applyPropertyFilter(properties: Props): Props {
  return propertyFilter ? propertyFilter(properties) : properties;
}
