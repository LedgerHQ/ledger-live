import { track } from "@shared/analytics";
import { useKeyRingClient } from "./useKeyRingClient";
import { useSelector, useDispatch } from "~/context/hooks";
import { resetKeyRingState, selectKeyRingSession } from "@features/platform-key-ring";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import { useMutation } from "@tanstack/react-query";
import { AnalyticsEvents } from "LLM/features/WalletSync/Analytics/enums";
import { QueryKey } from "./type.hooks";
import { useCloudSyncSDK } from "./useWatchWalletSync";
import { walletSyncUpdate } from "@domain/entity-wallet-sync";
import { useCurrentStep } from "./useCurrentStep";
import { Steps } from "../types/Activation";

export function useDestroyTrustchain() {
  const dispatch = useDispatch();
  const cloudSync = useCloudSyncSDK();
  const client = useKeyRingClient();
  const session = useSelector(selectKeyRingSession);
  const treeId = useSelector(selectKeyRingTreeId);
  const { setCurrentStep } = useCurrentStep();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const stream = client.openStream(session);
      if (!stream) {
        return;
      }
      await cloudSync.destroy(stream);
      await client.destroy(session);
    },
    mutationKey: [QueryKey.destroyTrustchain, treeId],
    onSuccess: () => {
      dispatch(resetKeyRingState());
      track(AnalyticsEvents.LedgerSyncDeactivated);
      dispatch(walletSyncUpdate({ data: null, version: 0 }));
      setCurrentStep(Steps.Activation);
    },
  });

  return { deleteMutation };
}
