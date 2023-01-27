import React from "react";
import { Text } from "@ledgerhq/native-ui";
import BottomModal from "../BottomModal";
import { BluetoothRequirementsState } from "./hooks/useRequireBluetooth";
import BluetoothDisabled from "./BluetoothDisabled";
import LocationDisabled from "../RequiresLocation/LocationDisabled";

export type BleRequirementsState = "unknown" | "respected" | "not_respected";

export type RequiresBluetoothBottomModalProps = {
  isOpen?: boolean;
  bluetoothRequirementsState: BluetoothRequirementsState;
  handleRetryOnIssue: (() => void) | null;
};

/**
 * Drawer to use with the hook useRequireBluetooth hook.
 *
 * @param param0
 * @returns
 */
const RequiresBluetoothBottomModal = ({
  isOpen = true,
  bluetoothRequirementsState,
  handleRetryOnIssue,
}: RequiresBluetoothBottomModalProps) => {
  console.log(
    `🦖 RequiresBluetoothBottomModal bluetoothRequirementsState: ${bluetoothRequirementsState}`,
  );

  const onClose = () => {
    console.log(`🦖 RequiresBluetoothBottomModal onClose`);
  };

  let content = null;

  switch (bluetoothRequirementsState) {
    case "bluetooth permissions ungranted":
      // eslint-disable-next-line react/jsx-no-undef
      content = <Text>bluetooth permissions denied ❌</Text>;
      break;
    case "bluetooth disabled":
      content = (
        <BluetoothDisabled
          componentType="drawer"
          onRetry={handleRetryOnIssue}
        />
      );
      break;
    case "location disabled":
      content = (
        <LocationDisabled componentType="drawer" onRetry={handleRetryOnIssue} />
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

export default RequiresBluetoothBottomModal;
