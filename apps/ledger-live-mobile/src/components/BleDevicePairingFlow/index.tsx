import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import RequiresBLE from "../RequiresBLE";
import BleDevicesScanning from "./BleDevicesScanning";
import BleDevicePairing from "./BleDevicePairing";
import { addKnownDevice } from "../../actions/ble";
import type { BleDevicesScanningProps } from "./BleDevicesScanning";
import type { BleDevicePairingProps } from "./BleDevicePairing";
import { track } from "../../analytics";
import { useSetNavigationHeader } from "../../hooks/useSetNavigationHeader";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import { NavigationHeaderCloseButton } from "../NavigationHeaderCloseButton";

const TIMEOUT_AFTER_PAIRED_MS = 2000;

export type BleDevicePairingFlowProps = {
  filterByDeviceModelId?: BleDevicesScanningProps["filterByDeviceModelId"];
  areKnownDevicesDisplayed?: BleDevicesScanningProps["areKnownDevicesDisplayed"];
  onGoBackFromScanning?: () => void;
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
  const [isPaired, setIsPaired] = useState(false);

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
      // Handled in a useEffect to display the success state to the user
      setIsPaired(true);

      if (onPairingSuccessAddToKnownDevices) {
        dispatchRedux(
          addKnownDevice({
            id: device.deviceId,
            name: device.deviceName ?? device.modelId,
            modelId: device.modelId,
          }),
        );
      }
    },
    [dispatchRedux, onPairingSuccessAddToKnownDevices],
  );

  useEffect(() => {
    let timeout: null | ReturnType<typeof setTimeout>;

    if (isPaired && deviceToPair) {
      // Timeout to display the success to the user
      timeout = setTimeout(() => {
        setDeviceToPair(null);
        setIsPaired(false);
        // "done": does not reset the state to "scanning" because it would display
        // the scanning component before calling onPairingSuccess
        setPairingFlowStep("done");

        onPairingSuccess(deviceToPair);
      }, TIMEOUT_AFTER_PAIRED_MS);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [deviceToPair, isPaired, onPairingSuccess]);

  const onRetryPairingFlow = useCallback(() => {
    if (!isPaired) {
      track("button_clicked", { button: "Try BT pairing again" });
      setDeviceToPair(null);
      setPairingFlowStep("scanning");
    }
  }, [isPaired]);

  // Sets dynamically the header for the scanning and pairing steps
  let headerShown;
  let headerRight;
  let headerLeft;

  if (pairingFlowStep === "scanning" && onGoBackFromScanning) {
    headerShown = true;
    headerRight = null;
    headerLeft = () => (
      <NavigationHeaderBackButton onPress={onGoBackFromScanning} />
    );
  } else if (pairingFlowStep === "pairing") {
    headerShown = true;
    headerRight = () => (
      <NavigationHeaderCloseButton onPress={onRetryPairingFlow} />
    );
    headerLeft = null;
  }

  useSetNavigationHeader({
    headerShown,
    headerRight,
    headerLeft,
  });

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
