/** Every name or title a decline arrives under, one per prompt a deposit raises. */
const REFUSAL_MARKERS = new Set([
  "TransactionRefusedOnDevice",
  "UserRefusedOnDevice",
  "UserRefusedAllowManager",
  "userRefused",
]);

const marksARefusal = (value: unknown): boolean =>
  typeof value === "string" && REFUSAL_MARKERS.has(value);

/** Tells a decline apart from a failure. Duck-typed, as `instanceof` is unreliable here. */
export function isUserRefusal(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  return (
    ("name" in error && marksARefusal(error.name)) ||
    ("title" in error && marksARefusal(error.title))
  );
}
