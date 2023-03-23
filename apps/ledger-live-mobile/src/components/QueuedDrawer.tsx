import React, { useCallback, useEffect, useState } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { BottomDrawer } from "@ledgerhq/native-ui";
import { useFocusEffect } from "@react-navigation/native";
import type { BaseModalProps } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal/index";
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
  // If the drawer system is locked to the currently opened drawer
  const areDrawersLocked = useSelector(isModalLockedSelector);
  const [hasFocus, setHasFocus] = useState(false);
  // Actual state that choses if the drawer is displayed or not
  const [isDisplayed, setIsDisplayed] = useState(false);
  const [wasForcefullyCleaned, setWasForcefullyCleaned] = useState(false);

  const [drawerId, setDrawerId] = useState<number | null>(null);

  /**
   * Makes sure that the drawer system is cleaned when navigating to a new (or back to a) screen
   *
   * According to react-navigation documentation, a useCallback should wrap the function passed to useFocusEffect
   * useFocusEffect is called each time a dependency of the callback changes, necessary to keep this dependency array empty
   *
   * useFocusEffect (return) clean up function is the last function to be called if a navigation change occurs and the
   * drawer was not closed.
   * If a state was updated (for ex hasFocus) and it was expected to trigger some cleaning, it would actually not happen.
   * This explains why all the cleaning is done in the return function of useFocusEffect.
   * Also it could explain why useIsFocused() is not updating correctly in certain cases (when a navigation change occurs)
   */
  useFocusEffect(
    useCallback(() => {
      // hasFocus is true, even if the drawer is not trying to be opened
      setHasFocus(true);

      return () => {
        setHasFocus(false);

        setIsDisplayed(false);
        setDrawerId(null);

        cleanWaitingDrawers();
        cleanCurrentDisplayedDrawer();

        // If a navigation occurred and the drawer was not closed, this won't trigger any useEffect depending on wasForcefullyCleaned.
        // But necessary if the navigation occurred and the drawer, coming from the previous screen, tries to be opened.
        // This will call its onClose function and clean the state that tried to open it.
        setWasForcefullyCleaned(true);
      };
    }, []),
  );

  const handleClose = useCallback(() => {
    // Blocks the drawer from closing
    if (areDrawersLocked) return;

    onClose && onClose();
  }, [areDrawersLocked, onClose]);

  const handleModalHide = useCallback(() => {
    onModalHide && onModalHide();
    notifyNextDrawer();
  }, [onModalHide]);

  useEffect(() => {
    let id: number | undefined;

    // Protects against adding a drawer to the queue when its associated screen has not the focus
    if (hasFocus && drawerId === null) {
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
        setDrawerId(id);
      }

      // Finally, if the drawer is forcing to be opened, clean the currently displayed drawer
      // If there was no currently displayed drawer, the new drawer is already set to be displayed after calling addToWaitingDrawers above
      // If there were a currently displayed drawer, it will be closed, which triggers handleHideModal, which calls notifyNextDrawer
      if (isForcingToBeOpened && isADrawerAlreadyDisplayed) {
        cleanCurrentDisplayedDrawer();
      }
    }

    // As it cannot be known which state triggered the useEffect to be cleaned (hasFocus, or isRequestingToBeOpened, or isForcingToBeOpened ?),
    // the cleaning is done in 2 other useEffect:
    // - useFocusEffect if hasFocus was lost
    // - a useEffect if isRequestingToBeOpened or isForcingToBeOpened are false
  }, [drawerId, hasFocus, isForcingToBeOpened, isRequestingToBeOpened]);

  // Cleans the drawer if it tries to close itself: isRequestingToBeOpened and isForcingToBeOpened are false
  useEffect(() => {
    if (!isRequestingToBeOpened && !isForcingToBeOpened && drawerId !== null) {
      removeFromWaitingDrawers(drawerId);
      setDrawerId(null);
      // If this was the currently displayed drawer, only notifyNextDrawer once the drawer is hidden
      setIsDisplayed(false);
    }
  }, [drawerId, isForcingToBeOpened, isRequestingToBeOpened]);

  // Handles the case where the drawer has been removed forcefully from the queue by another drawer
  // or where it tries to be opened while it does not have the focus.
  // Handled separately to avoid calling addToWaitingDrawers or triggering useFocusEffect on every onClose changes (if not memoized).
  useEffect(() => {
    if (wasForcefullyCleaned) {
      setWasForcefullyCleaned(false);

      // Only call onClose if the drawer was trying to be opened
      if (isRequestingToBeOpened || isForcingToBeOpened) {
        onClose && onClose();
      }
    }
    // Only needs to be triggered when wasForcefullyCleaned is set to true.
    // Avoids triggering when isRequestingToBeOpened or isForcingToBeOpened change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasForcefullyCleaned, onClose]);

  return (
    <BottomDrawer
      preventBackdropClick={areDrawersLocked || preventBackdropClick}
      onClose={handleClose}
      onModalHide={handleModalHide}
      noCloseButton={areDrawersLocked || noCloseButton}
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
  // This drawer will be cleaned up once onModalHide is triggered
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
