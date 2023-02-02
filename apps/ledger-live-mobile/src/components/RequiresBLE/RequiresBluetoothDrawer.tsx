import React, { useCallback } from "react";
import QueuedDrawer from "../QueuedDrawer";
import { BluetoothRequirementsState } from "./hooks/useRequireBluetooth";
import BluetoothDisabled from "./BluetoothDisabled";
import LocationDisabled from "../RequiresLocation/LocationDisabled";
import BluetoothPermissionsDenied from "./BluetoothPermissionsDenied";
import LocationPermissionDenied from "../RequiresLocation/LocationPermissionDenied";

export type BleRequirementsState = "unknown" | "respected" | "not_respected";

export type RequiresBluetoothBottomModalProps = {
  isOpen: boolean;
  onUserClose: () => void;
  bluetoothRequirementsState: BluetoothRequirementsState;
  retryRequestOnIssue: (() => void) | null;
  cannotRetryRequest?: boolean;
};

/**
 * Bottom drawer displaying issues with the different bluetooth requirements.
 * To use with the hook useRequireBluetooth hook.
 *
 * Useful to display fined grained issues with bluetooth requirements.
 *
 * If there is no issue, the drawer will not be displayed.
 *
 * The drawer can be closed by the user, but this does not resolve the requirements issue.
 * The associated hook useRequireBluetooth will still return the same state.
 *
 * Note: never conditionally render this component. Always render it and use isOpen to control its visibility.
 *
 * @param isOpen Whether the bottom drawer is open or not.
 * @param onUserClose A callback when the user tries to close the bottom drawer.
 *   This is mandatory as the drawer does not close by itself, until the requirements are respected.
 *   To close the drawer, update isOpen to false and update accordingly your logic as the requirements are not respected.
 * @param bluetoothRequirementsState The bluetooth requirements state coming from useRequireBluetooth.
 * @param retryRequestOnIssue A function to retry the process to check/request for the currently failed bluetooth requirement.
 * @param cannotRetryRequest Whether the retry function retryRequestOnIssue can be called.
 *   For example, for permissions on Android, it is only possible to retry to request directly the user (and not make them
 *   go to the settings) if the user has not checked/triggered the "never ask again".
 */
// TODO: isOpen should be named isOpenOnIssue or similar, because we don't open the drawer if there is no issue
const RequiresBluetoothDrawer = ({
  isOpen,
  onUserClose,
  bluetoothRequirementsState,
  retryRequestOnIssue,
  cannotRetryRequest = true,
}: RequiresBluetoothBottomModalProps) => {
  const onClose = useCallback(() => {
    // If all the requireements are not respected, it means the user tried to close the drawer by pressing on the close button
    if (bluetoothRequirementsState !== "all_respected") {
      onUserClose();
    }
  }, [bluetoothRequirementsState, onUserClose]);

  // const onModalHide = useCallback(() => {
  //   if (onDrawerHide) {
  //     onDrawerHide();
  //   }
  // }, [onDrawerHide]);

  let content = null;

  switch (bluetoothRequirementsState) {
    case "bluetooth_permissions_ungranted":
      content = (
        <BluetoothPermissionsDenied
          componentType="drawer"
          onRetry={retryRequestOnIssue}
          neverAskAgain={cannotRetryRequest}
        />
      );
      break;
    case "location_permission_ungranted":
      content = (
        <LocationPermissionDenied
          componentType="drawer"
          onRetry={retryRequestOnIssue}
          neverAskAgain={cannotRetryRequest}
        />
      );
      break;
    case "bluetooth_disabled":
      content = (
        <BluetoothDisabled
          componentType="drawer"
          onRetry={retryRequestOnIssue}
        />
      );
      break;
    case "location_disabled":
      content = (
        <LocationDisabled
          componentType="drawer"
          onRetry={retryRequestOnIssue}
        />
      );
      break;
    default:
      break;
  }

  const drawerIsOpen = isOpen && content !== null;

  return (
    <QueuedDrawer
      onClose={onClose}
      isRequestingToBeOpened={drawerIsOpen}
      preventBackdropClick
    >
      {content}
    </QueuedDrawer>
  );
};

export default RequiresBluetoothDrawer;
