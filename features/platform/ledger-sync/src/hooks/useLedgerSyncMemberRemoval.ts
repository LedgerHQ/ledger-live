import { useCallback } from "react";
import { commitKeyRingTree } from "@features/platform-key-ring";
import { classifyLedgerSyncDeviceFailure } from "../logic/errors";
import type { LedgerSyncDeviceOutcome, LedgerSyncMemberRemovalOptions } from "../types";
import { useLedgerSyncDispatch } from "../internals/store";

/**
 * The legacy (non-DIE) removal of another instance: removes it, stores the rotated key tree, then
 * calls `onRemoved`. Resolves the outcome instead of throwing. The returned function keeps its
 * identity.
 *
 * @example
 * ```ts
 * const removeMember = useLedgerSyncMemberRemoval();
 * const outcome = await removeMember({
 *   client,
 *   session,
 *   member,
 *   legacyDeviceId: device.deviceId,
 *   assertReady: () => assertKeyRingMember(session),
 *   onRemoved: () => navigation.navigate(ScreenName.WalletSyncManageInstancesSuccess, { member }),
 * });
 * ```
 */
export function useLedgerSyncMemberRemoval(): (
  options: LedgerSyncMemberRemovalOptions,
) => Promise<LedgerSyncDeviceOutcome> {
  const dispatch = useLedgerSyncDispatch();

  return useCallback(
    async ({
      client,
      session,
      member,
      legacyDeviceId,
      callbacks,
      assertReady,
      onRemoved,
    }: LedgerSyncMemberRemovalOptions): Promise<LedgerSyncDeviceOutcome> => {
      try {
        assertReady?.();
        const tree = await client.removeMember(session, { legacyDeviceId, member, callbacks });
        dispatch(commitKeyRingTree(tree));
        onRemoved();
        return { type: "done" };
      } catch (error) {
        return { type: "failed", reason: classifyLedgerSyncDeviceFailure(error), error };
      }
    },
    [dispatch],
  );
}
