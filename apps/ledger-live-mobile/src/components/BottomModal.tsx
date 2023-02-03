import React, { useCallback, useEffect, useState } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { BottomDrawer } from "@ledgerhq/native-ui";
import { useFocusEffect } from "@react-navigation/native";
import type { BaseModalProps } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal";
import { useSelector } from "react-redux";
import { isModalLockedSelector } from "../reducers/appstate";
import { Merge } from "../types/helpers";

export type Props = Merge<
  BaseModalProps,
  {
    isOpened?: boolean;
    style?: StyleProp<ViewStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    debugName?: string;
  }
>;

/**
 * A drawer taking into account the currently displayed drawer and other drawers waiting to be displayed.
 *
 * This is made possible thanks to a queue of drawers waiting to be displayed. Once the currently displayed drawer
 * is not displayed anymore (hidden), the next drawer in the queue is notified, and it updates its state
 * to be make itself visible.
 *
 * Setting to true the isOpened prop will add the drawer to the queue. Setting to false will remove it from the queue.
 *
 * The queue is cleaned when its associated screen loses its navigation focus.
 *
 * Note: never conditionally render this component. Always render it and use isOpened to control its visibility.
 * Note: to avoid a UI glitch on Android, do not put this drawer inside NavigationScrollView (and probably any other ScrollView)
 *
 * @param isOpened: to use in place of isOpen. The wording isOpened is misleading.
 *   In the future, to rename to isRequestingToBeOpened
 * @returns
 */
const BottomModal = ({
  isOpened,
  onClose,
  children,
  style,
  preventBackdropClick,
  onModalHide,
  containerStyle,
  noCloseButton,
  isOpen,
  debugName,
  ...rest
}: Props) => {
  const modalLock = useSelector(isModalLockedSelector);
  // Actual state that choses if the drawer is displayed or not
  const [isDisplayed, setIsDisplayed] = useState(false);
  const [onCloseAlreadyCalled, setOnCloseAlreadyCalled] = useState(false);

  // Makes sure that the drawer system is cleaned when navigating to a new (or back to a) screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        console.log(
          `🦕 BottomModal ${debugName}: cleaning onBottomDrawerFocus 🧹`,
        );
        setIsDisplayed(false);
        cleanWaitingDrawers();
      };
    }, [debugName]),
  );

  const handleClose = useCallback(() => {
    // Blocks the closing of the modal
    if (modalLock) return;

    if (onCloseAlreadyCalled) {
      setOnCloseAlreadyCalled(false);
      return;
    }
    console.log(`🦕 👋 BottomModal onClose`);
    setOnCloseAlreadyCalled(true);
    onClose && onClose();
  }, [modalLock, onClose, onCloseAlreadyCalled]);

  const handleModalHide = useCallback(() => {
    console.log(`🦕 ✅ BottomModal ${debugName}: onBottomDrawerHide`);
    onModalHide && onModalHide();
    notifyNextDrawer();
  }, [onModalHide, debugName]);

  useEffect(() => {
    let id: number | undefined;

    if (isOpened) {
      console.log(
        `🦕 BottomModal: ${debugName} adding to waiting list of drawer ...`,
      );
      id = addToWaitingDrawers(() => {
        setIsDisplayed(true);
      });
    }

    return () => {
      console.log(
        `🦕 BottomModal: ${debugName} cleanup id=${id} wasOpened=${isOpened}`,
      );

      if (id !== undefined) {
        removeFromWaitingDrawers(id);
        setIsDisplayed(false);
      }
    };
  }, [debugName, isOpened]);

  console.log(
    `🦕🔥 BottomModal: isOpened: ${isOpened} isDisplayed: ${isDisplayed}`,
  );

  return (
    <BottomDrawer
      preventBackdropClick={modalLock || preventBackdropClick}
      onClose={handleClose}
      onModalHide={handleModalHide}
      noCloseButton={modalLock || noCloseButton}
      modalStyle={style}
      containerStyle={containerStyle}
      isOpen={isDisplayed}
      {...rest}
    >
      {children}
    </BottomDrawer>
  );
};

export default BottomModal;

type WaitingDrawer = {
  id: number;
  onDrawerReady: () => void;
};

let currentDisplayedDrawerId: number | null = null;
let drawersCounter = 0;
const waitingDrawers: WaitingDrawer[] = [];

/**
 * Adds a drawer to the waiting list. If there is no currently displayed drawer,
 * it will be displayed by calling notifyNextDrawer.
 *
 * This function is used internally by BottomModal and should not be used directly.
 *
 * @param onDrawerReady callback to call when it's the turn of this drawer to be displayed.
 *   It should set a state that makes the drawer visible.
 * @returns the id of the drawer
 */
function addToWaitingDrawers(onDrawerReady: WaitingDrawer["onDrawerReady"]) {
  const id = drawersCounter++;

  waitingDrawers.push({ id, onDrawerReady });

  if (currentDisplayedDrawerId === null) {
    notifyNextDrawer();
  }

  return id;
}

/**
 * Removes the drawer from the waiting list. If it's the currently displayed drawer, nothing is done.
 *
 * This function is used internally by BottomModal and should not be used directly.
 *
 * @param id the id of the drawer to remove
 */
function removeFromWaitingDrawers(id: WaitingDrawer["id"]) {
  // Does not remove the currently displayed drawer
  // T_is drawer will be cleaned up when onModalHide is triggered
  if (currentDisplayedDrawerId === id) {
    return;
  }

  const index = waitingDrawers.findIndex(
    waitingDrawer => waitingDrawer.id === id,
  );

  console.log(`🤝 removeFromWaitingDrawers index:${index}`);
  if (index >= 0) {
    waitingDrawers.splice(index, 1);
  }
}

/**
 * Notifies the next drawer in the waiting list that it's its turn to be displayed.
 *
 * If there is no drawer in the waiting list, it sets the counter of drawers to 0.
 *
 * This function is used internally by BottomModal and should not be used directly.
 */
function notifyNextDrawer() {
  const nextDrawer = waitingDrawers.shift();

  if (nextDrawer) {
    currentDisplayedDrawerId = nextDrawer.id;
    nextDrawer.onDrawerReady();
  } else {
    // No more drawer to display
    currentDisplayedDrawerId = null;
    // Not necessary, but avoids increasing infinitely the counter
    drawersCounter = 0;
  }
}

/**
 * Helper function to clean the waiting list of drawers.
 *
 * This function is used internally by BottomModal and should not be used directly.
 */
function cleanWaitingDrawers() {
  waitingDrawers.splice(0, waitingDrawers.length);
  currentDisplayedDrawerId = null;
  drawersCounter = 0;
}
