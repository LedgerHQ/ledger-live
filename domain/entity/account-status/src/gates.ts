import type { AccountGate, AccountStatus, AssetGate, AssetStatus } from "./schema";

/** What stops the account receiving: its onboarding first, then the asset gate. */
export function receiveGate(
  { accountGate }: AccountStatus,
  asset?: AssetStatus,
): AccountGate | AssetGate | null {
  if (accountGate?.type === "onboarding") return accountGate;
  return asset?.assetGate ?? null;
}

/** What stops the account sending, whatever the asset. */
export function sendGate({ accountGate }: AccountStatus): AccountGate | null {
  return accountGate;
}
