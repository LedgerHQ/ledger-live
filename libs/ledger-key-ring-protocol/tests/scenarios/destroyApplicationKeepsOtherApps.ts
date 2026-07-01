import { TrustchainEjected, TrustchainNotAllowed } from "../../src/errors";
import { ScenarioOptions } from "../test-helpers/types";

// Deactivating one application (Ledger Sync, app 16) must close only that
// application's stream: the ring application (app 17) and the trustchain root
// must survive, and every Ledger Sync instance must reconcile to "ejected".
// destroyApplication only destroys the whole trustchain when closing the last open application.
export async function scenario(deviceId: string, { sdkForName }: ScenarioOptions) {
  // two Ledger Sync instances (app 16) of the same trustchain
  const sdkSync1 = sdkForName("Sync instance 1");
  const sync1creds = await sdkSync1.initMemberCredentials();
  const { trustchain: syncTrustchain } = await sdkSync1.getOrCreateTrustchain(deviceId, sync1creds);

  const sdkSync2 = sdkForName("Sync instance 2");
  const sync2creds = await sdkSync2.initMemberCredentials();
  await sdkSync2.getOrCreateTrustchain(deviceId, sync2creds);

  // a ring application (app 17) shares the same trustchain root
  const sdkRing = sdkForName("Ring member", { applicationId: 17 });
  const ringCreds = await sdkRing.initMemberCredentials();
  const { trustchain: ringTrustchain } = await sdkRing.getOrCreateTrustchain(deviceId, ringCreds);

  // instance 1 deactivates Ledger Sync
  const { trustchainDestroyed } = await sdkSync1.destroyApplication(syncTrustchain, sync1creds);
  expect(trustchainDestroyed).toBe(false); // the ring application is still open, the root is preserved

  // deactivating an already-closed application is a no-op (idempotent, no second CloseStream)
  const secondClose = await sdkSync1.destroyApplication(syncTrustchain, sync1creds);
  expect(secondClose.trustchainDestroyed).toBe(false);

  // both Ledger Sync instances reconcile to ejected
  await expect(sdkSync1.restoreTrustchain(syncTrustchain, sync1creds)).rejects.toThrow(
    TrustchainEjected,
  );
  sdkSync2.invalidateJwt();
  await expect(sdkSync2.restoreTrustchain(syncTrustchain, sync2creds)).rejects.toThrow(
    TrustchainEjected,
  );

  // the ring application still works
  sdkRing.invalidateJwt();
  const ringMembers = await sdkRing.getMembers(ringTrustchain, ringCreds);
  expect(ringMembers.some(m => m.id === ringCreds.pubkey)).toBe(true);

  // re-activating Ledger Sync reopens the application within the same trustchain, on a new index
  const reactivated = await sdkSync1.getOrCreateTrustchain(deviceId, sync1creds);
  expect(reactivated.type).toBe("updated"); // reopened inside the existing trustchain, instance 1 re-added as member
  expect(reactivated.trustchain.applicationPath).not.toBe(syncTrustchain.applicationPath);
  const membersAfter = await sdkSync1.getMembers(reactivated.trustchain, sync1creds);
  expect(membersAfter.some(m => m.id === sync1creds.pubkey)).toBe(true); // instance 1 is a member again

  // instance 2 was not re-added to the reopened stream. The real backend has no permission for it on
  // the new stream (TrustchainNotAllowed); the in-memory mock surfaces the same lock-out as TrustchainEjected.
  // Both are handled identically (resetLedgerSync) by the apps.
  const sync2RestoreError = await sdkSync2
    .restoreTrustchain(reactivated.trustchain, sync2creds)
    .then(
      () => null,
      (e: unknown) => e,
    );
  expect(
    sync2RestoreError instanceof TrustchainNotAllowed ||
      sync2RestoreError instanceof TrustchainEjected,
  ).toBe(true);

  // cleanup
  await sdkSync1.destroyTrustchain(reactivated.trustchain, sync1creds);
}
