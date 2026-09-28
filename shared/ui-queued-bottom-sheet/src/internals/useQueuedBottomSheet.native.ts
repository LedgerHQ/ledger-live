import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { BottomSheetProps, useBottomSheetRef } from "@ledgerhq/lumen-ui-rnative";
import {
  BottomSheetInQueue,
  useQueuedBottomSheetContext,
} from "../contexts/QueuedBottomSheetsContext";
import { useQueuedBottomSheetAdapters } from "./adaptersContext";
import { useBottomSheetBackgroundToneRequests } from "./useBottomSheetBackgroundToneRequests";
import {
  isBottomSheetKeyboardOwnedByAnother,
  releaseBottomSheetKeyboard,
} from "./bottomSheetKeyboardOwnership";

interface UseQueuedBottomSheetProps {
  isRequestingToBeOpened?: boolean;
  isForcingToBeOpened?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onHeaderClosePressed?: () => void;
  onBackdropPress?: () => void;
  onModalHide?: () => void;
  preventBackdropClick?: boolean;
  restoreOnFocus?: boolean;
}

type BottomSheetState = "idle" | "open" | "restored" | "closing" | "dismissing";

const isOnScreen = (state: BottomSheetState) => state === "open" || state === "restored";
const isLeaving = (state: BottomSheetState) => state === "closing" || state === "dismissing";

const DISMISS_FALLBACK_DELAY_MS = 600;

