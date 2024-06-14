import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { BottomDrawer } from "@ledgerhq/native-ui";
import { useIsFocused } from "@react-navigation/native";
import type { BaseModalProps } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal/index";
import { useSelector } from "react-redux";
import { isModalLockedSelector } from "~/reducers/appstate";
import { Merge } from "~/types/helpers";
import { IsInDrawerProvider } from "~/context/IsInDrawerContext";
import { DrawerInQueue, useQueuedDrawerContext } from "./QueuedDrawersContext";
import { logDrawer } from "./utils/logDrawer";

// Purposefully removes isOpen prop so consumers can't use it directly
export type Props = Merge<
  Omit<BaseModalProps, "isOpen">,
  {
    isRequestingToBeOpened?: boolean;
    isForcingToBeOpened?: boolean;
    style?: StyleProp<ViewStyle>;
    containerStyle?: StyleProp<ViewStyle>;
  }
>;

/**
 * A drawer taking into account the currently displayed drawer and other drawers waiting to be displayed.
 *
 * This is made possible thanks to a queue of drawers waiting to be displayed. Once the currently displayed drawer
 * is not displayed anymore (hidden), the next drawer in the queue is notified, and it updates its state
 * to be make itself visible.
 *
 * Setting to true the isRequestingToBeOpened prop will add the drawer to the queue. Setting to false will remove it from the queue.
 *
 * A new drawer can bypass the queue and forcefully close the currently displayed drawer by setting the isForcingToBeOpened prop
 * to true. This entirely cleans the drawers queue. It notifies the removed drawers by calling their onClose prop.
 *
 * The queue is cleaned when its associated screen loses its navigation focus. If a drawer is requesting to be opened while
 * its associated screen has not the focus, it is not added to the queue and its onClose prop is called.
 *
 * You can also block the drawer for closing by setting the modalLock redux app state.
 * To do this, you can use the component components/ModalLock.
 * A drawer can still forcefully close other drawers and opens itself while the modalLock is set to true.
 *
 * Note: avoid conditionally render this component. Always render it and use isRequestingToBeOpened to control its visibility.
 * Note: to avoid a UI glitch on Android, do not put this drawer inside NavigationScrollView (and probably any other ScrollView)
 *
 * @param isRequestingToBeOpened: to use in place of isOpen. Setting to true will add the drawer to the queue.
 *   Setting to false will remove it from the queue. Default to false.
 * @param isForcingToBeOpened: when set to true, forcefully cleans the existing drawers queue, closes the currently displayed drawer,
 *   and displays itself. It should only be used when the drawer has priority over the other drawers in the queue.
 *   Prefer using isRequestingToBeOpened insted to respect the queue order. Default to false.
 * @param onClose: when the user closes the drawer (by clicking on the backdrop or the close button) + when the drawer is hidden
 *   (this is currently due to a legacy behavior of the BaseModal component. It might change in the future).
 *   Even if you set noCloseButton, the drawer can be closed for other reasons (lost screen focus, other drawer forced it to close).
 *   It is a good practice to always clean the state that tried to open the drawer when onClose is called.
 * @param onModalHide: when the drawer is fully hidden
 * @param noCloseButton: whether to display the close button or not
 * @param preventBackdropClick: whether to prevent the user from closing the drawer by clicking somewhere on the screen
 *   or on the back button
 * @params all other props are passed to the BaseModal component. Double check the behavior of the props you pass
 *   before using them in production. Do not use the isOpen prop.
 */
const QueuedDrawer = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onModalHide,
  noCloseButton,
  preventBackdropClick,
  style,
  containerStyle,
  children,
  ...rest
}: Props) => {
  const [isDisplayed, setIsDisplayed] = useState(false);
  const { addDrawerToQueue } = useQueuedDrawerContext();
  const drawerInQueueRef = useRef<DrawerInQueue>();

  const isFocused = useIsFocused();

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
    onCloseRef.current && onCloseRef.current(); // hack to avoid triggering the useEffect below if the parent changes the onClose prop
  }, []);

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

  const handleCloseUserEvent = useCallback(() => {
    logDrawer("handleClose");
    triggerClose();
  }, [triggerClose]);

  const handleModalHide = useCallback(() => {
    logDrawer("handleModalHide");
    onModalHide && onModalHide();
    setIsDisplayed(false);
    drawerInQueueRef.current?.removeDrawerFromQueue();
    drawerInQueueRef.current = undefined;
  }, [onModalHide]);

  useEffect(() => {
    return () => {
      logDrawer("UNMOUNT drawer...");
      drawerInQueueRef.current?.removeDrawerFromQueue();
      drawerInQueueRef.current = undefined;
    };
  }, []);

  // If the drawer system is locked to the currently opened drawer
  const areDrawersLocked = useSelector(isModalLockedSelector);

  return (
    <BottomDrawer
      preventBackdropClick={areDrawersLocked || preventBackdropClick}
      onClose={handleCloseUserEvent}
      onModalHide={handleModalHide}
      noCloseButton={areDrawersLocked || noCloseButton}
      modalStyle={style}
      containerStyle={containerStyle}
      isOpen={isDisplayed}
      {...rest}
    >
      <IsInDrawerProvider>{children}</IsInDrawerProvider>
    </BottomDrawer>
  );
};

export default React.memo(QueuedDrawer);
