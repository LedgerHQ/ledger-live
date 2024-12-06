import { useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  MemberCredentials,
  Trustchain,
  TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { setTrustchain, resetTrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { TrustchainEjected } from "@ledgerhq/ledger-key-ring-protocol/errors";
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
        if (e instanceof TrustchainEjected) {
          dispatch(resetTrustchainStore());
          track("ledgersync_deactivated");
        }
      }
    },
    [dispatch, trustchainSdk, memberCredentials],
  );
  return onTrustchainRefreshNeeded;
}
