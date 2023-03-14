import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import RequiresBLE from "../RequiresBLE";
import BleDevicesScanning from "./BleDevicesScanning";
import BleDevicePairing from "./BleDevicePairing";
import { addKnownDevice } from "../../actions/ble";
import type { BleDevicesScanningProps } from "./BleDevicesScanning";
import type { BleDevicePairingProps } from "./BleDevicePairing";
import { track } from "../../analytics";

export type BleDevicePairingFlowProps = {
  filterByDeviceModelId?: BleDevicesScanningProps["filterByDeviceModelId"];
  areKnownDevicesDisplayed?: BleDevicesScanningProps["areKnownDevicesDisplayed"];
  onGoBackFromScanning?: BleDevicesScanningProps["onGoBack"];
  onPairingSuccess: BleDevicePairingProps["onPaired"];
  onPairingSuccessAddToKnownDevices?: boolean;
};

// A "done" state to avoid having the BLE scanning on the device that we just paired
// and to which messages are going to be exchanged via BLE
type PairingFlowStep = "scanning" | "pairing" | "done";

/**
 * Handles and renders a full BLE pairing flow: scanning and pairing steps
 *
 * @param filterByDeviceModelId Scanning step: the only model of the devices that will be scanned
 * @param areKnownDevicesDisplayed Scanning step: choose to display seen devices that are already known by LLM
 * @param onGoBackFromScanning Scanning step: If this function is set, a back arrow is displayed that calls this function if pressed
 * @param onPairingSuccess Pairing step: function called when the pairing is done and successful
 * @param onPairingSuccessAddToKnownDevices Pairing step: if true, this component adds the paired device to the list of known devices by LLM
 *  before calling onPairingSuccess
 */
const BleDevicePairingFlow = ({
  filterByDeviceModelId,
  areKnownDevicesDisplayed = true,
  onGoBackFromScanning,
  onPairingSuccess,
  onPairingSuccessAddToKnownDevices = false,
}: BleDevicePairingFlowProps) => {
  const dispatchRedux = useDispatch();

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
      if (onPairingSuccessAddToKnownDevices) {
        dispatchRedux(
          addKnownDevice({
            id: device.deviceId,
            name: device.deviceName ?? device.modelId,
            modelId: device.modelId,
          }),
        );
      }

      // Cannot reset the states so it ends up in the scanning step because this would display the scanning component
      // before calling onPairingSuccess
      setDeviceToPair(null);
      setPairingFlowStep("done");

      onPairingSuccess(device);
    },
    [dispatchRedux, onPairingSuccess, onPairingSuccessAddToKnownDevices],
  );

  const onRetryPairingFlow = useCallback(() => {
    track("button_clicked", { button: "Try BT pairing again" });
    setDeviceToPair(null);
    setPairingFlowStep("scanning");
  }, [setDeviceToPair, setPairingFlowStep]);

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
          onGoBack={onGoBackFromScanning}
        />
      ) : null}
    </RequiresBLE>
  );
};

export default BleDevicePairingFlow;
