import { useCallback, useEffect, useRef, useState } from "react";
import { useQueuedBottomSheetContext } from "../contexts/QueuedBottomSheetsContext";
import { useQueuedBottomSheetAdapters } from "../internals/adaptersContext";

/** Like the sheets' dismissal fallback: a view that never reports it's hidden can't hold the queue. */
const HIDDEN_FALLBACK_MS = 600;

type UseQueuedBottomSheetTurnOptions = Readonly<{
  /**
   * The view animates out after it loses its turn (e.g. a fading iOS modal): the next sheet waits
   * for `onHidden`, since iOS can't present a modal while another is still being dismissed.
   */
  waitsForHidden?: boolean;
  /** Every sheet is closing (`closeAllBottomSheets`): dismiss the view, it won't come back. */
  onClosingAll?: () => void;
}>;

type UseQueuedBottomSheetTurnReturn = Readonly<{
  /** Whether it may show now: the sheets queued before it are gone. */
  hasTurn: boolean;
  /** Sheets are locked (e.g. during a device action): don't let the user dismiss it. */
  areBottomSheetsLocked: boolean;
  /** The view is off screen after losing its turn: lets the next sheet in under `waitsForHidden`. */
  onHidden: () => void;
}>;

/**
 * For a view that isn't a sheet (e.g. a full screen) but must wait for the sheets before it: queues
 * while `isRequestingToBeOpened` and its screen is focused. It steps aside when another sheet is
 * forced in or its screen loses focus, and comes back once that sheet is gone or the screen is
 * focused again.
 */
export function useQueuedBottomSheetTurn(
  isRequestingToBeOpened: boolean,
  { waitsForHidden = false, onClosingAll }: UseQueuedBottomSheetTurnOptions = {},
): UseQueuedBottomSheetTurnReturn {
  const adapters = useQueuedBottomSheetAdapters();
  const isFocused = adapters.useIsScreenFocused();
  const areBottomSheetsLocked = adapters.useAreBottomSheetsLocked();
  const { addBottomSheetToQueue } = useQueuedBottomSheetContext();
  const [hasTurn, setHasTurn] = useState(false);
  // Bumped when a sheet forced in takes the turn, so a view still requested queues again behind it.
  const [preemptions, setPreemptions] = useState(0);
  const releaseOnHiddenRef = useRef<(() => void) | null>(null);
  const hiddenFallbackRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onClosingAllRef = useRef(onClosingAll);
  onClosingAllRef.current = onClosingAll;
  const wantsTurn = isRequestingToBeOpened && isFocused;

  const onHidden = useCallback(() => {
    clearTimeout(hiddenFallbackRef.current);
    const release = releaseOnHiddenRef.current;
    releaseOnHiddenRef.current = null;
    release?.();
  }, []);

  useEffect(() => {
    if (!wantsTurn) return;
    let isInQueue = true;
    let hadTurn = false;
    const removeFromQueue = () => {
      if (!isInQueue) return;
      isInQueue = false;
      queued.removeBottomSheetFromQueue();
    };
    const leave = () => {
      setHasTurn(false);
      if (hadTurn && waitsForHidden) {
        releaseOnHiddenRef.current = removeFromQueue;
        clearTimeout(hiddenFallbackRef.current);
        hiddenFallbackRef.current = setTimeout(onHidden, HIDDEN_FALLBACK_MS);
        return;
      }
      removeFromQueue();
    };
    const queued = addBottomSheetToQueue(
      {
        open: () => {
          hadTurn = true;
          setHasTurn(true);
        },
        close: reason => {
          // The queue already dropped it, unless it's the one on screen another sheet waits for.
          if (!hadTurn || reason === "closingAll") isInQueue = false;
          leave();
          if (reason === "closingAll") onClosingAllRef.current?.();
          else setPreemptions(count => count + 1);
        },
      },
      false,
    );
    return leave;
  }, [wantsTurn, addBottomSheetToQueue, waitsForHidden, preemptions, onHidden]);

  // Gone before its view reported it hidden: let the next sheet in now.
  useEffect(() => onHidden, [onHidden]);

  return { hasTurn: wantsTurn && hasTurn, areBottomSheetsLocked, onHidden };
}
