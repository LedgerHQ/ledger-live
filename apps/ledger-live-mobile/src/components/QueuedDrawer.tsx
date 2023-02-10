import React, { useCallback, useEffect, useState } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { BottomDrawer } from "@ledgerhq/native-ui";
import { useFocusEffect } from "@react-navigation/native";
import type { BaseModalProps } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal";
import { useSelector } from "react-redux";
import { isModalLockedSelector } from "../reducers/appstate";
import { Merge } from "../types/helpers";

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
 * Note: avoid conditionally render this component. Always render it and use isRequestingToBeOpened to control its visibility.
 * Note: to avoid a UI glitch on Android, do not put this drawer inside NavigationScrollView (and probably any other ScrollView)
 *
 * Dev: internal functions can be wrapped in useCallback once BottomDrawer and BaseModal are memoized components
 *
 * @param isRequestingToBeOpened: to use in place of isOpen. Setting to true will add the drawer to the queue.
 *   Setting to false will remove it from the queue. Default to false.
 * @param isForcingToBeOpened: when set to true, forcefully cleans the existing drawers queue, closes the currently displayed drawer,
 *   and displays itself. It should only be used when the drawer has priority over the other drawers in the queue.
 *   Prefer using isRequestingToBeOpened insted to respect the queue order. Default to false.
 * @param onClose: when the user closes the drawer (by clicking on the backdrop or the close button) + when the drawer is hidden
 *   (this is currently due to a legacy behavior of the BaseModal component. It might change in the future)
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
  const modalLock = useSelector(isModalLockedSelector);
  const [hasFocus, setHasFocus] = useState(false);
  // Actual state that choses if the drawer is displayed or not
  const [isDisplayed, setIsDisplayed] = useState(false);
  const [wasForcefullyCleaned, setWasForcefullyCleaned] = useState(false);

  // Makes sure that the drawer system is cleaned when navigating to a new (or back to a) screen
  // According to reactnavigation documentation, a useCallback should wrap the function passed to useFocusEffect
  useFocusEffect(
    useCallback(() => {
      setHasFocus(true);

      return () => {
        setIsDisplayed(false);
        setHasFocus(false);
        cleanWaitingDrawers();
        cleanCurrentDisplayedDrawer();
      };
    }, []),
  );

  const handleClose = () => {
    // Blocks the drawer from closing
    if (modalLock) return;

    onClose && onClose();
  };

  const handleModalHide = () => {
    onModalHide && onModalHide();
    notifyNextDrawer();
  };

  useEffect(() => {
    let id: number | undefined;

    // Protects against adding a drawer to the queue when its associated screen has not the focus
    if (!hasFocus) {
      setWasForcefullyCleaned(true);
    } else {
      // If the drawer is forcing to be opened, first clean the waiting queue
      if (isForcingToBeOpened) {
        cleanWaitingDrawers(true);
      }

      const isADrawerAlreadyDisplayed = checkCurrentDisplayedDrawer();

      // Adds the drawer to the waiting queue if it is requesting or forcing to be opened
      if (isRequestingToBeOpened || isForcingToBeOpened) {
        id = addToWaitingDrawers(event => {
          setIsDisplayed(event === "canBeDisplayed");

          if (event === "wasForcefullyCleaned") {
            setWasForcefullyCleaned(true);
          }
        });
      }

      // Finally, if the drawer is forcing to be opened, clean the currently displayed drawer
      // If there was no currently displayed drawer, the new drawer is already set to be displayed after calling addToWaitingDrawers above
      // If there were a currently displayed drawer, it will be closed, which triggers handleHideModal, which calls notifyNextDrawer
      if (isForcingToBeOpened && isADrawerAlreadyDisplayed) {
        cleanCurrentDisplayedDrawer();
      }
    }

    return () => {
      if (id !== undefined) {
        removeFromWaitingDrawers(id);
        // If this was the currently displayed drawer, only notifyNextDrawer once the drawer is hidden
        setIsDisplayed(false);
      }
    };
  }, [hasFocus, isForcingToBeOpened, isRequestingToBeOpened]);

  // Handles the case where the drawer has been removed forcefully from the queue by another drawer
  // or where the displayed drawer was forcefully closed.
  // Handled separatly to avoid calling addToWaitingDrawers on every onClose changes (if not memoized).
  useEffect(() => {
    if (wasForcefullyCleaned) {
      onClose && onClose();
      setWasForcefullyCleaned(false);
    }
  }, [wasForcefullyCleaned, onClose]);

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

