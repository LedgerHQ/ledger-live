import React from "react";
import { Text } from "@ledgerhq/native-ui";
import BottomModal from "../BottomModal";
import { BluetoothRequirementsState } from "./hooks/useRequireBluetooth";
import BluetoothDisabled from "./BluetoothDisabled";
import LocationDisabled from "../RequiresLocation/LocationDisabled";
import BluetoothPermissionsDenied from "./BluetoothPermissionsDenied";
import LocationPermissionDenied from "../RequiresLocation/LocationPermissionDenied";

export type BleRequirementsState = "unknown" | "respected" | "not_respected";

export type RequiresBluetoothBottomModalProps = {
  isOpen?: boolean;
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
 * @param isOpen Whether the bottom drawer is open or not.
 * @param bluetoothRequirementsState The bluetooth requirements state coming from useRequireBluetooth.
 * @param retryRequestOnIssue A function to retry the process to check/request for the currently failed bluetooth requirement.
 * @param cannotRetryRequest Whether the retry function retryRequestOnIssue can be called.
 *   For example, for permissions on Android, it is only possible to retry to request directly the user (and not make them
 *   go to the settings) if the user has not checked/triggered the "never ask again".
 */
const RequiresBluetoothDrawer = ({
  isOpen = true,
  bluetoothRequirementsState,
  retryRequestOnIssue,
  cannotRetryRequest = true,
}: RequiresBluetoothBottomModalProps) => {
  console.log(
    `🦖 RequiresBluetoothDrawer bluetoothRequirementsState: ${bluetoothRequirementsState}, cannotRetryRequest: ${cannotRetryRequest}`,
  );

  const onClose = () => {
    // TODO !
    console.log(`🦖 RequiresBluetoothDrawer onClose`);
  };

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
    <BottomModal onClose={onClose} isOpen={drawerIsOpen} preventBackdropClick>
      {content}
    </BottomModal>
  );
};

export default RequiresBluetoothDrawer;
