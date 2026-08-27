import type { TronAccount } from "./types";

export {
  defaultTronResources,
  extractBandwidthInfo,
  fetchTronResources,
} from "./logic/tronResources";

export function isAccountEmpty({
  tronResources,
}: {
  tronResources?: TronAccount["tronResources"];
}): boolean {
  // tronResources may be absent on accounts synced via the generic coin framework before the
  // chain-specific enrichment has run. Treat as non-empty so the account is not silently dropped
  // from scan results.
  if (!tronResources) return false;
  return tronResources.bandwidth.freeLimit.eq(0);
}
