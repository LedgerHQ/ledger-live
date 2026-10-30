export function readLaunchForceProvider(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const provider = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(provider) || provider < 1) return undefined;
  return provider;
}
