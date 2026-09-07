export function isValidatorRemoved({
  loading,
  error,
  hasValidator,
  nodeId,
}: {
  loading?: boolean;
  error: unknown;
  hasValidator: boolean;
  nodeId: unknown;
}): boolean {
  return !loading && !error && !hasValidator && typeof nodeId === "number";
}
