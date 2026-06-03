import { useCallback, useEffect, useRef } from "react";
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
  onModalHide?: () => void;
  preventBackdropClick?: boolean;
}

type DrawerState = "idle" | "open" | "dismissing";

const useQueuedDrawerBottomSheet = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
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

  const onModalHideRef = useRef(onModalHide);
  onModalHideRef.current = onModalHide;

  // Mirror the latest props into refs so the stable callbacks below (handleDismiss must keep a
  // stable identity) can read current values without being recreated on every render.
  const isRequestingToBeOpenedRef = useRef(isRequestingToBeOpened);
  isRequestingToBeOpenedRef.current = isRequestingToBeOpened;

  const isForcingToBeOpenedRef = useRef(isForcingToBeOpened);
  isForcingToBeOpenedRef.current = isForcingToBeOpened;

  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;

  const stateRef = useRef<DrawerState>("idle");

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
  // onDrawerStateChanged callback. Kept stable so it can be reused both from the effect and from
  // handleDismiss (to reopen a drawer that was re-requested while closing).
  const enqueueDrawer = useCallback(() => {
    if (drawerInQueueRef.current) return;

    const onDrawerStateChanged = (isOpen: boolean) => {
      if (isOpen) {
        handleOpen();
      } else {
        handleClose();
      }
    };

    drawerInQueueRef.current = addDrawerToQueue(
      onDrawerStateChanged,
      isForcingToBeOpenedRef.current,
    );
  }, [addDrawerToQueue, handleOpen, handleClose]);

  // Held in a ref so handleDismiss can reopen via the latest enqueueDrawer while keeping a stable
  // identity (it must not be recreated when other deps, e.g. onModalHide, change).
  const enqueueDrawerRef = useRef(enqueueDrawer);
  enqueueDrawerRef.current = enqueueDrawer;

  const handleUserClose = useCallback(() => {
    logDrawer("User initiated close");
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef]);

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

    // If the consumer re-requested this drawer while it was closing (e.g. the user tapped another
    // trigger before the X-button close animation finished), reopen it now that the previous sheet
    // has fully dismissed. Presenting only after onDismiss keeps the no-overlap guarantee.
    if (
      isFocusedRef.current &&
      (isRequestingToBeOpenedRef.current || isForcingToBeOpenedRef.current)
    ) {
      logDrawer("Reopening drawer requested during close");
      enqueueDrawerRef.current();
    }
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
  }, [isFocused, isForcingToBeOpened, isRequestingToBeOpened, handleClose, enqueueDrawer]);

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
    handleDismiss,
    handleCloseAnimationStart,
    onBack,
    enablePanDownToClose: !areDrawersLocked && !preventBackdropClick,
    backgroundContextValue,
    backgroundComponent,
  };
};

export default useQueuedDrawerBottomSheet;
