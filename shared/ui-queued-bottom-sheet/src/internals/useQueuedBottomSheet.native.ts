import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { BottomSheetProps, useBottomSheetRef } from "@ledgerhq/lumen-ui-rnative";
import {
  BottomSheetInQueue,
  useQueuedBottomSheetContext,
} from "../contexts/QueuedBottomSheetsContext";
import { useQueuedBottomSheetAdapters } from "./adaptersContext";
import { useBottomSheetBackgroundToneRequests } from "./useBottomSheetBackgroundToneRequests";

interface UseQueuedBottomSheetProps {
  isRequestingToBeOpened?: boolean;
  isForcingToBeOpened?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onHeaderClosePressed?: () => void;
  onBackdropPress?: () => void;
  onModalHide?: () => void;
  preventBackdropClick?: boolean;
}

type BottomSheetState = "idle" | "open" | "dismissing";

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
}: UseQueuedBottomSheetProps) {
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
    cleanupQueue();
  }, [clearDismissFallback, cleanupQueue]);

  const beginDismissing = useCallback(() => {
    stateRef.current = "dismissing";
    cleanupQueue();

    clearDismissFallback();
    dismissFallbackRef.current = setTimeout(() => {
      dismissFallbackRef.current = null;
      if (stateRef.current !== "dismissing") return;

      logBottomSheet("onDismiss never arrived - settling this sheet as closed");
      settleClosed();
      setReopenCheckSignal(s => s + 1);
    }, DISMISS_FALLBACK_DELAY_MS);
  }, [cleanupQueue, clearDismissFallback, logBottomSheet, settleClosed]);

  // Hiding the keyboard resizes the sheet container. Doing it while the sheet is already animating
  // out makes the underlying bottom sheet re-evaluate its position mid-close, which can leave it
  // mounted at the closed position. Retracting the keyboard as soon as a close begins keeps the
  // closing layout stable.
  const dismissKeyboard = useCallback(() => {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }
  }, []);

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
      logBottomSheet("Close signalled while already dismissing - re-issuing dismiss");
      bottomSheetRef.current?.dismiss();
      return;
    }

    logBottomSheet("Closing drawer");
    beginDismissing();
    dismissKeyboard();

    bottomSheetRef.current?.dismiss();
    onCloseRef.current?.();
  }, [beginDismissing, bottomSheetRef, cleanupQueue, dismissKeyboard, logBottomSheet]);

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
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef, dismissKeyboard, logBottomSheet]);

  // Notifies the consumer of the explicit backdrop press before dismissing. Unlike onClose
  // (which fires for any closing reason), this reflects a real user close interaction.
  const handleBackdropPress = useCallback(() => {
    logBottomSheet("Backdrop pressed");
    onBackdropPressRef.current?.();
    handleUserClose();
  }, [handleUserClose, logBottomSheet]);

  const handleHeaderClosePressed = useCallback(() => {
    if (stateRef.current === "dismissing") return;

    logBottomSheet("Header close pressed");
    beginDismissing();
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
        const restoredWhileDismissing = fromIndex === -1 && stateRef.current === "dismissing";
        if (restoredWhileDismissing) {
          logBottomSheet("Sheet opening while considered closed - dismissing it again");
          bottomSheetRef.current?.dismiss();
        }

        return;
      }

      if (toIndex === -1 && stateRef.current === "open") {
        logBottomSheet("Close animation started");
        beginDismissing();
        dismissKeyboard();
        onCloseRef.current?.();
      }
    },
    [beginDismissing, bottomSheetRef, dismissKeyboard, logBottomSheet],
  );

  const handleDismiss = useCallback(() => {
    logBottomSheet("BottomSheet dismissed (onDismiss)");

    dismissKeyboard();

    // Fallback for dismissals that bypass the close animation (and thus handleAnimate).
    if (stateRef.current === "open") {
      onCloseRef.current?.();
    }

    settleClosed();
    onModalHideRef.current?.();

    // Defer the "should we reopen?" decision to the open/close effect below. Bumping the signal
    // forces a re-render; by the time the effect runs, React has committed any state update
    // scheduled by the consumer's onClose (called from handleAnimate), so reading
    // isRequestingToBeOpened reflects the user's true intent — false for a normal backdrop close,
    // true only if the consumer genuinely re-requested while the sheet was closing.
    setReopenCheckSignal(s => s + 1);
  }, [dismissKeyboard, logBottomSheet, settleClosed]);

  useEffect(() => {
    if (!isFocused && (isRequestingToBeOpened || isForcingToBeOpened)) {
      logBottomSheet("Closing drawer - screen not focused");
      handleClose();
      return;
    }

    if ((isRequestingToBeOpened || isForcingToBeOpened) && !bottomSheetInQueueRef.current) {
      enqueueBottomSheet();

      return () => {
        logBottomSheet("Effect cleanup - closing drawer");
        handleClose();
      };
    }
  }, [
    isFocused,
    isForcingToBeOpened,
    isRequestingToBeOpened,
    handleClose,
    enqueueBottomSheet,
    logBottomSheet,
    reopenCheckSignal,
  ]);

  useEffect(() => {
    return () => {
      logBottomSheet("Component unmounting - cleaning up");
      clearDismissFallback();
      cleanupQueue();
    };
  }, [cleanupQueue, clearDismissFallback, logBottomSheet]);

  return {
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
