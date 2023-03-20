import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { lastConnectedDeviceSelector } from "../reducers/settings";
import { knownDevicesSelector } from "../reducers/ble";
import { AddAccountsNavigatorParamList } from "../components/RootNavigator/types/AddAccountsNavigator";
import { StackNavigatorProps } from "../components/RootNavigator/types/helpers";
import { ReceiveFundsStackParamList } from "../components/RootNavigator/types/ReceiveFundsNavigator";
import { ScreenName } from "../const";
import { useDebouncedRequireBluetooth } from "../components/RequiresBLE/hooks/useRequireBluetooth";
import RequiresBluetoothDrawer from "../components/RequiresBLE/RequiresBluetoothDrawer";

type Navigation =
  | StackNavigatorProps<
      AddAccountsNavigatorParamList,
      ScreenName.AddAccountsSelectDevice
    >
  | StackNavigatorProps<
      ReceiveFundsStackParamList,
      ScreenName.ReceiveAddAccountSelectDevice
    >
  | StackNavigatorProps<
      ReceiveFundsStackParamList,
      ScreenName.ReceiveConnectDevice
    >;

type Props = {
  onResult: (device: Device) => void;
  route?: Navigation["route"] & { params: { forceSelectDevice?: boolean } };
};
let usbTimeout: ReturnType<typeof setTimeout>;

/**
 * Component to skip the selection of a device by choosing automatically the last connected device
 *
 * @param onResult callback to call when a device is chosen and selected
 */
export default function SkipSelectDevice({ onResult, route }: Props) {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const knownDevices = useSelector(knownDevicesSelector);

  const [hasUSB, setHasUSB] = useState(false);
  const [isBleRequired, setIsBleRequired] = useState(false);

  const forceSelectDevice = route?.params?.forceSelectDevice;

  useEffect(() => {
    const subscription = discoverDevices(() => true).subscribe(e => {
      setHasUSB(e.id.startsWith("usb|"));
    });
    return () => subscription.unsubscribe();
  }, [knownDevices]);

  // Enforces the BLE requirements for a "connecting" action. The requirements are only enforced
  // if the bluetooth is needed (isBleRequired is true).
  const {
    bluetoothRequirementsState,
    retryRequestOnIssue,
    cannotRetryRequest,
  } = useDebouncedRequireBluetooth({
    requiredFor: "connecting",
    isHookEnabled: isBleRequired,
  });

  useEffect(() => {
    if (
      !forceSelectDevice &&
      knownDevices?.length > 0 &&
      !hasUSB &&
      lastConnectedDevice
    ) {
      // Timeout to give some time to detect an usb connection
      usbTimeout = setTimeout(() => {
        // If it's a BLE device, the bluetooth requirements are enforced
        if (!lastConnectedDevice.wired) {
          setIsBleRequired(true);
        } else {
          onResult(lastConnectedDevice);
        }
      }, 500);
    } else {
      clearTimeout(usbTimeout);
    }
  }, [
    forceSelectDevice,
    hasUSB,
    knownDevices?.length,
    lastConnectedDevice,
    onResult,
  ]);

  useEffect(() => {
    // If the bluetooth requirements are met, the device is selected
    if (bluetoothRequirementsState === "all_respected" && lastConnectedDevice) {
      onResult(lastConnectedDevice);
    }
  }, [bluetoothRequirementsState, lastConnectedDevice, onResult]);

  // If the user tries to close the drawer displaying issues on BLE requirements,
  // this cancels the requirements checking and does not do anything in order to stop the
  // connection with a device via BLE
  const onUserCloseRequireBluetoothDrawer = useCallback(() => {
    setIsBleRequired(false);
  }, [setIsBleRequired]);

  return (
    <RequiresBluetoothDrawer
      isOpenedOnIssue={isBleRequired}
      onUserClose={onUserCloseRequireBluetoothDrawer}
      bluetoothRequirementsState={bluetoothRequirementsState}
      retryRequestOnIssue={retryRequestOnIssue}
      cannotRetryRequest={cannotRetryRequest}
    />
  );
}
