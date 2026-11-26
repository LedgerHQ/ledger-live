import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { selectIsKeyRingMember } from "@domain/entity-key-ring";
import {
  classifyKeyRingError,
  commitKeyRingTree,
  hasKeyRingMemberKey,
  isSameKeyRingMember,
  KeyRingPairingClosedError,
  selectKeyRingSession,
  type KeyRingSession,
} from "@features/platform-key-ring";
import { trackLedgerSyncActivated } from "../analytics";
import { LedgerSyncQueryKey } from "../logic/queryKeys";
import type { LedgerSyncPairingHost, LedgerSyncPairingHostOptions } from "../types";
import { useLedgerSyncDispatch, useLedgerSyncSelector } from "../internals/store";

/**
 * Hosts a QR code pairing: shows a QR code another instance scans, then the digits it must type,
 * and stores the key tree once it joined. A channel that closed after 30 seconds or more shows a
 * new QR code; every other failure goes to `onFailure`. The app starts it with `start` and maps
 * its steps in the callbacks.
 *
 * @example
 * ```ts
 * const { url, error, isLoading, start } = useLedgerSyncPairingHost({
 *   client,
 *   memberName,
 *   startBinding: "member-key",
 *   notifyPaired: "after-members-refresh",
 *   onDisplayDigits: digits => setPinCode(digits),
 *   onPaired: () => navigation.navigate(ScreenName.WalletSyncLoading, { created: false }),
 *   onDigitsCleared: () => setPinCode(null),
 *   getActivatedEventProperties: () => ({ flow: trackingFlow }),
 *   onFailure: ({ category }) => {
 *     if (category === "no-tree-for-seed") setCurrentStep(Steps.UnbackedError);
 *   },
 * });
 * ```
 */
export function useLedgerSyncPairingHost({
  client,
  memberName,
  startBinding,
  notifyPaired,
  onDisplayDigits,
  onPaired,
  onDigitsCleared,
  getActivatedEventProperties,
  onFailure,
}: LedgerSyncPairingHostOptions): LedgerSyncPairingHost {
  const queryClient = useQueryClient();
  const dispatch = useLedgerSyncDispatch();
  const session = useLedgerSyncSelector(selectKeyRingSession);
  const memberKeySession = useLedgerSyncSelector(selectKeyRingSession, isSameKeyRingMember);
  const isMember = useLedgerSyncSelector(selectIsKeyRingMember);
  const [url, setUrl] = useState<string | null>(null);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (runSession: KeyRingSession | undefined) =>
      client.hostPairing(runSession ?? session, {
        memberName,
        onDisplayQRCode: displayedUrl => {
          setUrl(displayedUrl);
        },
        onDisplayDigits,
      }),

    onSuccess: tree => {
      if (tree) {
        dispatch(commitKeyRingTree(tree));
        if (!isMember) trackLedgerSyncActivated(getActivatedEventProperties());
      }
      if (notifyPaired === "before-members-refresh") onPaired();
      void queryClient.invalidateQueries({ queryKey: [LedgerSyncQueryKey.members] });
      if (notifyPaired === "after-members-refresh") onPaired();
      setUrl(null);
      onDigitsCleared();
    },

    // Not `retry`: it always waits, even with a zero delay.
    onError: e => {
      const category = classifyKeyRingError(e);
      if (category === "pairing-closed") {
        const elapsedMs = e instanceof KeyRingPairingClosedError ? e.elapsedMs : undefined;
        if (elapsedMs !== undefined && elapsedMs >= MIN_TIME_TO_REFRESH) start();
        return;
      }
      onFailure({ category, error: e, restart: start });
    },
  });

  const startSession = startBinding === "session" ? session : memberKeySession;
  const start = useCallback(() => {
    if (!hasKeyRingMemberKey(startSession)) return;
    mutate(startBinding === "session" ? startSession : undefined);
  }, [mutate, startSession, startBinding]);

  return { url, error, isLoading: isPending, start };
}

const MIN_TIME_TO_REFRESH = 30_000;