export default QueuedDrawer;

type ToBeDisplayedDrawer = {
  id: number;
  onNotifyDrawer: (event: "canBeDisplayed" | "wasForcefullyCleaned") => void;
};

let currentDisplayedDrawer: ToBeDisplayedDrawer | null = null;
let drawersCounter = 0;
const waitingDrawers: ToBeDisplayedDrawer[] = [];

/**
 * Adds a drawer to the waiting list. If there is no currently displayed drawer,
 * it will be displayed by calling notifyNextDrawer.
 *
 * This function is used internally by QueuedDrawer and should not be used directly.
 *
 * @param onDisplayStateUpdate callback called when the display state of the drawer is updated.
 *   It should set a state that makes the drawer visible/not visible.
 * @returns the id of the drawer
 */
function addToWaitingDrawers(
  onNotifyDrawer: ToBeDisplayedDrawer["onNotifyDrawer"],
) {
  const id = drawersCounter++;

  waitingDrawers.push({ id, onNotifyDrawer });

  if (currentDisplayedDrawer === null) {
    notifyNextDrawer();
  }

  return id;
}

/**
 * Removes the drawer from the waiting list. If it's the currently displayed drawer, nothing is done.
 *
 * This function is used internally by QueuedDrawer and should not be used directly.
 *
 * @param id the id of the drawer to remove
 */
function removeFromWaitingDrawers(id: ToBeDisplayedDrawer["id"]) {
  // Does not remove the currently displayed drawer
  // This drawer will be cleaned up when onModalHide is triggered
  if (currentDisplayedDrawer?.id === id) {
    return;
  }

  const index = waitingDrawers.findIndex(
    waitingDrawer => waitingDrawer.id === id,
  );

  if (index >= 0) {
    waitingDrawers.splice(index, 1);
  }
}

/**
 * Notifies the next drawer in the waiting list that it's its turn to be displayed.
 *
 * If there is no drawer in the waiting list, it sets the counter of drawers to 0.
 *
 * This function is used internally by QueuedDrawer and should not be used directly.
 */
function notifyNextDrawer() {
  const nextDrawer = waitingDrawers.shift();

  if (nextDrawer) {
    currentDisplayedDrawer = nextDrawer;
    nextDrawer.onNotifyDrawer("canBeDisplayed");
  } else {
    // No more drawer to display
    currentDisplayedDrawer = null;
    // Not necessary, but avoids increasing infinitely the counter
    drawersCounter = 0;
  }
}

/**
 * Helper function to clean the waiting list of drawers.
 *
 * This function is used internally by QueuedDrawer and should not be used directly.
 *
 * @param areDrawersForcefullyCleaned if true, the drawers will be notified that they were forcefully removed from the queue
 */
function cleanWaitingDrawers(areDrawersForcefullyCleaned = false) {
  if (areDrawersForcefullyCleaned) {
    for (const waitingDrawer of waitingDrawers) {
      waitingDrawer.onNotifyDrawer("wasForcefullyCleaned");
    }
  }

  waitingDrawers.splice(0, waitingDrawers.length);

  // Cannot reset drawersCounter to 0 here because currentDisplayedDrawer still has a valid id
}

/**
 * Helper function to notify the displayed drawer that it should close, and clean the currently displayed drawer.
 *
 * This function is used internally by QueuedDrawer and should not be used directly.
 */
function cleanCurrentDisplayedDrawer() {
  if (currentDisplayedDrawer) {
    currentDisplayedDrawer.onNotifyDrawer("wasForcefullyCleaned");
    currentDisplayedDrawer = null;
  }
}

/**
 * Helper function to check if there is a currently displayed drawer.
 *
 * This function is used internally by QueuedDrawer and should not be used directly.
 */
function checkCurrentDisplayedDrawer() {
  return !!currentDisplayedDrawer;
}