export function useQueuedBottomSheet({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
  onHeaderClosePressed,
  onBackdropPress,
  onModalHide,
  preventBackdropClick,
  restoreOnFocus = false,
}: UseQueuedBottomSheetProps) {
  const sheetId = useId();
  const adapters = useQueuedBottomSheetAdapters();
  const logRef = useRef(adapters.log);
  logRef.current = adapters.log;
  const logBottomSheet = useCallback(
    (message: string, data?: Record<string, unknown> | number | string) =>
      logRef.current(message, data),
    [],
  );

  const { backgroundTone, backgroundContextValue } = useBottomSheetBackgroundToneRequests();
  const { addBottomSheetToQueue } = useQueuedBottomSheetContext();
  const bottomSheetInQueueRef = useRef<BottomSheetInQueue | undefined>(undefined);
  const bottomSheetRef = useBottomSheetRef();
  const isFocused = adapters.useIsScreenFocused();
  // Read from the effect cleanup below, which runs after the render that took the focus away.
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;
  const areBottomSheetsLocked = adapters.useAreBottomSheetsLocked();
  const backgroundComponent: BottomSheetProps["backgroundComponent"] = backgroundTone
    ? adapters.backgroundComponentByTone?.[backgroundTone]
    : undefined;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const onHeaderClosePressedRef = useRef(onHeaderClosePressed);
  onHeaderClosePressedRef.current = onHeaderClosePressed;

  const onBackdropPressRef = useRef(onBackdropPress);
  onBackdropPressRef.current = onBackdropPress;

  const onModalHideRef = useRef(onModalHide);
  onModalHideRef.current = onModalHide;

  const stateRef = useRef<BottomSheetState>("idle");

  // A dismissal started for one presentation can land on the next one. Only an onDismiss arriving
  // while one is still unacknowledged can be that stale dismissal; any other is the user closing
  // the sheet through a path gorhom did not report, like a pan-down during the entrance animation.
  const isDismissInFlightRef = useRef(false);

  // Bumped at the end of handleDismiss to re-trigger the open/close effect below. This defers
  // the "should we reopen?" decision to a React commit, ensuring any state update scheduled by
  // the consumer's onClose (from handleAnimate) has been applied before we read
  // isRequestingToBeOpened — otherwise a fast backdrop dismiss could see a stale `true` and
  // re-enqueue the drawer.
  const [reopenCheckSignal, setReopenCheckSignal] = useState(0);

  const wantsToBeOpenRef = useRef(false);
  wantsToBeOpenRef.current = isRequestingToBeOpened || isForcingToBeOpened;

  const cleanupQueue = useCallback(() => {
    if (bottomSheetInQueueRef.current) {
      bottomSheetInQueueRef.current.removeBottomSheetFromQueue();
      bottomSheetInQueueRef.current = undefined;
    }
  }, []);

  const requestDismiss = useCallback(() => {
    if (stateRef.current !== "idle") {
      stateRef.current = "dismissing";
    }
    isDismissInFlightRef.current = true;
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef]);

  const dismissFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissFallback = useCallback(() => {
    if (dismissFallbackRef.current) {
      clearTimeout(dismissFallbackRef.current);
      dismissFallbackRef.current = null;
    }
  }, []);

  const settleClosed = useCallback(() => {
    clearDismissFallback();
    stateRef.current = "idle";
    releaseBottomSheetKeyboard(sheetId);
    cleanupQueue();
  }, [clearDismissFallback, cleanupQueue, sheetId]);

  const beginDismissing = useCallback(() => {
    if (stateRef.current !== "dismissing") {
      stateRef.current = "closing";
    }
    isDismissInFlightRef.current = true;
    cleanupQueue();

    clearDismissFallback();
    dismissFallbackRef.current = setTimeout(() => {
      dismissFallbackRef.current = null;
      if (!isLeaving(stateRef.current)) return;

      logBottomSheet("onDismiss never arrived - settling this sheet as closed");
      settleClosed();
      setReopenCheckSignal(s => s + 1);
    }, DISMISS_FALLBACK_DELAY_MS);
  }, [cleanupQueue, clearDismissFallback, logBottomSheet, settleClosed]);

  // Hiding the keyboard resizes the sheet container. Doing it while the sheet is already animating
  // out makes the underlying bottom sheet re-evaluate its position mid-close, which can leave it
  // mounted at the closed position. Retracting the keyboard as soon as a close begins keeps the
  // closing layout stable.
  //
  // `Keyboard.dismiss()` is global though: on a hand-off the sheet taking over has already focused
  // its field by the time this one finishes closing, so skip the dismiss unless we raised the
  // keyboard ourselves.
  const dismissKeyboard = useCallback(() => {
    if (!Keyboard.isVisible()) return;

    if (isBottomSheetKeyboardOwnedByAnother(sheetId)) {
      logBottomSheet("Keyboard was raised by another sheet - leaving it up");
      return;
    }

    Keyboard.dismiss();
  }, [logBottomSheet, sheetId]);

  // Closing a sheet often also clears the reason the sheet queued behind it wanted to be open, so
  // by the time the queue promotes us our consumer may no longer want us. Presenting anyway leaves
  // an empty sheet on screen that swallows the next tap, so decline the promotion instead.
  const handleOpen = useCallback(() => {
    if (stateRef.current !== "idle") return;

    if (!wantsToBeOpenRef.current) {
      logBottomSheet("Promoted by the queue but no longer requested - releasing the slot");
      cleanupQueue();
      return;
    }

    logBottomSheet("Opening drawer");
    clearDismissFallback();
    stateRef.current = "open";
    bottomSheetRef.current?.present();
  }, [bottomSheetRef, cleanupQueue, clearDismissFallback, logBottomSheet]);

  const handleClose = useCallback(() => {
    const state = stateRef.current;

    if (state === "idle") {
      cleanupQueue();
      return;
    }

    if (state === "dismissing") {
      logBottomSheet("Close signalled while already on its way out - nothing to re-issue");
      return;
    }

    if (state === "closing") {
      logBottomSheet("Close signalled while only minimized - dismissing for real");
      requestDismiss();
      return;
    }

    logBottomSheet("Closing drawer");
    beginDismissing();
    dismissKeyboard();

    requestDismiss();
    onCloseRef.current?.();
  }, [beginDismissing, cleanupQueue, dismissKeyboard, logBottomSheet, requestDismiss]);

  // A screen losing focus is not the user dismissing the drawer. Under `restoreOnFocus` the
  // consumer is not told, so it keeps requesting the drawer and the effect below presents it again
  // once the screen is focused. The later onDismiss sees a sheet already dismissing, so it reports
  // nothing either.
  const hideWhileUnfocused = useCallback(() => {
    if (!isOnScreen(stateRef.current)) {
      cleanupQueue();
      return;
    }

    logBottomSheet("Hiding drawer - screen not focused");
    beginDismissing();
    dismissKeyboard();
    requestDismiss();
  }, [beginDismissing, cleanupQueue, dismissKeyboard, logBottomSheet, requestDismiss]);

  // Adds this drawer to the queue. The queue decides when to actually open/close it via the
  // open/close state handlers.
  const enqueueBottomSheet = useCallback(() => {
    if (bottomSheetInQueueRef.current) return;

    bottomSheetInQueueRef.current = addBottomSheetToQueue(
      { open: handleOpen, close: handleClose },
      isForcingToBeOpened,
    );
  }, [addBottomSheetToQueue, handleOpen, handleClose, isForcingToBeOpened]);

  const handleUserClose = useCallback(() => {
    logBottomSheet("User initiated close");
    dismissKeyboard();
    requestDismiss();
  }, [dismissKeyboard, logBottomSheet, requestDismiss]);

  // Notifies the consumer of the explicit backdrop press before dismissing. Unlike onClose
  // (which fires for any closing reason), this reflects a real user close interaction.
  const handleBackdropPress = useCallback(() => {
    logBottomSheet("Backdrop pressed");
    onBackdropPressRef.current?.();
    handleUserClose();
  }, [handleUserClose, logBottomSheet]);

  const handleHeaderClosePressed = useCallback(() => {
    if (isLeaving(stateRef.current)) return;

    logBottomSheet("Header close pressed");
    beginDismissing();
    stateRef.current = "dismissing";
    dismissKeyboard();
    onHeaderClosePressedRef.current?.();
    onCloseRef.current?.();
  }, [beginDismissing, dismissKeyboard, logBottomSheet]);

  // Fired at the START of an animation. A close animation targets index -1, so this is the
  // earliest deterministic signal that the sheet is closing — for the X (close) button, the
  // backdrop and the pan-down gesture alike. We clear consumer state here rather than waiting for
  // onDismiss (which the X button defers until the close animation finishes). Otherwise a tap on
  // another trigger during the close window sets new state that the late onDismiss would wipe,
  // forcing the user to tap twice.
  const handleAnimate = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex >= 0) {
        const arrivingWhileConsideredClosed = fromIndex === -1 && !isOnScreen(stateRef.current);
        if (arrivingWhileConsideredClosed) {
          logBottomSheet("Sheet opening while considered closed - dismissing it again");
          requestDismiss();
        }

        return;
      }

      if (toIndex === -1 && isOnScreen(stateRef.current)) {
        logBottomSheet("Close animation started");
        beginDismissing();
        dismissKeyboard();
        onCloseRef.current?.();
      }
    },
    [beginDismissing, dismissKeyboard, logBottomSheet, requestDismiss],
  );

  const handleDismiss = useCallback(() => {
    logBottomSheet("BottomSheet dismissed (onDismiss)");

    const state = stateRef.current;
    const dismissedPresentationStillWanted =
      state === "open" && wantsToBeOpenRef.current && isDismissInFlightRef.current;
    isDismissInFlightRef.current = false;

    if (dismissedPresentationStillWanted) {
      logBottomSheet("Dismissed a presentation still being requested - presenting it again");
      stateRef.current = "restored";
      bottomSheetRef.current?.present();
      return;
    }

    dismissKeyboard();

    if (isOnScreen(state)) {
      stateRef.current = "dismissing";
      onCloseRef.current?.();
      requestDismiss();
    } else if (state === "dismissing" && dismissFallbackRef.current === null) {
      onCloseRef.current?.();
    }

    isDismissInFlightRef.current = false;
    settleClosed();
    onModalHideRef.current?.();

    // Defer the "should we reopen?" decision to the open/close effect below. Bumping the signal
    // forces a re-render; by the time the effect runs, React has committed any state update
    // scheduled by the consumer's onClose (called from handleAnimate), so reading
    // isRequestingToBeOpened reflects the user's true intent — false for a normal backdrop close,
    // true only if the consumer genuinely re-requested while the sheet was closing.
    setReopenCheckSignal(s => s + 1);
  }, [bottomSheetRef, dismissKeyboard, logBottomSheet, requestDismiss, settleClosed]);

  useEffect(() => {
    if (!isFocused && (isRequestingToBeOpened || isForcingToBeOpened)) {
      if (restoreOnFocus) {
        hideWhileUnfocused();
        return;
      }

      logBottomSheet("Closing drawer - screen not focused");
      handleClose();
      return;
    }

    if ((isRequestingToBeOpened || isForcingToBeOpened) && !bottomSheetInQueueRef.current) {
      enqueueBottomSheet();

      return () => {
        if (restoreOnFocus && !isFocusedRef.current) {
          hideWhileUnfocused();
          return;
        }

        logBottomSheet("Effect cleanup - closing drawer");
        handleClose();
      };
    }
  }, [
    isFocused,
    isForcingToBeOpened,
    isRequestingToBeOpened,
    handleClose,
    hideWhileUnfocused,
    restoreOnFocus,
    enqueueBottomSheet,
    logBottomSheet,
    reopenCheckSignal,
  ]);

  useEffect(() => {
    return () => {
      logBottomSheet("Component unmounting - cleaning up");
      clearDismissFallback();
      releaseBottomSheetKeyboard(sheetId);
      cleanupQueue();
    };
  }, [cleanupQueue, clearDismissFallback, logBottomSheet, sheetId]);

  return {
    sheetId,
    bottomSheetRef,
    areBottomSheetsLocked,
    handleUserClose,
    handleBackdropPress,
    handleHeaderClosePressed,
    handleDismiss,
    handleAnimate,
    onBack,
    enablePanDownToClose: !areBottomSheetsLocked && !preventBackdropClick,
    backgroundContextValue,
    backgroundComponent,
  };
}
