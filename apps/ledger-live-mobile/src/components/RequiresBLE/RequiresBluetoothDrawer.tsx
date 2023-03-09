import React, { useCallback } from "react";
import QueuedDrawer from "../QueuedDrawer";
import { BluetoothRequirementsState } from "./hooks/useRequireBluetooth";
import BluetoothDisabled from "./BluetoothDisabled";
import LocationDisabled from "../RequiresLocation/LocationDisabled";
import BluetoothPermissionsDenied from "./BluetoothPermissionsDenied";
import LocationPermissionDenied from "../RequiresLocation/LocationPermissionDenied";

export type BleRequirementsState = "unknown" | "respected" | "not_respected";

export type RequiresBluetoothBottomModalProps = {
  isOpenedOnIssue: boolean;
  onUserClose: () => void;
  bluetoothRequirementsState: BluetoothRequirementsState;
  retryRequestOnIssue: (() => void) | null;
  cannotRetryRequest?: boolean;
  onDrawerHide?: () => void;
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
 * Note: never conditionally render this component. Always render it and use isOpenedOnIssue to control its visibility.
 *
 * @param isOpenedOnIssue Whether the bottom drawer should be opened when an issue occurred on the bluetooth requirements.
 *   If bluetoothRequirementsState is "all_respected", the drawer will not be opened.
 * @param bluetoothRequirementsState The bluetooth requirements state coming from useRequireBluetooth.
 * @param retryRequestOnIssue A function to retry the process to check/request for the currently failed bluetooth requirement.
 * @param cannotRetryRequest Whether the retry function retryRequestOnIssue can be called.
 *   For example, for permissions on Android, it is only possible to retry to request directly the user (and not make them
 *   go to the settings) if the user has not checked/triggered the "never ask again".
 * @param onUserClose A callback when the user tries to close the bottom drawer while all requirements are not respected.
 *   This is a mandatory prop as, until all the requirements are respected, the drawer does not normally close itself .
 *   To hide the drawer, update isOpen to false and update accordingly your logic as the requirements are not respected.
 * @param onDrawerHide A callback when the drawer is completely hidden. Don't use this to know if all requirements are respected,
 *   you should use bluetoothRequirementsState from useRequireBluetooth for that.
 */
const RequiresBluetoothDrawer = ({
  isOpenedOnIssue,
  bluetoothRequirementsState,
  retryRequestOnIssue,
  cannotRetryRequest = true,
  onUserClose,
  onDrawerHide,
}: RequiresBluetoothBottomModalProps) => {
  const onCloseBuilder = useCallback(
    (requestedToCloseDrawerName: BluetoothRequirementsState) => {
      return () => {
        // We know it means the user tried to close the drawer by pressing on the close button
        // only if the requirements that is not respected is the one associated to the drawer that is being closed
        if (bluetoothRequirementsState === requestedToCloseDrawerName) {
          onUserClose();
        }
      };
    },
    [bluetoothRequirementsState, onUserClose],
  );

  // To respect the "queued drawers" mechanism, keep 4 seperated QueuedDrawer (that are displayed one after the other if needed)
  // and do not try to only have 1 QueuedDrawer with its children/content being updated on bluetoothRequirementsState changes
  return (
    <>
      <QueuedDrawer
        isRequestingToBeOpened={
          isOpenedOnIssue &&
          bluetoothRequirementsState === "bluetooth_permissions_ungranted"
        }
        onClose={onCloseBuilder("bluetooth_permissions_ungranted")}
        preventBackdropClick
        onModalHide={onDrawerHide}
      >
        <BluetoothPermissionsDenied
          componentType="drawer"
          onRetry={retryRequestOnIssue}
          neverAskAgain={cannotRetryRequest}
        />
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={
          isOpenedOnIssue && bluetoothRequirementsState === "bluetooth_disabled"
        }
        onClose={onCloseBuilder("bluetooth_disabled")}
        preventBackdropClick
        onModalHide={onDrawerHide}
      >
        <BluetoothDisabled
          componentType="drawer"
          onRetry={retryRequestOnIssue}
        />
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={
          isOpenedOnIssue &&
          bluetoothRequirementsState === "location_permission_ungranted"
        }
        onClose={onCloseBuilder("location_permission_ungranted")}
        preventBackdropClick
        onModalHide={onDrawerHide}
      >
        <LocationPermissionDenied
          componentType="drawer"
          onRetry={retryRequestOnIssue}
          neverAskAgain={cannotRetryRequest}
        />
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={
          isOpenedOnIssue && bluetoothRequirementsState === "location_disabled"
        }
        onClose={onCloseBuilder("location_disabled")}
        preventBackdropClick
        onModalHide={onDrawerHide}
      >
        <LocationDisabled
          componentType="drawer"
          onRetry={retryRequestOnIssue}
        />
      </QueuedDrawer>
    </>
  );
};

export default RequiresBluetoothDrawer;
