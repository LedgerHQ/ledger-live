import { useCallback, useEffect, useRef } from "react";
import { Keyboard } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { isModalLockedSelector } from "~/reducers/appstate";
import { DrawerInQueue, useQueuedDrawerContext } from "../QueuedDrawersContext";
import { logDrawer } from "../utils/logDrawer";

interface UseQueuedDrawerGorhomProps {
  isRequestingToBeOpened?: boolean;
  isForcingToBeOpened?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onModalHide?: () => void;
  preventBackdropClick?: boolean;
}

const useQueuedDrawerGorhom = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
  onModalHide,
  preventBackdropClick,
}: UseQueuedDrawerGorhomProps) => {
  const { addDrawerToQueue } = useQueuedDrawerContext();
  const drawerInQueueRef = useRef<DrawerInQueue | undefined>(undefined);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const isFocused = useIsFocused();
  const areDrawersLocked = useSelector(isModalLockedSelector);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isClosedRef = useRef(true);

  const cleanupQueue = useCallback(() => {
    if (drawerInQueueRef.current) {
      drawerInQueueRef.current.removeDrawerFromQueue();
      drawerInQueueRef.current = undefined;
    }
  }, []);

  const handleOpen = useCallback(() => {
    if (!isClosedRef.current) return;

    logDrawer("Opening drawer");
    isClosedRef.current = false;
    bottomSheetRef.current?.present();
  }, []);

  const handleClose = useCallback(() => {
    if (isClosedRef.current) return;

    logDrawer("Closing drawer");
    isClosedRef.current = true;
    bottomSheetRef.current?.dismiss();
    cleanupQueue();
    onCloseRef.current?.();
  }, [cleanupQueue]);

  const handleUserClose = useCallback(() => {
    logDrawer("User initiated close");
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleDismiss = useCallback(() => {
    logDrawer("BottomSheet dismissed");

    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }

    handleClose();
    onModalHide?.();
  }, [handleClose, onModalHide]);

  // Queue management effect
  useEffect(() => {
    if (!isFocused && (isRequestingToBeOpened || isForcingToBeOpened)) {
      logDrawer("Closing drawer - screen not focused");
      handleClose();
      return;
    }

    if ((isRequestingToBeOpened || isForcingToBeOpened) && !drawerInQueueRef.current) {
      const onDrawerStateChanged = (isOpen: boolean) => {
        if (isOpen) {
          handleOpen();
        } else {
          handleClose();
        }
      };

      drawerInQueueRef.current = addDrawerToQueue(onDrawerStateChanged, isForcingToBeOpened);

      return () => {
        logDrawer("Effect cleanup - closing drawer");
        handleClose();
      };
    }
  }, [
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
      logDrawer("Component unmounting - cleaning up");
      cleanupQueue();
    };
  }, [cleanupQueue]);

  return {
    bottomSheetRef,
    areDrawersLocked,
    handleUserClose,
    handleDismiss,
    onBack,
    enablePanDownToClose: !areDrawersLocked && !preventBackdropClick,
    showBackdropPress: areDrawersLocked || preventBackdropClick,
  };
};

export default useQueuedDrawerGorhom;
