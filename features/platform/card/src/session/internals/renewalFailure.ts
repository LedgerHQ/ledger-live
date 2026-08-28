/**
 * Names the answer that ended a session, for the development trace.
 *
 * The status, and nothing else. A token endpoint can echo the token it rejected, and no code reads
 * a renewal body any more: every answer but a new session ends the session, so there is nothing
 * left to classify.
 */
export function describeRenewalFailure(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    const { status } = error as { status: unknown };
    if (typeof status === "number" || typeof status === "string") {
      return String(status);
    }
  }

  return error instanceof Error ? error.name : "no status";
}
