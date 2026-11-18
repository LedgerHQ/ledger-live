// CommandResult / DeviceActionState / XState onError: { error: DmkError }, transports: originalError, cause, err
const NESTED_ERROR_FIELDS = ["error", "originalError", "cause", "err"] as const;

export function someNestedError(error: unknown, matches: (error: object) => boolean): boolean {
  return visit(error, matches, new Set());
}

function visit(error: unknown, matches: (error: object) => boolean, seen: Set<object>): boolean {
  if (typeof error !== "object" || error === null || seen.has(error)) {
    return false;
  }

  seen.add(error);

  if (matches(error)) {
    return true;
  }

  const record = error as Record<string, unknown>;
  return NESTED_ERROR_FIELDS.some(field => field in record && visit(record[field], matches, seen));
}
