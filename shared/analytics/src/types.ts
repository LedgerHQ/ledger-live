import type { NoSensitive } from "@shared/sensitive";

export type Props = Record<string, unknown>;

/** What `track` and `trackPage` take as props. */
export type EventProps = Error | Props | null | undefined;

/** Event props: a type error when they hold a `Sensitive` value (an account key, an address). */
export type SafeProps<P extends EventProps> = P & NoSensitive<P>;

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
};

export type TrackPageOptions = {
  avoidDuplicates?: boolean;
  mandatory?: boolean;
  refreshSource?: boolean;
  updateRoutes?: boolean;
};

export type TrackPagePayload<P extends EventProps> = {
  category?: string;
  name?: string | null;
  props?: SafeProps<P>;
};
