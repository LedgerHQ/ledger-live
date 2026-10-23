export type Props = Record<string, unknown>;

export type EventType = "track" | "page";

export type DeliveryStatus =
  | "enqueued"
  | "failed_tracking"
  | "failed_enrichment"
  | "failed_filter"
  | "failed_identify"
  | "flushed"
  | "skipped_no_client"
  | "skipped_no_store"
  | "skipped_no_token";

export type AnalyticsEvent = {
  eventName: string;
  eventProperties?: Props;
  eventPropertiesWithoutExtra?: Props;
  deliveryStatus?: DeliveryStatus;
};

export type LoggableEvent = AnalyticsEvent & {
  date: Date;
};

export interface Analytics {
  track(event: string, props: Props): void | Promise<void | DeliveryStatus>;
  log?(type: EventType, event: string, props: Props): void;
  flush?(): Promise<void>;
  closeAndFlush?(): Promise<void>;
}

export type EnabledFn = () => boolean;

export type ExtraPropsFn = () => Props | Promise<Props>;

export type MandatoryExtraPropsFn = () => Props;

export type PropsFilter = (props: Props) => Props;

export type TrackOptions = {
  mandatory?: boolean;
  /**
   * Caller values for these keys survive host enrichment. A listed key the caller omitted is
   * removed, so a host value cannot stand in for it.
   */
  callerWins?: readonly string[];
};

export type TrackPageOptions = {
  avoidDuplicates?: boolean;
  callerWins?: readonly string[];
  mandatory?: boolean;
  refreshSource?: boolean;
  updateRoutes?: boolean;
};

export type TrackPagePayload = {
  category?: string;
  name?: string | null;
  props?: Error | Props | null;
};
