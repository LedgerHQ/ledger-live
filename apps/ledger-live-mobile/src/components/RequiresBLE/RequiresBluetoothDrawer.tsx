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
 * Drawer to use with the hook useRequireBluetooth hook.
 *
 * @param param0
 * @param cannotRetryRequest Whether the retry function retryRequestOnIssue can be called.
 *   For example, for permissions on Android, it is only possible to retry to request directly the user (and not make them
 *   go to the settings) if the user has not checked/triggered the "never ask again".
 * @returns
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
    console.log(`🦖 RequiresBluetoothDrawer onClose`);
  };

  let content = null;

  switch (bluetoothRequirementsState) {
    case "bluetooth_permissions_ungranted":
      // TODO: need to pass never ask again prop
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

  const bottomModalIsOpen = isOpen && content !== null;

  return (
    <BottomModal
      onClose={onClose}
      isOpen={bottomModalIsOpen}
      preventBackdropClick
    >
      {content}
    </BottomModal>
  );
};

export default RequiresBluetoothDrawer;
