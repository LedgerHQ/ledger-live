/** Every name or title a decline arrives under, one per prompt a deposit raises. */
const REFUSAL_MARKERS = new Set([
  "TransactionRefusedOnDevice",
  "UserRefusedOnDevice",
  "UserRefusedAllowManager",
  "userRefused",
]);

/** Tells a decline apart from a failure. Duck-typed, as `instanceof` is unreliable here. */
export function isUserRefusal(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const { name, title } = error as Record<"name" | "title", unknown>;

  return (
    (typeof name === "string" && REFUSAL_MARKERS.has(name)) ||
    (typeof title === "string" && REFUSAL_MARKERS.has(title))
  );
}
