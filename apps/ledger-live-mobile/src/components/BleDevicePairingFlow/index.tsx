import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "~/context/hooks";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";

import RequiresBLE from "../RequiresBLE";
import { addKnownDevice } from "~/actions/ble";
import type { BleDevicesScanningProps } from "./BleDevicesScanning";
import { track } from "~/analytics";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import { NavigationHeaderCloseButton } from "../NavigationHeaderCloseButton";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { useTrackOnboardingFlow } from "~/analytics/hooks/useTrackOnboardingFlow";
import { DmkBleDevicesScanning } from "./DmkBleDevicesScanning";
import { DmkBleDevicePairing } from "./DmkBleDevicePairing";
import { urls } from "~/utils/urls";
import { Linking } from "react-native";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { BleScanningState, ScannedDevice } from "@ledgerhq/live-dmk-mobile";

const TIMEOUT_AFTER_PAIRED_MS = 2000;

// This could become a more generic way to make it possible for components to set (and clean)
// the associated screen header, while letting the responsibility to the screen to manage its header
export type SetHeaderOptionsRequest =
  | {
      type: "set";
      options: {
        headerLeft: () => React.ReactElement | null;
        headerRight: () => React.ReactElement | null;
        headerBackVisible?: boolean;
      };
    }
  | {
      type: "clean";
    };

export type BleDevicePairingFlowProps = {
  /**
   * During scanning step: the only model of the devices that will be scanned
   */
  filterByDeviceModelId?: BleDevicesScanningProps["filterByDeviceModelId"];

  /**
   * During scanning step: if true, display already known devices by LLM
   */
  areKnownDevicesDisplayed?: BleDevicesScanningProps["areKnownDevicesDisplayed"];

  /**
   * During scanning step: if true, allow the pairing of already known devices by LLM
   */
  areKnownDevicesPairable?: BleDevicesScanningProps["areKnownDevicesPairable"];

  /**
   * During scanning step a back arrow button is requested to be set:
   * callback called when the user press on the button.
   * Default: navigation.goBack()
   */
  onGoBackFromScanning?: () => void;

  /**
   * During pairing step: callback called when the pairing is done and successful
   * @param device - The device that was paired. (legacy Device type)
   * @param discoveredDevice - The discovered device that was paired. (directly compatible with DeviceManagementKit.connect())
   */
  onPairingSuccess: (device: Device, discoveredDevice: DiscoveredDevice) => void;

  /**
   * During pairing step: if true, this component adds the paired device to the list of known devices by LLM
   *  before calling onPairingSuccess
   */
  onPairingSuccessAddToKnownDevices?: boolean;

  /**
   * BleDevicePairingFlow component needs to be able to update the current (screen) header.
   * Any screen consuming this component (directly or indirectly, this prop should be passed along by any intermediary component)
   * should react to a request from this component to set or to clean its header.
   */
  requestToSetHeaderOptions: (request: SetHeaderOptionsRequest) => void;

  /**
   * In some cases, the parent of this component handles the scanning logic, so we pass the scanning state there.
   */
  bleScanningState?: BleScanningState;

  /**
   * Notifies changes in the pairing flow step
   */
  onPairingFlowStepChanged?: (step: PairingFlowStep | null) => void;
  /**
   * The headers for onboarding are configured to be only back arrows whilst in other flows can be cross icons.
   */
  isOnboarding?: boolean;
};

// A "done" state to avoid having the BLE scanning on the device that we just paired
// and to which messages are going to be exchanged via BLE
export type PairingFlowStep = "scanning" | "pairing" | "done";

/**
 * Handles and renders a full BLE pairing flow: scanning and pairing steps
 */
