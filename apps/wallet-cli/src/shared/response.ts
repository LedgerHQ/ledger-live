export function makeEnvelope(
  command: string,
  network: string,
  data: Record<string, unknown>,
  account?: string,
): Record<string, unknown> {
  return {
    status: "success",
    command,
    network,
    ...(account == null ? {} : { account }),
    ...data,
    timestamp: new Date().toISOString(),
  };
}
