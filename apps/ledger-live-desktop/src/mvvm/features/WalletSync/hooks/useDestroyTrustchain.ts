import { useDestroyLedgerSync } from "@features/flow-ledger-sync";
import { useDispatch } from "LLD/hooks/redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useKeyRingClient } from "./useKeyRingClient";
import { useCloudSyncSDK } from "./useWatchWalletSync";

export function useDestroyTrustchain() {
  const dispatch = useDispatch();
  const client = useKeyRingClient();
  const cloudSync = useCloudSyncSDK();

  const { destroy, isPending, error } = useDestroyLedgerSync({
    client,
    cloudSync,
    onBeforeReset: () => dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.BackupDeleted })),
    onError: () => dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.BackupDeletionError })),
  });

  return { deleteMutation: { mutateAsync: destroy, isPending, error } };
}
