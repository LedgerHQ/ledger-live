import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
// LKRP_MIGRATION: getSdk / TrustchainSDK → @features/platform-lkrp createLkrpSdk (inject crypto, keystore, HTTP backend, optional device).
// LKRP_MIGRATION: store → @domain/entity-trustchain (selectors, persist, reset). Stop storing private keys.
// LKRP_MIGRATION: Trustchain / MemberCredentials → @shared/lkrp (opaque key handle; no walletSyncEncryptionKey).
import {
  MemberCredentials,
  Trustchain,
  TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { setTrustchain, resetTrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { log } from "@ledgerhq/logs";
import { track } from "~/renderer/analytics/segment";

export function useOnTrustchainRefreshNeeded(
  trustchainSdk: TrustchainSDK,
  memberCredentials: MemberCredentials | null,
): (trustchain: Trustchain) => Promise<void> {
  const dispatch = useDispatch();
  const onTrustchainRefreshNeeded = useCallback(
    async (trustchain: Trustchain) => {
      try {
        if (!memberCredentials) return;
        log("walletsync", "onTrustchainRefreshNeeded " + trustchain.rootId);
        const newTrustchain = await trustchainSdk.restoreTrustchain(trustchain, memberCredentials);
        dispatch(setTrustchain(newTrustchain));
      } catch (e) {
        if ((e as { name?: string })?.name === "TrustchainEjected") {
          dispatch(resetTrustchainStore());
          track("ledgersync_deactivated");
        }
      }
    },
    [dispatch, trustchainSdk, memberCredentials],
  );
  return onTrustchainRefreshNeeded;
}
