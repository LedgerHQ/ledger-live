import { sanitizeErrorMessage } from "@ledgerhq/transaction-observability";
import { extractErrorContext } from "../errors/helpers";
import type { CommonLogEvent, ErrorLogEvent, LogEvent } from "./useBroadcast";

type LoggedEvent = { status: LogEvent["status"] } & CommonLogEvent;

export type BroadcastFailureLog = {
  event: LoggedEvent;
  errorContext: Record<string, string | number | boolean>;
  error: Error;
};

const STACK_FRAME = /^\s+at /;

/** Keeps only the listed attributes of a broadcast log event, whatever else the event carries. */
export function toBroadcastLogEvent(event: LogEvent): LoggedEvent {
  return {
    status: event.status,
    appVersion: event.appVersion,
    source: event.source,
    currencyId: event.currencyId,
    family: event.family,
    tokenId: event.tokenId,
    isTestnet: event.isTestnet,
    isSendMax: event.isSendMax,
  };
}

function sanitizeErrorContext(error: Error): BroadcastFailureLog["errorContext"] {
  const context: BroadcastFailureLog["errorContext"] = {};
  for (const [key, value] of Object.entries(extractErrorContext(error))) {
    if (typeof value === "number" || typeof value === "boolean") context[key] = value;
    else if (typeof value === "string") context[key] = sanitizeErrorMessage(value);
  }
  return context;
}

/**
 * Prepares a failed broadcast for a monitoring sink.
 *
 * A node or a coin module can quote the signed transaction, an address or a hash in the error's
 * message or attach it as a property of the error. So the message goes through
 * {@link sanitizeErrorMessage}, the error's own properties keep only flat values sanitized the same
 * way, and the stack keeps only its frames under the sanitized message.
 */
export function toBroadcastFailureLog(event: ErrorLogEvent): BroadcastFailureLog {
  const { error } = event;
  const message = sanitizeErrorMessage(error.message);
  const frames = (error.stack ?? "").split("\n").filter(line => STACK_FRAME.test(line));
  const sanitizedError = new Error(message);
  sanitizedError.name = error.name;
  sanitizedError.stack = [`${error.name}: ${message}`, ...frames].join("\n");

  return {
    event: toBroadcastLogEvent(event),
    errorContext: sanitizeErrorContext(error),
    error: sanitizedError,
  };
}
