export type Props = Record<string, unknown>;

export type DeliveryStatus =
  | "enqueued"
  | "failed_tracking"
  | "failed_enrichment"
  | "failed_filter"
  | "skipped_no_client"
  | "skipped_no_store"
  | "skipped_no_token";

export type LoggableEventProperties = Error | Props | null;

export type LoggableEvent = {
  eventName: string;
  eventProperties?: LoggableEventProperties;
  eventPropertiesWithoutExtra?: LoggableEventProperties;
  date: Date;
  deliveryStatus?: DeliveryStatus;
};

export interface AnalyticsTransport {
  track(event: string, properties: Props): void | Promise<void | DeliveryStatus>;
  log?(kind: "track" | "page", event: string, properties: Props): void;
}

export type AnalyticsStore = { getState(): unknown };

export type TrackingSelector = (state: unknown) => boolean;

export type Enricher = (state: unknown) => Props | Promise<Props>;

export type MandatoryEnricher = (state: unknown) => Props;

export type PropertyFilter = (properties: Props) => Props;
