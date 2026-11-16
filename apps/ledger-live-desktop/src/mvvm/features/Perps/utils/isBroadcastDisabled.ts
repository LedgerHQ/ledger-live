const TRUTHY = new Set(["1", "true"]);

export function isBroadcastDisabled(): boolean {
  return TRUTHY.has(process.env.DISABLE_TRANSACTION_BROADCAST ?? "");
}
