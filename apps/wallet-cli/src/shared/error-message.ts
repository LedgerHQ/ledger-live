/** Extracts a displayable message from a caught value, without assuming it's an `Error`. */
export function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
