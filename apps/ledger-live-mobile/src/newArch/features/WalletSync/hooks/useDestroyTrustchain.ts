import { useTrustchainSdk } from "./useTrustchainSdk";
import { useDispatch, useSelector } from "react-redux";
import {
  trustchainSelector,
  resetTrustchainStore,
  memberCredentialsSelector,
} from "@ledgerhq/trustchain/store";
import { useMutation } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import { useCloudSyncSDK } from "./useWatchWalletSync";
import { walletSyncUpdate } from "@ledgerhq/live-wallet/store";
import { useCurrentStep } from "./useCurrentStep";
import { Steps } from "../types/Activation";

export function useDestroyTrustchain() {
  const dispatch = useDispatch();
  const cloudSyncSDK = useCloudSyncSDK();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const { setCurrentStep } = useCurrentStep();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!trustchain || !memberCredentials) {
        return;
      }
      await cloudSyncSDK.destroy(trustchain, memberCredentials);
      await sdk.destroyTrustchain(trustchain, memberCredentials);
    },
    mutationKey: [QueryKey.destroyTrustchain, trustchain],
    onSuccess: () => {
      dispatch(resetTrustchainStore());
      dispatch(walletSyncUpdate(null, 0));
      setCurrentStep(Steps.Activation);
    },
  });

  return { deleteMutation };
}