const BleDevicePairingFlow: React.FC<BleDevicePairingFlowProps> = ({
  filterByDeviceModelId,
  areKnownDevicesDisplayed = true,
  areKnownDevicesPairable = false,
  onGoBackFromScanning,
  onPairingSuccess,
  onPairingSuccessAddToKnownDevices = false,
  requestToSetHeaderOptions,
  onPairingFlowStepChanged,
  bleScanningState,
  isOnboarding,
}) => {
  const dispatchRedux = useDispatch();

  const [pairingFlowStep, setPairingFlowStep] = useState<PairingFlowStep>("scanning");

  useEffect(() => {
    onPairingFlowStepChanged?.(pairingFlowStep);
    return () => {
      onPairingFlowStepChanged?.(null);
    };
  }, [pairingFlowStep, onPairingFlowStepChanged]);

  type DeviceToPair = Device & { discoveredDevice: DiscoveredDevice };
  const [deviceToPair, setDeviceToPair] = useState<DeviceToPair | null>(null);
  const [isPaired, setIsPaired] = useState(false);

  const onDeviceSelect = useCallback(
    (item: ScannedDevice) => {
      setDeviceToPair({
        deviceId: item.deviceId,
        deviceName: item.deviceName,
        modelId: item.modelId,
        wired: false,
        discoveredDevice: item.discoveredDevice,
      });
      setPairingFlowStep("pairing");
    },
    [setPairingFlowStep],
  );

  useTrackOnboardingFlow({
    location: HOOKS_TRACKING_LOCATIONS.onboardingFlow,
    device: deviceToPair,
    isPaired,
  });

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

        onPairingSuccess(deviceToPair, deviceToPair.discoveredDevice);
      }, TIMEOUT_AFTER_PAIRED_MS);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [deviceToPair, isPaired, onPairingSuccess]);

  const pairingUrl = useLocalizedUrl(urls.errors.PairingFailed);
  const onRetryPairingFlow = useCallback(() => {
    // If a device has been paired, we let the pairing flow end
    if (!isPaired) {
      track("button_clicked", { button: "Try BT pairing again" });
      setDeviceToPair(null);
      setPairingFlowStep("scanning");
    }
  }, [isPaired]);

  const onOpenHelp = useCallback(() => {
    Linking.openURL(pairingUrl);
  }, [pairingUrl]);

  // Requests consumer component to override the header
  useEffect(() => {
    if (pairingFlowStep === "scanning") {
      requestToSetHeaderOptions({
        type: "set",
        options: {
          headerLeft: () => <NavigationHeaderBackButton onPress={onGoBackFromScanning} />,
          headerRight: () => null,
        },
      });
    } else if (pairingFlowStep === "pairing") {
      if (!isPaired) {
        const options = isOnboarding
          ? {
              headerLeft: () => <NavigationHeaderBackButton onPress={onRetryPairingFlow} />,
              headerRight: () => null,
            }
          : {
              headerLeft: () => null,
              headerBackVisible: false,
              headerRight: () => <NavigationHeaderCloseButton onPress={onRetryPairingFlow} />,
            };
        requestToSetHeaderOptions({
          type: "set",
          options,
        });
      } else {
        // If a device is paired, we still want to display the success component without the screen own header
        // but without any close or back button.
        requestToSetHeaderOptions({
          type: "set",
          options: {
            headerLeft: () => null,
            headerBackVisible: false,
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
    isOnboarding,
  ]);

  return (
    <RequiresBLE>
      {pairingFlowStep === "pairing" && deviceToPair !== null ? (
        <DmkBleDevicePairing
          device={deviceToPair}
          onPaired={onPaired}
          onRetry={onRetryPairingFlow}
          onOpenHelp={onOpenHelp}
        />
      ) : pairingFlowStep === "scanning" ? (
        <DmkBleDevicesScanning
          filterByDeviceModelId={filterByDeviceModelId}
          areKnownDevicesDisplayed={areKnownDevicesDisplayed}
          areKnownDevicesPairable={areKnownDevicesPairable}
          onDeviceSelect={onDeviceSelect}
          bleScanningState={bleScanningState}
        />
      ) : null}
    </RequiresBLE>
  );
};

export default BleDevicePairingFlow;
