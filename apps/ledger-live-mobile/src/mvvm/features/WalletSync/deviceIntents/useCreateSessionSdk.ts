import { useCallback } from "react";
import { defer } from "rxjs";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import type { WithDevice } from "@ledgerhq/ledger-key-ring-protocol/types";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { CreateSessionSdk } from "@features/platform-intent-wallet-sync";
import { useTrustchainSdkContext } from "../hooks/useTrustchainSdkContext";

/**
 * Builds a Ledger Sync SDK bound to one DIE session: its device calls go
 * through `DmkCompatTransport` on that session instead of `withDevice`.
 */
export function useCreateSessionSdk(): CreateSessionSdk {
  const { isMockEnv, context } = useTrustchainSdkContext();

  return useCallback(
    ({ dmk, sessionId }) => {
      const withSessionDevice: WithDevice = () => job =>
        defer(() => job(new DmkCompatTransport(dmk, sessionId)));
      return getSdk(isMockEnv, context, withSessionDevice);
    },
    [isMockEnv, context],
  );
}
