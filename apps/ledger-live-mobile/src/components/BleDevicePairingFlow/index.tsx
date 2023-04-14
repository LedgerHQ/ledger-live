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
import { HeaderBackButton } from "../HeaderBackButton";
import { HeaderCloseButton } from "../HeaderCloseButton";

const TIMEOUT_AFTER_PAIRED_MS = 2000;

// This could become a more generic way to make it possible for components to set (and clean)
// the associated screen header, while letting the responsibility to the screen to manage its header
export type SetHeaderOptionsRequest =
  | {
      type: "set";
      options: {
        headerLeft: () => React.ReactElement | null;
        headerRight: () => React.ReactElement | null;
      };
    }
  | {
      type: "clean";
    };

export type BleDevicePairingFlowProps = {
  filterByDeviceModelId?: BleDevicesScanningProps["filterByDeviceModelId"];
  areKnownDevicesDisplayed?: BleDevicesScanningProps["areKnownDevicesDisplayed"];
  areKnownDevicesPairable?: BleDevicesScanningProps["areKnownDevicesPairable"];
  onGoBackFromScanning?: BleDevicesScanningProps["onGoBack"];
  onPairingSuccess: BleDevicePairingProps["onPaired"];
  onPairingSuccessAddToKnownDevices?: boolean;
  /**
   * BleDevicePairingFlow component needs to be able to update the current (screen) header.
   * Any screen consuming this component (directly or indirectly, this prop should be passed along by any intermediary component)
   * should react to a request from this component to set or to clean its header.
   */
  // TODO: optional for now but should be mandatory
  requestToSetHeaderOptions?: (request: SetHeaderOptionsRequest) => void;
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
  areKnownDevicesPairable = false,
  onGoBackFromScanning,
  onPairingSuccess,
  onPairingSuccessAddToKnownDevices = false,
  requestToSetHeaderOptions,
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
      // The rest of the "on paired" logic is handled in a useEffect + timeout below in order
      // to display the success state to the user but still save the info that a device has been paired
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
    // If a device has been paired, we let the pairing flow end
    if (!isPaired) {
      track("button_clicked", { button: "Try BT pairing again" });
      setDeviceToPair(null);
      setPairingFlowStep("scanning");
    }
  }, [isPaired]);

  // Requests consumer component to override the header
  useEffect(() => {
    if (!requestToSetHeaderOptions) return () => undefined;

    if (pairingFlowStep === "scanning") {
      requestToSetHeaderOptions({
        type: "set",
        options: {
          headerLeft: () => <HeaderBackButton onPress={onGoBackFromScanning} />,
          headerRight: () => null,
        },
      });
    } else if (pairingFlowStep === "pairing") {
      if (!isPaired) {
        requestToSetHeaderOptions({
          type: "set",
          options: {
            headerLeft: () => null,
            headerRight: () => (
              <HeaderCloseButton onPress={onRetryPairingFlow} />
            ),
          },
        });
      } else {
        // If a device is paired, we still want to display the success component without the screen own header
        // but without any close or back button.
        requestToSetHeaderOptions({
          type: "set",
          options: {
            headerLeft: () => null,
            headerRight: () => null,
          },
        });
      }
    } else {
      requestToSetHeaderOptions({ type: "clean" });
    }

    return () => {
      // Sending a "clean" request here all the time does not seem to create a UI glitch between each change
      requestToSetHeaderOptions({ type: "clean" });
    };
  }, [
    isPaired,
    onGoBackFromScanning,
    onRetryPairingFlow,
    pairingFlowStep,
    requestToSetHeaderOptions,
  ]);

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
          areKnownDevicesPairable={areKnownDevicesPairable}
          onDeviceSelect={onDeviceSelect}
          onGoBack={onGoBackFromScanning}
        />
      ) : null}
    </RequiresBLE>
  );
};

export default BleDevicePairingFlow;
