import { useCallback, useEffect, useRef, useState } from "react";
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
  const [isDisplayed, setIsDisplayed] = useState(false);
  const { addDrawerToQueue } = useQueuedDrawerContext();
  const drawerInQueueRef = useRef<DrawerInQueue>();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const isFocused = useIsFocused();
  const areDrawersLocked = useSelector(isModalLockedSelector);

  const triggerOpen = useCallback(() => {
    setIsDisplayed(true);
  }, []);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const triggerClose = useCallback(() => {
    setIsDisplayed(false);
    if (drawerInQueueRef.current?.getPositionInQueue() !== 0) {
      drawerInQueueRef.current?.removeDrawerFromQueue();
      drawerInQueueRef.current = undefined;
    }
    onCloseRef.current?.();
  }, []);

  const handleCloseUserEvent = useCallback(() => {
    logDrawer("handleClose");
    triggerClose();
  }, [triggerClose]);

  const handleDismiss = useCallback(() => {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }
    logDrawer("handleDismiss");
    onModalHide?.();
    setIsDisplayed(false);
    drawerInQueueRef.current?.removeDrawerFromQueue();
    drawerInQueueRef.current = undefined;
  }, [onModalHide]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        handleCloseUserEvent();
      }
    },
    [handleCloseUserEvent],
  );

  useEffect(() => {
    if (!isFocused && (isRequestingToBeOpened || isForcingToBeOpened)) {
      logDrawer("trigger close because not focused");
      triggerClose();
    } else if ((isRequestingToBeOpened || isForcingToBeOpened) && !drawerInQueueRef.current) {
      const onDrawerStateChanged = (isOpen: boolean) => {
        if (isOpen) {
          triggerOpen();
        } else {
          logDrawer("setDrawerOpenedCallback triggerClose");
          triggerClose();
        }
      };
      drawerInQueueRef.current = addDrawerToQueue(onDrawerStateChanged, isForcingToBeOpened);
      return () => {
        logDrawer("trigger close in cleanup");
        triggerClose();
      };
    }
  }, [
    addDrawerToQueue,
    isFocused,
    isForcingToBeOpened,
    isRequestingToBeOpened,
    triggerClose,
    triggerOpen,
  ]);

  useEffect(() => {
    if (isDisplayed) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isDisplayed]);

  useEffect(() => {
    return () => {
      logDrawer("UNMOUNT drawer...");
      drawerInQueueRef.current?.removeDrawerFromQueue();
      drawerInQueueRef.current = undefined;
    };
  }, []);

  return {
    bottomSheetRef,
    isDisplayed,
    areDrawersLocked,
    handleCloseUserEvent,
    handleDismiss,
    handleSheetChanges,
    onBack,
    enablePanDownToClose: !areDrawersLocked && !preventBackdropClick,
    showBackdropPress: areDrawersLocked || preventBackdropClick,
  };
};

export default useQueuedDrawerGorhom;
