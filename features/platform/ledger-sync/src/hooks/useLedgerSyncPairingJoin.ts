import { useCallback, useRef, useState } from "react";
import { selectIsKeyRingMember } from "@domain/entity-key-ring";
import { commitKeyRingTree, type KeyRingSession } from "@features/platform-key-ring";
import { trackLedgerSyncActivated } from "../analytics";
import type { LedgerSyncPairingJoin, LedgerSyncPairingJoinOptions } from "../types";
import { useLedgerSyncDispatch, useLedgerSyncSelector } from "../internals/store";

/**
 * Joins the key tree of the instance whose QR code was scanned: asks for the digits it shows,
 * then stores the key tree. A failure `onFailure` does not handle is thrown again. Pass stable
 * callbacks: `start` changes identity with them.
 *
 * @example
 * ```ts
 * const { digitsCount, start, sendDigits } = useLedgerSyncPairingJoin({
 *   client,
 *   memberName,
 *   getActivatedEventProperties,
 *   onJoined,
 *   onFailure,
 * });
 * if (hasMemberKey) start(scannedUrl, session);
 * ```
 */
export function useLedgerSyncPairingJoin({
  client,
  memberName,
  getActivatedEventProperties,
  onJoined,
  onFailure,
}: LedgerSyncPairingJoinOptions): LedgerSyncPairingJoin {
  const dispatch = useLedgerSyncDispatch();
  const isMember = useLedgerSyncSelector(selectIsKeyRingMember);
  const [digitsCount, setDigitsCount] = useState<number | null>(null);
  const [input, setInput] = useState<string | null>(null);
  const submitDigitsRef = useRef<((digits: string) => void) | null>(null);

  const onRequestPairingCode = useCallback(
    (config: Readonly<{ digits: number }>, submit: (digits: string) => void) => {
      setDigitsCount(config.digits);
      submitDigitsRef.current = submit;
    },
    [],
  );

  const onPairingFinished = useCallback(() => {
    setDigitsCount(null);
    setInput(null);
    submitDigitsRef.current = null;
    onJoined();
  }, [onJoined]);

  const start = useCallback(
    async (scannedUrl: string, session: KeyRingSession): Promise<true | undefined> => {
      try {
        const tree = await client.joinPairing(session, {
          memberName,
          scannedUrl,
          onRequestPairingCode,
        });
        if (tree) {
          dispatch(commitKeyRingTree(tree));
          if (!isMember) trackLedgerSyncActivated(getActivatedEventProperties());
        }
        onPairingFinished();
        return true;
      } catch (e) {
        if (onFailure(e)) return;
        throw e;
      }
    },
    [
      memberName,
      onRequestPairingCode,
      isMember,
      onPairingFinished,
      client,
      dispatch,
      onFailure,
      getActivatedEventProperties,
    ],
  );

  const sendDigits = useCallback((digits: string) => {
    submitDigitsRef.current?.(digits);
    return true;
  }, []);

  return { digitsCount, input, setInput, start, sendDigits };
}
