import { setEnv } from "@shared/env";

/** Through `setEnv`, because live-common's swap execute and status read the same definition. */
export function applySwapApiBaseOverride(env: Readonly<Record<string, string | undefined>>): void {
  const swapApiBase = env.SWAP_API_BASE;
  if (swapApiBase) setEnv("SWAP_API_BASE", swapApiBase);
}
