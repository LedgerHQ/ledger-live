const SCHEMA_FIELDS = new Set(["id", "type", "source", "service", "version", "_dd"]);

// Schema fields of the event and its sections (view.id, error.source…) stay: the SDK still sends it.
export function blankStrings(value: unknown, depth = 0, seen = new Set<unknown>()): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (depth <= 1 && SCHEMA_FIELDS.has(key)) continue;
    const child: unknown = Reflect.get(value, key);
    if (typeof child === "string") Reflect.set(value, key, "");
    else blankStrings(child, key === "context" ? 2 : depth + 1, seen);
  }
}
