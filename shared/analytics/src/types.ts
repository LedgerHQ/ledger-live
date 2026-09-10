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
  eventProps?: Props;
  eventPropsWithoutExtra?: Props;
  date: Date;
  deliveryStatus?: DeliveryStatus;
};

export interface Analytics {
  track(event: string, props: Props): void | Promise<void | DeliveryStatus>;
  log?(kind: "track" | "page", event: string, props: Props): void;
}

export type EnabledFn = () => boolean;

export type ExtraPropsFn = () => Props | Promise<Props>;

export type MandatoryExtraPropsFn = () => Props;

export type PropsFilter = (props: Props) => Props;
