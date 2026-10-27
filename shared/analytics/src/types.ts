export type Props = Record<string, unknown>;

export type EventType = "track" | "page";

export type DeliveryStatus =
  | "blocked_pii"
  | "enqueued"
  | "failed_tracking"
  | "failed_enrichment"
  | "failed_filter"
  | "failed_identify"
  | "flushed"
  | "skipped_no_client"
  | "skipped_no_store"
  | "skipped_no_token";

export type PiiKind =
  | "ledger_account_id"
  | "explorer_url"
  | "evm_hash"
  | "evm_address"
  | "extended_public_key"
  | "bech32_address"
  | "email"
  | "sensitive_key";

export type PiiFinding = {
  path: string;
  kind: PiiKind;
};

export type AnalyticsEvent = {
  eventName: string;
  eventProperties?: Props;
  eventPropertiesWithoutExtra?: Props;
  deliveryStatus?: DeliveryStatus;
  piiFindings?: PiiFinding[];
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

export type TrackPagePayload = {
  category?: string;
  name?: string | null;
  props?: Error | Props | null;
};
