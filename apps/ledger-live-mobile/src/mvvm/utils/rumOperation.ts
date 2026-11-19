import { DdRum, FeatureOperationFailure } from "@datadog/mobile-react-native";
import { isDatadogRecording } from "~/datadog";

/**
 * Datadog RUM feature operations tracked by the app, as `@operation.name` values.
 * Declare a name here before instrumenting its flow; names match `^[\w.@-]+$`.
 */
export const RumOperation = {
  AddAccount: "add_account",
  Send: "send",
  ProviderConnect: "provider_connect",
  SwapExecute: "swap_execute",
  ReceiveVerifyAddress: "receive_verify_address",
  FirmwareUpdate: "firmware_update",
  DeviceConnect: "device_connect",
} as const;

export type RumOperationName = (typeof RumOperation)[keyof typeof RumOperation];

/** `ERROR`: the flow failed. `ABANDONED`: the user left it. `OTHER`: an expected dead end. */
export type RumOperationFailureReason = "ERROR" | "ABANDONED" | "OTHER";

/** Snake_case keys. Never addresses, amounts or account ids. `undefined` values are dropped. */
export type RumOperationAttributes = Record<string, string | number | boolean | undefined>;

type Opts = {
  /** Tells apart concurrent instances of one operation. */
  operationKey?: string;
  attributes?: RumOperationAttributes;
};

type SentAttributes = Record<string, string | number | boolean>;

/** Active operations by `name|operationKey`, with the attributes their start sent. */
const activeOperations = new Map<string, SentAttributes>();

const toKey = (name: RumOperationName, operationKey?: string) => `${name}|${operationKey ?? ""}`;

const compact = (attributes?: RumOperationAttributes): SentAttributes => {
  const sent: SentAttributes = {};
  for (const [key, value] of Object.entries(attributes ?? {})) {
    if (value !== undefined) sent[key] = value;
  }
  return sent;
};

/** Telemetry must never break the flow it observes: swallow SDK throws and rejections. */
const send = (call: () => Promise<void>): void => {
  try {
    call().catch(() => {});
  } catch {
    // The SDK threw synchronously: drop the event.
  }
};

/**
 * Pops an active operation and returns the attributes of its stop event, or `null` when its
 * start was never sent. A stop follows its start even after the recording gate closed.
 */
const takeStopAttributes = (name: RumOperationName, opts: Opts): SentAttributes | null => {
  const key = toKey(name, opts.operationKey);
  const startAttributes = activeOperations.get(key);
  if (!startAttributes) return null;
  activeOperations.delete(key);
  return { ...startAttributes, ...compact(opts.attributes) };
};

/**
 * Starts a RUM feature operation when Datadog is recording (feature flag and tracking consent).
 * Starting an operation that is already active keeps the first start.
 * @returns whether a start event was sent.
 */
export function startRumOperation(name: RumOperationName, opts: Opts = {}): boolean {
  const key = toKey(name, opts.operationKey);
  if (activeOperations.has(key) || !isDatadogRecording()) return false;

  const attributes = compact(opts.attributes);
  activeOperations.set(key, attributes);
  send(() => DdRum.startFeatureOperation(name, opts.operationKey ?? null, attributes));
  return true;
}

/**
 * Ends an active operation as a success, with its start attributes merged with `attributes`.
 * @returns whether a success event was sent.
 */
export function succeedRumOperation(name: RumOperationName, opts: Opts = {}): boolean {
  const attributes = takeStopAttributes(name, opts);
  if (!attributes) return false;

  send(() => DdRum.succeedFeatureOperation(name, opts.operationKey ?? null, attributes));
  return true;
}

/**
 * Ends an active operation as a failure, with its start attributes merged with `attributes`.
 * @returns whether a failure event was sent.
 */
export function failRumOperation(
  name: RumOperationName,
  reason: RumOperationFailureReason,
  opts: Opts = {},
): boolean {
  const attributes = takeStopAttributes(name, opts);
  if (!attributes) return false;

  send(() =>
    DdRum.failFeatureOperation(
      name,
      opts.operationKey ?? null,
      FeatureOperationFailure[reason],
      attributes,
    ),
  );
  return true;
}

export function isRumOperationActive(name: RumOperationName, operationKey?: string): boolean {
  return activeOperations.has(toKey(name, operationKey));
}

export function resetRumOperationsForTests(): void {
  activeOperations.clear();
}
