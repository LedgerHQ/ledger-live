import { Device } from "@ledgerhq/types-devices";
import { track } from "../segment";
import { CONNECTION_TYPES } from "./variables";
import { useRef } from "react";
import { DeviceInfo } from "@ledgerhq/types-live";
import { AppAndVersion } from "@ledgerhq/live-common/hw/connectApp";

export type UseTrackTransactionChecksFlow = {
  location: string | undefined;
  device: Device;
  deviceInfo: DeviceInfo | undefined | null;
  appAndVersion: AppAndVersion | undefined | null;
  transactionChecksOptInTriggered: boolean | undefined | null;
  isTrackingEnabled: boolean;
};

export const useTrackTransactionChecksFlow = ({
  location,
  device,
  deviceInfo,
  appAndVersion,
  transactionChecksOptInTriggered,
  isTrackingEnabled,
}: UseTrackTransactionChecksFlow) => {
  const triggered = useRef(false);

  if (transactionChecksOptInTriggered && !triggered.current) {
    triggered.current = true;

    const defaultPayload = {
      page: location ?? "unknown",
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLD",
      appName: appAndVersion?.name,
      appVersion: appAndVersion?.version,
      appFlags: appAndVersion?.flags.toString(),
      deviceInfoHardwareVersion: deviceInfo?.hardwareVersion,
      deviceInfoMcuVersion: deviceInfo?.mcuVersion,
      deviceInfoBootloaderVersion: deviceInfo?.bootloaderVersion,
      deviceInfoProviderName: deviceInfo?.providerName,
      deviceInfoLanguageId: deviceInfo?.languageId,
    };

    track("Transaction Check Opt-in Triggered", defaultPayload, isTrackingEnabled);
  }
};
