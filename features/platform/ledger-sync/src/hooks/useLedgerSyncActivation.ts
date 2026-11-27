import { useCallback } from "react";
import { commitKeyRingTree } from "@features/platform-key-ring";
import { classifyLedgerSyncDeviceFailure } from "../logic/errors";
import type { LedgerSyncActivationOptions, LedgerSyncDeviceOutcome } from "../types";
import { useLedgerSyncDispatch } from "../internals/store";

/**
 * The legacy (non-DIE) activation: joins the key tree of the device seed, stores it, then calls
 * `onActivated`. Resolves the outcome instead of throwing; the app picks its screen from the
 * failure reason. The returned function keeps its identity.
 *
 * @example
 * ```ts
 * const activate = useLedgerSyncActivation();
 * const outcome = await activate({
 *   client,
 *   session,
 *   legacyDeviceId: device.deviceId,
 *   onActivated: activation => onTrustchainJoined(activation, device),
 * });
 * if (outcome.type === "failed" && outcome.reason === "already-member") showAlreadySecured();
 * ```
 */
export function useLedgerSyncActivation(): (
  options: LedgerSyncActivationOptions,
) => Promise<LedgerSyncDeviceOutcome> {
  const dispatch = useLedgerSyncDispatch();

  return useCallback(
    async ({
      client,
      session,
      legacyDeviceId,
      callbacks,
      allowTreeCreation,
      assertReady,
      onActivated,
    }: LedgerSyncActivationOptions): Promise<LedgerSyncDeviceOutcome> => {
      try {
        assertReady?.();
        const activation = await client.activate(session, {
          legacyDeviceId,
          callbacks,
          ...(allowTreeCreation !== undefined && { allowTreeCreation }),
        });
        dispatch(commitKeyRingTree(activation.tree));
        onActivated(activation);
        return { type: "done" };
      } catch (error) {
        return { type: "failed", reason: classifyLedgerSyncDeviceFailure(error), error };
      }
    },
    [dispatch],
  );
}
