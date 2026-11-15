import { useCallback } from "react";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { type CreateSessionSdk, sessionWithDevice } from "@features/platform-intent-wallet-sync";
import { useTrustchainSdkSetup } from "../hooks/useTrustchainSdk";

/**
 * Builds a Ledger Sync SDK bound to one DIE session, with the setup of the app's cached SDK:
 * its device calls go through `DmkCompatTransport` on that session instead of `withDevice`.
 */
export function useCreateSessionSdk(): CreateSessionSdk {
  const { isMockEnv, context } = useTrustchainSdkSetup();

  return useCallback(
    ({ dmk, sessionId }) =>
      getSdk(
        isMockEnv,
        context,
        sessionWithDevice(() => new DmkCompatTransport(dmk, sessionId)),
      ),
    [isMockEnv, context],
  );
}
