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

// How long a blur must persist before it is treated as the user leaving the screen.
// Resolving a deeplink rewrites the navigation state, which blurs the current screen and
// refocuses it a frame or two later. Acting on the first blur therefore dismisses a sheet the
// user is still looking at, so wait for the blur to be confirmed. The window only has to
// outlast that refocus: a real navigation stays blurred and still closes, just this much later.
const BLUR_CLOSE_CONFIRMATION_MS = 500;

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
  // Read inside the deferred blur check so it sees the current focus rather than the value
  // captured when the blur was first observed.
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;
  const blurCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  // the consumer's onClose (from handleCloseAnimationStart) has been applied before we read
  // isRequestingToBeOpened — otherwise a fast backdrop dismiss could see a stale `true` and
  // re-enqueue the drawer.
  const [reopenCheckSignal, setReopenCheckSignal] = useState(0);

  const cleanupQueue = useCallback(() => {
    if (bottomSheetInQueueRef.current) {
      bottomSheetInQueueRef.current.removeBottomSheetFromQueue();
      bottomSheetInQueueRef.current = undefined;
    }
  }, []);

  const handleOpen = useCallback(() => {
    if (stateRef.current !== "idle") return;

    logBottomSheet("Opening drawer");
    stateRef.current = "open";
    bottomSheetRef.current?.present();
  }, [bottomSheetRef, logBottomSheet]);

  const handleClose = useCallback(() => {
    const state = stateRef.current;

    if (state === "idle") {
      cleanupQueue();
      return;
    }

    if (state === "dismissing") return;

    logBottomSheet("Closing drawer");
    stateRef.current = "dismissing";
    bottomSheetRef.current?.dismiss();
    onCloseRef.current?.();
  }, [bottomSheetRef, cleanupQueue, logBottomSheet]);

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
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef, logBottomSheet]);

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
    stateRef.current = "dismissing";
    onHeaderClosePressedRef.current?.();
    onCloseRef.current?.();
  }, [logBottomSheet]);

  // Fired at the START of an animation. A close animation targets index -1, so this is the
  // earliest deterministic signal that the sheet is closing — for the X (close) button, the
  // backdrop and the pan-down gesture alike. We clear consumer state here rather than waiting for
  // onDismiss (which the X button defers until the close animation finishes). Otherwise a tap on
  // another trigger during the close window sets new state that the late onDismiss would wipe,
  // forcing the user to tap twice. Queue cleanup stays in onDismiss to preserve overlap protection.
  const handleCloseAnimationStart = useCallback(
    (_fromIndex: number, toIndex: number) => {
      if (toIndex === -1 && stateRef.current === "open") {
        logBottomSheet("Close animation started");
        stateRef.current = "dismissing";
        onCloseRef.current?.();
      }
    },
    [logBottomSheet],
  );

  const handleDismiss = useCallback(() => {
    logBottomSheet("BottomSheet dismissed (onDismiss)");

    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }

    // Fallback for dismissals that bypass the close animation (and thus handleCloseAnimationStart).
    if (stateRef.current === "open") {
      onCloseRef.current?.();
    }

    stateRef.current = "idle";
    cleanupQueue();
    onModalHideRef.current?.();

    // Defer the "should we reopen?" decision to the open/close effect below. Bumping the signal
    // forces a re-render; by the time the effect runs, React has committed any state update
    // scheduled by the consumer's onClose (called from handleCloseAnimationStart), so reading
    // isRequestingToBeOpened reflects the user's true intent — false for a normal backdrop close,
    // true only if the consumer genuinely re-requested while the sheet was closing.
    setReopenCheckSignal(s => s + 1);
  }, [cleanupQueue, logBottomSheet]);

  const cancelPendingBlurClose = useCallback(() => {
    if (blurCloseTimeoutRef.current) {
      clearTimeout(blurCloseTimeoutRef.current);
      blurCloseTimeoutRef.current = null;
    }
  }, []);

  // Closing used to ride on this effect's cleanup, which React re-runs on every dependency
  // change — including `isFocused` flipping. A blur therefore dismissed the sheet before the
  // body below could decide whether the blur was real. Each reason to close is now explicit,
  // and unmount is handled by the teardown effect at the end of the hook.
  useEffect(() => {
    const wantsToBeOpen = isRequestingToBeOpened || isForcingToBeOpened;

    if (!wantsToBeOpen) {
      cancelPendingBlurClose();
      handleClose();
      return;
    }

    if (!isFocused) {
      if (blurCloseTimeoutRef.current) return;

      blurCloseTimeoutRef.current = setTimeout(() => {
        blurCloseTimeoutRef.current = null;
        if (isFocusedRef.current) return;

        logBottomSheet("Closing drawer - screen not focused");
        handleClose();
      }, BLUR_CLOSE_CONFIRMATION_MS);

      return;
    }

    // Focused again, so any pending blur was not the user leaving: drop it before it can
    // dismiss a sheet that is back on screen.
    cancelPendingBlurClose();

    if (!bottomSheetInQueueRef.current) {
      enqueueBottomSheet();
    }
  }, [
    isFocused,
    isForcingToBeOpened,
    isRequestingToBeOpened,
    handleClose,
    enqueueBottomSheet,
    logBottomSheet,
    cancelPendingBlurClose,
    reopenCheckSignal,
  ]);

  // Read through a ref so this teardown never re-runs mid-life: it must fire on unmount only,
  // which is what stops a departing screen from leaving its sheet behind.
  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  useEffect(() => {
    return () => {
      logBottomSheet("Component unmounting - cleaning up");
      cancelPendingBlurClose();
      handleCloseRef.current();
      cleanupQueue();
    };
  }, [cleanupQueue, cancelPendingBlurClose, logBottomSheet]);

  return {
    bottomSheetRef,
    areBottomSheetsLocked,
    handleUserClose,
    handleBackdropPress,
    handleHeaderClosePressed,
    handleDismiss,
    handleCloseAnimationStart,
    onBack,
    enablePanDownToClose: !areBottomSheetsLocked && !preventBackdropClick,
    backgroundContextValue,
    backgroundComponent,
  };
}
