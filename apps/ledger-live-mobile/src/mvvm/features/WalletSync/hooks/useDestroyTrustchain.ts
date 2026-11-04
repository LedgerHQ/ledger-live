import { track } from "@shared/analytics";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useSelector, useDispatch } from "~/context/hooks";
import {
  trustchainSelector,
  resetTrustchainStore,
  memberCredentialsSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { getCloudSyncSdk } from "@features/platform-wallet-sync";
import { useMutation } from "@tanstack/react-query";
import { AnalyticsEvents } from "LLM/features/WalletSync/Analytics/enums";
import { QueryKey } from "./type.hooks";
import { walletSyncUpdate } from "@domain/entity-wallet-sync";
import { useCurrentStep } from "./useCurrentStep";
import { Steps } from "../types/Activation";

export function useDestroyTrustchain() {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const { setCurrentStep } = useCurrentStep();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!trustchain || !memberCredentials) {
        return;
      }
      await getCloudSyncSdk(dispatch).destroy(trustchain, memberCredentials);
      await sdk.destroyApplication(trustchain, memberCredentials);
    },
    mutationKey: [QueryKey.destroyTrustchain, trustchain],
    // The watch loop shares the Cloud Sync SDK, whose lock refuses a destroy while it pushes or pulls.
    retry: (failureCount, error) => failureCount < 3 && error.name === "CloudSyncSDKLocked",
    onSuccess: () => {
      dispatch(resetTrustchainStore());
      track(AnalyticsEvents.LedgerSyncDeactivated);
      dispatch(walletSyncUpdate({ data: null, version: 0 }));
      setCurrentStep(Steps.Activation);
    },
  });

  return { deleteMutation };
}
