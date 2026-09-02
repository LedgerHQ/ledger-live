export type Props = Record<string, unknown>;

export type DeliveryStatus =
  | "enqueued"
  | "failed"
  | "skipped_no_client"
  | "skipped_no_store"
  | "skipped_no_token"
  | "flushed";

export type LoggableEventProperties = Error | Props | null;

export type LoggableEvent = {
  eventName: string;
  eventProperties?: LoggableEventProperties;
  eventPropertiesWithoutExtra?: LoggableEventProperties;
  date: Date;
  deliveryStatus?: DeliveryStatus;
};

/** What the pipeline calls to send a finished payload. Implemented by the app owning the SDK. */
export interface AnalyticsTransport {
  /**
   * Send the fully-built payload. May return/resolve a `DeliveryStatus` to override the default
   * `"enqueued"`. Throwing or rejecting is reported as `"failed"` and never propagated.
   */
  track(event: string, properties: Props): void | Promise<void | DeliveryStatus>;
  /** App-side logging hook, called before the send. */
  log?(kind: "track" | "page", event: string, properties: Props): void;
  flush?(): Promise<void>;
  closeAndFlush?(): Promise<void>;
}

/** Anything with a `getState()`. The pipeline never reads the shape of that state. */
export type AnalyticsStore = { getState(): unknown };

export type TrackingSelector = (state: unknown) => boolean;

/** Normal-path extra properties. May be async — mobile awaits native permission state. */
export type Enricher = (state: unknown) => Props | Promise<Props>;

/** Consent-safe extra properties, used *instead of* the enricher when an event is mandatory. */
export type MandatoryEnricher = (state: unknown) => Props;

export type PropertyFilter = (properties: Props) => Props;

export type TrackingResult = { enabled: true } | { enabled: false; reason?: string };

/**
 * A mutable holder for a route name. Structurally identical to React's `RefObject`, so the same
 * object can be read and written by React and non-React code alike.
 */
export type TrackingRouteRef = { current: string | null | undefined };
