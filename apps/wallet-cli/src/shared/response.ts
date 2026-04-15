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

export function makeErrorEnvelope(
  command: string,
  message: string,
  network?: string,
): Record<string, unknown> {
  return {
    status: "error",
    command,
    ...(network == null ? {} : { network }),
    message,
    timestamp: new Date().toISOString(),
  };
}
