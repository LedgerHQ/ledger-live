import { useMutation } from "@tanstack/react-query";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import { walletSyncUpdate } from "@domain/entity-wallet-sync";
import { resetKeyRingState, selectKeyRingSession } from "@features/platform-key-ring";
import { trackLedgerSyncDeactivated } from "../analytics";
import { LedgerSyncQueryKey } from "../logic/queryKeys";
import type { LedgerSyncDestroy, LedgerSyncDestroyOptions } from "../types";
import { useLedgerSyncDispatch, useLedgerSyncSelector } from "../internals/store";

/**
 * Deletes the Ledger Sync backup: the Cloud Sync data, then this instance from the key tree.
 * Nothing happens without a key tree stream. On success, in order: `onBeforeReset`, a new member
 * key, `ledgersync_deactivated`, an empty wallet sync state, `onAfterReset`.
 *
 * @example
 * ```ts
 * const { destroy } = useDestroyLedgerSync({
 *   client,
 *   cloudSync: useCloudSyncSDK(),
 *   onAfterReset: () => setCurrentStep(Steps.Activation),
 * });
 * await destroy();
 * ```
 */
export function useDestroyLedgerSync({
  client,
  cloudSync,
  onBeforeReset,
  onAfterReset,
  onError,
}: LedgerSyncDestroyOptions): LedgerSyncDestroy {
  const dispatch = useLedgerSyncDispatch();
  const session = useLedgerSyncSelector(selectKeyRingSession);
  const treeId = useLedgerSyncSelector(selectKeyRingTreeId);

  const deletion = useMutation({
    mutationFn: async () => {
      const stream = client.openStream(session);
      if (!stream) {
        return;
      }
      await cloudSync.destroy(stream);
      await client.destroy(session);
    },
    mutationKey: [LedgerSyncQueryKey.destroy, treeId],
    onSuccess: () => {
      onBeforeReset?.();
      dispatch(resetKeyRingState());
      trackLedgerSyncDeactivated();
      dispatch(walletSyncUpdate({ data: null, version: 0 }));
      onAfterReset?.();
    },
    onError,
  });

  return { destroy: deletion.mutateAsync, isPending: deletion.isPending, error: deletion.error };
}
