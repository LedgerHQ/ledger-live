export type Props = Record<string, unknown>;

export type EventType = "track" | "page";

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
  eventProps?: Props;
  eventPropsWithoutExtra?: Props;
  date: Date;
  deliveryStatus?: DeliveryStatus;
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
};

export type TrackPageOptions = {
  avoidDuplicates?: boolean;
  mandatory?: boolean;
  refreshSource?: boolean;
  updateRoutes?: boolean;
};

export type TrackPagePayload = {
  category?: string;
  name?: string | null;
  props?: Error | Props | null;
};

export type TrackingRouteRef = { current: string | null | undefined };
