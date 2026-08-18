import { useTrustchainSdk } from "./useTrustchainSdk";
import { useSelector, useDispatch } from "~/context/hooks";
import {
  trustchainSelector,
  resetTrustchainStore,
  memberCredentialsSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { useMutation } from "@tanstack/react-query";
import { AnalyticsEvents } from "LLM/features/WalletSync/Analytics/enums";
import { track } from "~/analytics";
import { QueryKey } from "./type.hooks";
import { useCloudSyncSDK } from "./useWatchWalletSync";
import { walletSyncUpdate } from "@domain/entity-wallet-sync";
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
      await sdk.destroyApplication(trustchain, memberCredentials);
    },
    mutationKey: [QueryKey.destroyTrustchain, trustchain],
    onSuccess: () => {
      dispatch(resetTrustchainStore());
      track(AnalyticsEvents.LedgerSyncDeactivated);
      dispatch(walletSyncUpdate({ data: null, version: 0 }));
      setCurrentStep(Steps.Activation);
    },
  });

  return { deleteMutation };
}
