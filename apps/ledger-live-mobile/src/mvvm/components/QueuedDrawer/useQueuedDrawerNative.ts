import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { isModalLockedSelector } from "~/reducers/appstate";
import { BottomSheetInQueue, useQueuedBottomSheetContext } from "@shared/ui-queued-bottom-sheet";
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

const useQueuedDrawerNative = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
  onModalHide,
  preventBackdropClick,
  preventKeyboardDismissOnClose = false,
}: UseQueuedDrawerNativeProps) => {
  const { addBottomSheetToQueue } = useQueuedBottomSheetContext();
  const drawerInQueueRef = useRef<BottomSheetInQueue | undefined>(undefined);
  const isFocused = useIsFocused();
  const areBottomSheetsLocked = useSelector(isModalLockedSelector);

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
      drawerInQueueRef.current.removeBottomSheetFromQueue();
      drawerInQueueRef.current = undefined;
    }
  }, []);

  const handleOpen = useCallback(() => {
    if (!isClosedRef.current) return;
    logDrawer("Opening native modal");
    isClosedRef.current = false;
    setIsVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    const wasAlreadyClosed = isClosedRef.current;

    if (!wasAlreadyClosed) {
      logDrawer("Closing native modal");
      isClosedRef.current = true;
      setIsVisible(false);
    }

    // Always cleanup queue and call onClose, even if drawer was never opened
    // This ensures parent state is reset and next drawer can open
    cleanupQueue();
    onCloseRef.current?.();
  }, [cleanupQueue]);

  const handleUserClose = useCallback(() => {
    logDrawer("User initiated close (native)");
    setIsVisible(false);
  }, []);

  const handleDismiss = useCallback(() => {
    logDrawer("Native modal dismissed");
    if (!preventKeyboardDismissOnClose) {
      Keyboard.dismiss();
    }
    handleClose();
    onModalHideRef.current?.();
  }, [handleClose, preventKeyboardDismissOnClose]);

  // Queue management effect
  useEffect(() => {
    if (!isFocused && (isRequestingToBeOpened || isForcingToBeOpened)) {
      logDrawer("Closing drawer - screen not focused (native)");
      handleClose();
      return;
    }

    if ((isRequestingToBeOpened || isForcingToBeOpened) && !drawerInQueueRef.current) {
      drawerInQueueRef.current = addBottomSheetToQueue(
        { open: handleOpen, close: handleClose },
        isForcingToBeOpened,
      );

      return () => {
        logDrawer("Effect cleanup - closing native modal");
        handleClose();
      };
    }
  }, [
    addBottomSheetToQueue,
    isFocused,
    isForcingToBeOpened,
    isRequestingToBeOpened,
    handleOpen,
    handleClose,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logDrawer("Component unmounting - cleaning up (native)");
      cleanupQueue();
    };
  }, [cleanupQueue]);

  const enablePanDownToClose = useMemo(
    () => !areBottomSheetsLocked && !preventBackdropClick,
    [areBottomSheetsLocked, preventBackdropClick],
  );
  const showBackdropPress = useMemo(
    () => areBottomSheetsLocked || preventBackdropClick,
    [areBottomSheetsLocked, preventBackdropClick],
  );

  return {
    areBottomSheetsLocked,
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
