const textField = (record: object, key: string): string | undefined => {
  const value = (record as Record<string, unknown>)[key];
  return typeof value === "string" && value ? value : undefined;
};

/** The message the service or the transport gave, if any. */
export function portfolioErrorMessage(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const data = "data" in error ? error.data : undefined;
  const fromData =
    typeof data === "object" && data !== null
      ? (textField(data, "details") ?? textField(data, "message") ?? textField(data, "error"))
      : undefined;
  return textField(error, "error") ?? fromData ?? textField(error, "message");
}
