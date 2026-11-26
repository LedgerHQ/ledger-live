import { useDestroyLedgerSync } from "@features/flow-ledger-sync";
import { useKeyRingClient } from "./useKeyRingClient";
import { useCloudSyncSDK } from "./useWatchWalletSync";
import { useCurrentStep } from "./useCurrentStep";
import { Steps } from "../types/Activation";

export function useDestroyTrustchain() {
  const cloudSync = useCloudSyncSDK();
  const client = useKeyRingClient();
  const { setCurrentStep } = useCurrentStep();

  const { destroy, isPending, error } = useDestroyLedgerSync({
    client,
    cloudSync,
    onAfterReset: () => setCurrentStep(Steps.Activation),
  });

  return { deleteMutation: { mutateAsync: destroy, isPending, error } };
}
