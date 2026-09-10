export type Props = Record<string, unknown>;

export type DeliveryStatus =
  | "enqueued"
  | "failed_tracking"
  | "failed_enrichment"
  | "failed_filter"
  | "skipped_no_client"
  | "skipped_no_store"
  | "skipped_no_token";

export type LoggableEvent = {
  eventName: string;
  eventProperties?: Props;
  eventPropertiesWithoutExtra?: Props;
  date: Date;
  deliveryStatus?: DeliveryStatus;
};

export interface AnalyticsTransport {
  track(event: string, properties: Props): void | Promise<void | DeliveryStatus>;
  log?(kind: "track" | "page", event: string, properties: Props): void;
}

export type EnabledFunction = () => boolean;

export type ExtraPropertiesFunction = () => Props | Promise<Props>;

export type MandatoryExtraPropertiesFunction = () => Props;

export type PropertyFilter = (properties: Props) => Props;
