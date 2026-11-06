import { useTrustchainSdk } from "./useTrustchainSdk";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  trustchainSelector,
  resetTrustchainStore,
  memberCredentialsSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { getCloudSyncSdk } from "@features/platform-wallet-sync";
import { useMutation } from "@tanstack/react-query";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { QueryKey } from "./type.hooks";
import { walletSyncUpdate } from "@domain/entity-wallet-sync";
import { track } from "@shared/analytics";

// The watch loop shares the Cloud Sync SDK, whose lock refuses a destroy while it pulls or pushes.
// A pull keeps it through its account sync, so the deletion retries for up to 30 seconds.
const LOCKED_RETRY_DELAY_MS = 500;
const LOCKED_RETRIES = 60;

export function useDestroyTrustchain() {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!trustchain || !memberCredentials) {
        return;
      }
      await getCloudSyncSdk(dispatch).destroy(trustchain, memberCredentials);
      await sdk.destroyApplication(trustchain, memberCredentials);
    },
    mutationKey: [QueryKey.destroyTrustchain, trustchain],
    retry: (failureCount, error) =>
      failureCount < LOCKED_RETRIES && error.name === "CloudSyncSDKLocked",
    retryDelay: LOCKED_RETRY_DELAY_MS,
    onSuccess: () => {
      dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.BackupDeleted }));
      dispatch(resetTrustchainStore());
      track("ledgersync_deactivated");
      dispatch(walletSyncUpdate({ data: null, version: 0 }));
    },
    onError: () => dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.BackupDeletionError })),
  });

  return { deleteMutation };
}
