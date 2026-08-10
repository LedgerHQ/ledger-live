import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { isModalLockedSelector } from "~/reducers/appstate";
import { DrawerInQueue, useQueuedDrawerContext } from "./QueuedDrawersContext";
import { logDrawer } from "./utils/logDrawer";

interface UseQueuedDrawerNativeProps {
  isRequestingToBeOpened?: boolean;
  isForcingToBeOpened?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onModalHide?: () => void;
  preventBackdropClick?: boolean;
  preventKeyboardDismissOnClose?: boolean;
}

// LIVE-DEBUG(drawer-stuck): monotonic per-mount id so interleaved drawers stay
// distinguishable in the logs (transfer sheet vs modular drawer vs security modal).
let drawerInstanceCounter = 0;

const useQueuedDrawerNative = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
  onModalHide,
  preventBackdropClick,
  preventKeyboardDismissOnClose = false,
}: UseQueuedDrawerNativeProps) => {
  const { addDrawerToQueue } = useQueuedDrawerContext();
  const drawerInQueueRef = useRef<DrawerInQueue | undefined>(undefined);
  const isFocused = useIsFocused();
  const areDrawersLocked = useSelector(isModalLockedSelector);

  const instanceIdRef = useRef<number | undefined>(undefined);
  if (instanceIdRef.current === undefined) {
    instanceIdRef.current = ++drawerInstanceCounter;
  }
  const instanceId = instanceIdRef.current;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const onModalHideRef = useRef(onModalHide);
  onModalHideRef.current = onModalHide;

  const [isVisible, setIsVisible] = useState(false);
  const isClosedRef = useRef(true);

  const cleanupQueue = useCallback(() => {
    if (drawerInQueueRef.current) {
      drawerInQueueRef.current.removeDrawerFromQueue();
      drawerInQueueRef.current = undefined;
    }
  }, []);

  const handleOpen = useCallback(() => {
    // LIVE-DEBUG(drawer-stuck): log the early return too — a swallowed open is
    // indistinguishable from "never requested" in the current logs.
    if (!isClosedRef.current) {
      logDrawer("handleOpen SKIPPED (isClosedRef already false)", { instanceId });
      return;
    }
    logDrawer("Opening native modal", { instanceId });
    isClosedRef.current = false;
    setIsVisible(true);
  }, [instanceId]);

  const handleClose = useCallback(() => {
    const wasAlreadyClosed = isClosedRef.current;

    if (!wasAlreadyClosed) {
      logDrawer("Closing native modal", { instanceId });
      isClosedRef.current = true;
      setIsVisible(false);
    } else {
      // LIVE-DEBUG(drawer-stuck): THE suspect branch. isClosedRef is already true
      // so setIsVisible(false) is skipped — if the Modal is still mounted visible
      // at this point it can never be hidden again.
      logDrawer("handleClose SKIPPED setIsVisible(false) (isClosedRef already true)", {
        instanceId,
      });
    }

    // Always cleanup queue and call onClose, even if drawer was never opened
    // This ensures parent state is reset and next drawer can open
    cleanupQueue();
    onCloseRef.current?.();
  }, [cleanupQueue, instanceId]);

  const handleUserClose = useCallback(() => {
    // LIVE-DEBUG(drawer-stuck): note this path does NOT touch isClosedRef, so it
    // can desynchronise the ref from isVisible.
    logDrawer("User initiated close (native) - isClosedRef left untouched", { instanceId });
    setIsVisible(false);
  }, [instanceId]);

  const handleDismiss = useCallback(() => {
    logDrawer("Native modal dismissed", { instanceId, isClosedRef: isClosedRef.current });
    if (!preventKeyboardDismissOnClose) {
      Keyboard.dismiss();
    }
    handleClose();
    onModalHideRef.current?.();
  }, [handleClose, preventKeyboardDismissOnClose, instanceId]);

  // Queue management effect
  useEffect(() => {
    // LIVE-DEBUG(drawer-stuck): every re-run of this effect is a candidate for the
    // close/re-add cycle that can leave the Modal visible with a parked transform.
    logDrawer("queue effect run", {
      instanceId,
      isFocused,
      isRequestingToBeOpened,
      isForcingToBeOpened,
      alreadyInQueue: !!drawerInQueueRef.current,
      isClosedRef: isClosedRef.current,
    });

    if (!isFocused && (isRequestingToBeOpened || isForcingToBeOpened)) {
      logDrawer("Closing drawer - screen not focused (native)", { instanceId });
      handleClose();
      return;
    }

    if ((isRequestingToBeOpened || isForcingToBeOpened) && !drawerInQueueRef.current) {
      const onDrawerStateChanged = (isOpen: boolean) => {
        logDrawer("queue -> onDrawerStateChanged", { instanceId, isOpen });
        if (isOpen) {
          handleOpen();
        } else {
          handleClose();
        }
      };

      drawerInQueueRef.current = addDrawerToQueue(onDrawerStateChanged, isForcingToBeOpened);

      return () => {
        logDrawer("Effect cleanup - closing native modal", { instanceId });
        handleClose();
      };
    }
  }, [
    instanceId,
    addDrawerToQueue,
    isFocused,
    isForcingToBeOpened,
    isRequestingToBeOpened,
    handleOpen,
    handleClose,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logDrawer("Component unmounting - cleaning up (native)", { instanceId });
      cleanupQueue();
    };
  }, [cleanupQueue, instanceId]);

  const enablePanDownToClose = useMemo(
    () => !areDrawersLocked && !preventBackdropClick,
    [areDrawersLocked, preventBackdropClick],
  );
  const showBackdropPress = useMemo(
    () => areDrawersLocked || preventBackdropClick,
    [areDrawersLocked, preventBackdropClick],
  );

  // LIVE-DEBUG(drawer-stuck): the Modal's `visible` prop as actually committed.
  // Pairing this with "Modal onShow" tells us whether Android ever ran the show
  // transition for a given visible=true commit.
  useEffect(() => {
    logDrawer("isVisible committed", { instanceId, isVisible, isClosedRef: isClosedRef.current });
  }, [isVisible, instanceId]);

  return {
    instanceId,
    areDrawersLocked,
    isVisible,
    setIsVisible,
    handleUserClose,
    handleDismiss,
    onBack: onBackRef.current,
    enablePanDownToClose,
    showBackdropPress,
  };
};

export default useQueuedDrawerNative;
