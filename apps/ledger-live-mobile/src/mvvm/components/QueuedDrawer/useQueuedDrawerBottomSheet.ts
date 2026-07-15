import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { BottomSheetProps, useBottomSheetRef } from "@ledgerhq/lumen-ui-rnative";
import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { isModalLockedSelector } from "~/reducers/appstate";
import { bottomSheetGradientByTone } from "LLM/components/BottomSheetGradient";
import { useBottomSheetBackgroundToneRequests } from "LLM/hooks/useBottomSheetBackgroundToneRequests";
import { DrawerInQueue, useQueuedDrawerContext } from "./QueuedDrawersContext";
import { logDrawer } from "./utils/logDrawer";

interface UseQueuedDrawerBottomSheetProps {
  isRequestingToBeOpened?: boolean;
  isForcingToBeOpened?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onHeaderClosePressed?: () => void;
  onBackdropPress?: () => void;
  onModalHide?: () => void;
  preventBackdropClick?: boolean;
}

type DrawerState = "idle" | "open" | "dismissing";

const useQueuedDrawerBottomSheet = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
  onHeaderClosePressed,
  onBackdropPress,
  onModalHide,
  preventBackdropClick,
}: UseQueuedDrawerBottomSheetProps) => {
  const { backgroundTone, backgroundContextValue } = useBottomSheetBackgroundToneRequests();
  const { addDrawerToQueue } = useQueuedDrawerContext();
  const drawerInQueueRef = useRef<DrawerInQueue | undefined>(undefined);
  const bottomSheetRef = useBottomSheetRef();
  const isFocused = useIsFocused();
  const areDrawersLocked = useSelector(isModalLockedSelector);
  const backgroundComponent: BottomSheetProps["backgroundComponent"] = backgroundTone
    ? bottomSheetGradientByTone[backgroundTone]
    : undefined;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const onHeaderClosePressedRef = useRef(onHeaderClosePressed);
  onHeaderClosePressedRef.current = onHeaderClosePressed;

  const onBackdropPressRef = useRef(onBackdropPress);
  onBackdropPressRef.current = onBackdropPress;

  const onModalHideRef = useRef(onModalHide);
  onModalHideRef.current = onModalHide;

  const stateRef = useRef<DrawerState>("idle");

  // Bumped at the end of handleDismiss to re-trigger the open/close effect below. This defers
  // the "should we reopen?" decision to a React commit, ensuring any state update scheduled by
  // the consumer's onClose (from handleCloseAnimationStart) has been applied before we read
  // isRequestingToBeOpened — otherwise a fast backdrop dismiss could see a stale `true` and
  // re-enqueue the drawer.
  const [reopenCheckSignal, setReopenCheckSignal] = useState(0);

  const cleanupQueue = useCallback(() => {
    if (drawerInQueueRef.current) {
      drawerInQueueRef.current.removeDrawerFromQueue();
      drawerInQueueRef.current = undefined;
    }
  }, []);

  const handleOpen = useCallback(() => {
    if (stateRef.current !== "idle") return;

    logDrawer("Opening drawer");
    stateRef.current = "open";
    bottomSheetRef.current?.present();
  }, [bottomSheetRef]);

  const handleClose = useCallback(() => {
    const state = stateRef.current;

    if (state === "idle") {
      cleanupQueue();
      return;
    }

    if (state === "dismissing") return;

    logDrawer("Closing drawer");
    stateRef.current = "dismissing";
    bottomSheetRef.current?.dismiss();
    onCloseRef.current?.();
  }, [bottomSheetRef, cleanupQueue]);

  // Adds this drawer to the queue. The queue decides when to actually open/close it via the
  // onDrawerStateChanged callback.
  const enqueueDrawer = useCallback(() => {
    if (drawerInQueueRef.current) return;

    const onDrawerStateChanged = (isOpen: boolean) => {
      if (isOpen) {
        handleOpen();
      } else {
        handleClose();
      }
    };

    drawerInQueueRef.current = addDrawerToQueue(onDrawerStateChanged, isForcingToBeOpened);
  }, [addDrawerToQueue, handleOpen, handleClose, isForcingToBeOpened]);

  const handleUserClose = useCallback(() => {
    logDrawer("User initiated close");
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef]);

  // Notifies the consumer of the explicit backdrop press before dismissing. Unlike onClose
  // (which fires for any closing reason), this reflects a real user close interaction.
  const handleBackdropPress = useCallback(() => {
    logDrawer("Backdrop pressed");
    onBackdropPressRef.current?.();
    handleUserClose();
  }, [handleUserClose]);

  const handleHeaderClosePressed = useCallback(() => {
    if (stateRef.current === "dismissing") return;

    logDrawer("Header close pressed");
    stateRef.current = "dismissing";
    onHeaderClosePressedRef.current?.();
    onCloseRef.current?.();
  }, []);

  // Fired at the START of an animation. A close animation targets index -1, so this is the
  // earliest deterministic signal that the sheet is closing — for the X (close) button, the
  // backdrop and the pan-down gesture alike. We clear consumer state here rather than waiting for
  // onDismiss (which the X button defers until the close animation finishes). Otherwise a tap on
  // another trigger during the close window sets new state that the late onDismiss would wipe,
  // forcing the user to tap twice. Queue cleanup stays in onDismiss to preserve overlap protection.
  const handleCloseAnimationStart = useCallback((_fromIndex: number, toIndex: number) => {
    if (toIndex === -1 && stateRef.current === "open") {
      logDrawer("Close animation started");
      stateRef.current = "dismissing";
      onCloseRef.current?.();
    }
  }, []);

  const handleDismiss = useCallback(() => {
    logDrawer("BottomSheet dismissed (onDismiss)");

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
  }, [cleanupQueue]);

  useEffect(() => {
    if (!isFocused && (isRequestingToBeOpened || isForcingToBeOpened)) {
      logDrawer("Closing drawer - screen not focused");
      handleClose();
      return;
    }

    if ((isRequestingToBeOpened || isForcingToBeOpened) && !drawerInQueueRef.current) {
      enqueueDrawer();

      return () => {
        logDrawer("Effect cleanup - closing drawer");
        handleClose();
      };
    }
  }, [
    isFocused,
    isForcingToBeOpened,
    isRequestingToBeOpened,
    handleClose,
    enqueueDrawer,
    reopenCheckSignal,
  ]);

  useEffect(() => {
    return () => {
      logDrawer("Component unmounting - cleaning up");
      cleanupQueue();
    };
  }, [cleanupQueue]);

  return {
    bottomSheetRef,
    areDrawersLocked,
    handleUserClose,
    handleBackdropPress,
    handleHeaderClosePressed,
    handleDismiss,
    handleCloseAnimationStart,
    onBack,
    enablePanDownToClose: !areDrawersLocked && !preventBackdropClick,
    backgroundContextValue,
    backgroundComponent,
  };
};

export default useQueuedDrawerBottomSheet;
