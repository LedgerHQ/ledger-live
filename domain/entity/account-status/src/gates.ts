import type { AccountGate, AccountStatus, AssetGate, AssetStatus } from "./schema";

/** What stops the account receiving: its onboarding first, then the asset gate. */
export function receiveGate(
  { gate }: AccountStatus,
  asset?: AssetStatus,
): AccountGate | AssetGate | null {
  if (gate) return gate;
  return asset?.gate ?? null;
}

/** What stops the account sending, whatever the asset. */
export function sendGate({ gate }: AccountStatus): AccountGate | null {
  return gate;
}
