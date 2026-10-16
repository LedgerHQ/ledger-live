import { toJsonSafe } from "@ledgerhq/account-module-framework";
import type { ErrorView } from "@ledgerhq/portfolio-module-framework";

/**
 * Fields never copied: an HTTP client's request, response and configuration (headers, URLs with
 * keys, circular sockets), and what the view carries otherwise.
 */
const DENIED: ReadonlySet<string> = new Set([
  "config",
  "request",
  "response",
  "headers",
  "stack",
  "name",
  "message",
  "cause",
]);

/** Characters of a field's JSON; a longer field is dropped. */
const MAX_FIELD_LENGTH = 4096;

const MAX_CAUSES = 3;

/**
 * The JSON form of a failure: its name, message and own fields (JSON form; functions, undefined
 * values, denied, circular and oversized fields dropped), and up to three causes that are errors.
 * Anything thrown that is not an `Error` becomes an `Error` of its string.
 */
export function toErrorView(error: unknown, depth = 0): ErrorView {
  if (!(error instanceof Error)) return { name: "Error", message: String(error) };
  const view: ErrorView = { name: error.name, message: error.message };
  for (const [key, value] of Object.entries(error)) {
    if (DENIED.has(key) || value === undefined || typeof value === "function") continue;
    try {
      const json = toJsonSafe(value);
      if (JSON.stringify(json).length <= MAX_FIELD_LENGTH) view[key] = json;
    } catch {
      // circular, or not serialisable: dropped
    }
  }
  const { cause } = error as { cause?: unknown };
  if (cause instanceof Error && depth < MAX_CAUSES) view.cause = toErrorView(cause, depth + 1);
  return view;
}
