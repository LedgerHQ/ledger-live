/** The id in the payload of a stored account, read with no decode. */
export function accountIdOfPayload(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) return undefined;
  const { data } = payload;
  if (typeof data !== "object" || data === null || !("id" in data)) return undefined;
  return typeof data.id === "string" ? data.id : undefined;
}
