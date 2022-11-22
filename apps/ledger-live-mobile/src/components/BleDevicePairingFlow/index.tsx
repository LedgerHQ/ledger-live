import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import RequiresBLE from "../RequiresBLE";
import BleDevicesScanning from "./BleDevicesScanning";
import BleDevicePairing from "./BleDevicePairing";
import { addKnownDevice } from "../../actions/ble";

export type BleDevicePairingFlowProps = {
  onSuccess: (pairedDevice: Device) => void;
  onSuccessAddToKnownDevices?: boolean;
  filterByDeviceModelId?: DeviceModelId;
  areKnownDevicesDisplayed?: boolean;
};

// A "done" state to avoid having the BLE scanning on the device that we just paired
// and to which messages are going to be exchanged via BLE
type PairingFlowStep = "scanning" | "pairing" | "done";

/**
 * Screen handling the BLE flow with a scanning step and a pairing step
 */
const BleDevicePairingFlow = ({
  filterByDeviceModelId = DeviceModelId.nanoFTS, // This needs to be removed when nanos are supported
  areKnownDevicesDisplayed = true,
  onSuccessAddToKnownDevices = false,
  onSuccess,
}: BleDevicePairingFlowProps) => {
  const dispatchRedux = useDispatch();

  // TODO: Might need something to reset the 2 states
  // Before:
  // // Resets when the navigation goes back to this screen
  // const [pairingFlowStep, setPairingFlowStep] = useResetOnNavigationFocusState<
  //   PairingFlowStep,
  //   Props["navigation"]
  // >(navigation, "scanning");

  // // Resets when the navigation goes back to this screen
  // const [deviceToPair, setDeviceToPair] = useResetOnNavigationFocusState<
  //   Device | null,
  //   Props["navigation"]
  // >(navigation, null);

  const [pairingFlowStep, setPairingFlowStep] =
    useState<PairingFlowStep>("scanning");

  const [deviceToPair, setDeviceToPair] = useState<Device | null>(null);

  const onDeviceSelect = useCallback(
    (item: Device) => {
      const deviceToPair = {
        deviceId: item.deviceId,
        deviceName: item.deviceName,
        modelId: item.modelId,
        wired: false,
      };

      setDeviceToPair(deviceToPair);
      setPairingFlowStep("pairing");
    },
    [setDeviceToPair, setPairingFlowStep],
  );

  const onPaired = useCallback(
    (device: Device) => {
      if (onSuccessAddToKnownDevices) {
        dispatchRedux(
          addKnownDevice({
            id: device.deviceId,
            name: device.deviceName ?? device.modelId,
            modelId: device.modelId,
          }),
        );
      }

      // TODO: Before navigating, to never come back a the successful pairing but to the scanning part
      setDeviceToPair(null);
      setPairingFlowStep("done");

      onSuccess(device);
    },
    [dispatchRedux, onSuccess, onSuccessAddToKnownDevices],
  );

  const onRetryPairingFlow = useCallback(() => {
    setDeviceToPair(null);
    setPairingFlowStep("scanning");
  }, [setDeviceToPair, setPairingFlowStep]);

  console.log(
    `🦄 pairingFlowStep: ${pairingFlowStep} | deviceToPair: ${JSON.stringify(
      deviceToPair,
    )}`,
  );

  return (
    <RequiresBLE>
      {pairingFlowStep === "pairing" && deviceToPair !== null ? (
        <BleDevicePairing
          deviceToPair={deviceToPair}
          onPaired={onPaired}
          onRetry={onRetryPairingFlow}
        />
      ) : pairingFlowStep === "scanning" ? (
        <BleDevicesScanning
          filterByDeviceModelId={filterByDeviceModelId}
          areKnownDevicesDisplayed={areKnownDevicesDisplayed}
          onDeviceSelect={onDeviceSelect}
        />
      ) : null}
    </RequiresBLE>
  );
};

export default BleDevicePairingFlow;
