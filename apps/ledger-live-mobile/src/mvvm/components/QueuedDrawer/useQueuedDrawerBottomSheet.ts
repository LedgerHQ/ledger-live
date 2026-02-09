import { useCallback, useEffect, useRef } from "react";
import { Keyboard } from "react-native";
import { useBottomSheetRef } from "@ledgerhq/lumen-ui-rnative";
import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { isModalLockedSelector } from "~/reducers/appstate";
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

const useQueuedDrawerBottomSheet = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
  onModalHide,
  preventBackdropClick,
}: UseQueuedDrawerBottomSheetProps) => {
  const { addDrawerToQueue } = useQueuedDrawerContext();
  const drawerInQueueRef = useRef<DrawerInQueue | undefined>(undefined);
  const bottomSheetRef = useBottomSheetRef();
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
  }, [bottomSheetRef]);

  const handleClose = useCallback(() => {
    if (isClosedRef.current) return;

    logDrawer("Closing drawer");
    isClosedRef.current = true;
    bottomSheetRef.current?.dismiss();
    cleanupQueue();
    onCloseRef.current?.();
  }, [bottomSheetRef, cleanupQueue]);

  const handleUserClose = useCallback(() => {
    logDrawer("User initiated close");
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef]);

  const handleDismiss = useCallback(() => {
    logDrawer("BottomSheet dismissed (onDismiss)");

    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }

    handleClose();
    onModalHide?.();
  }, [handleClose, onModalHide]);

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
  };
};

export default useQueuedDrawerBottomSheet;
