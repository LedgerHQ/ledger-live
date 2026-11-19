/** `ERROR`: the operation failed. `ABANDONED`: the user left it. `OTHER`: an expected dead end. */
export type OperationFailureReason = "ERROR" | "ABANDONED" | "OTHER";

/** Attributes passed by callers: `undefined` values are dropped before the sink sees them. */
export type OperationAttributes = Record<string, string | number | boolean | undefined>;

/** Attributes as the sink receives them. */
export type SentOperationAttributes = Record<string, string | number | boolean>;

/** Identifies one started operation. Ids are positive, so a started id is always truthy. */
export type OperationId = number;

/**
 * Where operation events go: the app registers one that forwards them to its monitoring vendor.
 * `operationKey` tells apart concurrent instances of one operation name.
 */
export type OperationSink = {
  /** Whether an event sent now is recorded. A start is sent only while this is true. */
  isRecording(): boolean;
  start(name: string, operationKey: string | undefined, attributes: SentOperationAttributes): void;
  succeed(
    name: string,
    operationKey: string | undefined,
    attributes: SentOperationAttributes,
  ): void;
  fail(
    name: string,
    operationKey: string | undefined,
    reason: OperationFailureReason,
    attributes: SentOperationAttributes,
  ): void;
};

export type StartOperationOptions = {
  operationKey?: string;
  attributes?: OperationAttributes;
};

export type StopOperationOptions = {
  operationKey?: string;
  /** Merged over the start attributes in the stop event. */
  attributes?: OperationAttributes;
  /** Stop only if the active operation is still the one this id started. */
  expectedId?: OperationId;
};

export type OperationQueryOptions = {
  operationKey?: string;
  /** Answer for the operation this id started only. */
  expectedId?: OperationId;
};

export type OperationTracker = {
  /** Registers the sink, or removes it with `null`. A stop always goes to the sink of its start. */
  setSink(sink: OperationSink | null): void;
  /** @returns the id of the started operation, or `null` when no start event was sent. */
  start(name: string, options?: StartOperationOptions): OperationId | null;
  /** @returns whether a success event was sent. */
  succeed(name: string, options?: StopOperationOptions): boolean;
  /** @returns whether a failure event was sent. */
  fail(name: string, reason: OperationFailureReason, options?: StopOperationOptions): boolean;
  isActive(name: string, options?: OperationQueryOptions): boolean;
  /** The id of the active operation of a name and key, or `null` when none is active. */
  getId(name: string, operationKey?: string): OperationId | null;
};

export type OperationTrackerOptions = {
  /** Clock in milliseconds, for stale operations. */
  now?: () => number;
};
