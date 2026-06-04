import { ScenarioOptions } from "../test-helpers/types";

// Deriving wallet-cli `ring init` (applicationId 17) must not evict the Ledger
// Sync soft member (applicationId 16) — see trustchain-backend PR #519.

export async function scenario(deviceId: string, { sdkForName }: ScenarioOptions) {
  const sdkSync = sdkForName("Ledger Sync member");
  const syncCreds = await sdkSync.initMemberCredentials();
  const { trustchain: syncTrustchain } = await sdkSync.getOrCreateTrustchain(deviceId, syncCreds);

  const before = await sdkSync.getMembers(syncTrustchain, syncCreds);
  expect(before.some(m => m.id === syncCreds.pubkey)).toBe(true);

  const sdkRing = sdkForName("wallet-cli ring member", { applicationId: 17 });
  const ringCreds = await sdkRing.initMemberCredentials();
  await sdkRing.getOrCreateTrustchain(deviceId, ringCreds);

  // Drop the JWT cached before the ring derivation so the assertion below
  // validates the soft member can still obtain a fresh JWT.
  sdkSync.invalidateJwt();

  const after = await sdkSync.getMembers(syncTrustchain, syncCreds);
  expect(after.some(m => m.id === syncCreds.pubkey)).toBe(true);
}
