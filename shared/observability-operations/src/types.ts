export type OperationFailureReason = "ERROR" | "ABANDONED" | "OTHER";

export type OperationAttributes = Record<string, string | number | boolean | undefined>;

export type SentOperationAttributes = Record<string, string | number | boolean>;

export type OperationId = number;

export type OperationSink = {
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
  attributes?: OperationAttributes;
  expectedId?: OperationId;
};

export type AnnotateOperationOptions = {
  operationKey?: string;
  attributes: OperationAttributes;
  expectedId?: OperationId;
};

export type OperationQueryOptions = {
  operationKey?: string;
  expectedId?: OperationId;
};

export type OperationTracker = {
  setSink(sink: OperationSink | null): void;
  start(name: string, options?: StartOperationOptions): OperationId | null;
  annotate(name: string, options: AnnotateOperationOptions): boolean;
  succeed(name: string, options?: StopOperationOptions): boolean;
  fail(name: string, reason: OperationFailureReason, options?: StopOperationOptions): boolean;
  isActive(name: string, options?: OperationQueryOptions): boolean;
  getId(name: string, operationKey?: string): OperationId | null;
};

export type OperationTrackerOptions = {
  now?: () => number;
};
