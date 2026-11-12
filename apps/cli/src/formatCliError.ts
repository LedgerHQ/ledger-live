import { inspect } from "node:util";

const MAX_NESTED_ERRORS = 5;

const readText = (error: object, key: string): string | undefined => {
  const value: unknown = Reflect.get(error, key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const CAUSE_SEPARATOR = " ← ";

const joinCauseChain = (message?: string, nestedDetails?: string): string | undefined => {
  if (!message || !nestedDetails) return message ?? nestedDetails;
  const nestedRepeatsMessage =
    nestedDetails === message || nestedDetails.startsWith(`${message}${CAUSE_SEPARATOR}`);
  return nestedRepeatsMessage ? nestedDetails : `${message}${CAUSE_SEPARATOR}${nestedDetails}`;
};

/** DMK errors carry `_tag` and `originalError` but often no `message`, so `String()` gives "[object Object]". */
export function formatCliError(error: unknown, depth = 0): string {
  if (typeof error !== "object" || error === null) return String(error);

  const tag = readText(error, "_tag");
  const errorCode = readText(error, "errorCode");
  const nestedError: unknown = Reflect.get(error, "originalError") ?? Reflect.get(error, "cause");
  const canDescribeNestedError = nestedError !== undefined && depth < MAX_NESTED_ERRORS;
  const details = joinCauseChain(
    readText(error, "message"),
    canDescribeNestedError ? formatCliError(nestedError, depth + 1) : undefined,
  );

  if (tag) {
    const label = errorCode ? `${tag} (code: ${errorCode})` : tag;
    return details ? `${label}: ${details}` : label;
  }
  if (details) return details;
  return error instanceof Error ? String(error) : inspect(error, { breakLength: Infinity });
}
