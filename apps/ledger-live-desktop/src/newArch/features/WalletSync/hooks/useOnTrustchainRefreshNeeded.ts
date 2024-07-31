import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { MemberCredentials, Trustchain, TrustchainSDK } from "@ledgerhq/trustchain/types";
import { setTrustchain, resetTrustchainStore } from "@ledgerhq/trustchain/store";
import { TrustchainEjected } from "@ledgerhq/trustchain/errors";
import { log } from "@ledgerhq/logs";

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
        }
      }
    },
    [dispatch, trustchainSdk, memberCredentials],
  );
  return onTrustchainRefreshNeeded;
}
