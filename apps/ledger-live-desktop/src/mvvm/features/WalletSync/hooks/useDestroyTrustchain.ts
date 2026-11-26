import { useKeyRingClient } from "./useKeyRingClient";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import { resetKeyRingState, selectKeyRingSession } from "@features/platform-key-ring";
import { useMutation } from "@tanstack/react-query";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { QueryKey } from "./type.hooks";
import { useCloudSyncSDK } from "./useWatchWalletSync";
import { walletSyncUpdate } from "@domain/entity-wallet-sync";
import { track } from "@shared/analytics";

export function useDestroyTrustchain() {
  const dispatch = useDispatch();
  const sdk = useKeyRingClient();
  const cloudSyncSDK = useCloudSyncSDK();
  const session = useSelector(selectKeyRingSession);
  const treeId = useSelector(selectKeyRingTreeId);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const stream = sdk.openStream(session);
      if (!stream) {
        return;
      }
      await cloudSyncSDK.destroy(stream);
      await sdk.destroy(session);
    },
    mutationKey: [QueryKey.destroyTrustchain, treeId],
    onSuccess: () => {
      dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.BackupDeleted }));
      dispatch(resetKeyRingState());
      track("ledgersync_deactivated");
      dispatch(walletSyncUpdate({ data: null, version: 0 }));
    },
    onError: () => dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.BackupDeletionError })),
  });

  return { deleteMutation };
}
