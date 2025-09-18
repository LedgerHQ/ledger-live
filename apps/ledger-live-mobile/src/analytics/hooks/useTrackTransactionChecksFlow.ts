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
  transactionChecksOptIn: boolean | undefined | null;
};

const getDefaultPayload = ({
  location,
  device,
  deviceInfo,
  appAndVersion,
}: {
  location: string | undefined;
  device: Device;
  deviceInfo: DeviceInfo | undefined | null;
  appAndVersion: AppAndVersion | undefined | null;
}) => ({
  page: location ?? "unknown",
  deviceType: device?.modelId,
  connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
  platform: "LLM",
  appName: appAndVersion?.name,
  appVersion: appAndVersion?.version,
  appFlags: appAndVersion?.flags.toString(),
  deviceInfoHardwareVersion: deviceInfo?.hardwareVersion,
  deviceInfoMcuVersion: deviceInfo?.mcuVersion,
  deviceInfoBootloaderVersion: deviceInfo?.bootloaderVersion,
  deviceInfoProviderName: deviceInfo?.providerName,
  deviceInfoLanguageId: deviceInfo?.languageId,
});

export const useTrackTransactionChecksFlow = ({
  location,
  device,
  deviceInfo,
  appAndVersion,
  transactionChecksOptInTriggered,
  transactionChecksOptIn,
}: UseTrackTransactionChecksFlow) => {
  const optInTriggered = useRef(false);
  const optInResult = useRef(false);

  if (transactionChecksOptInTriggered && !optInTriggered.current) {
    optInTriggered.current = true;

    track(
      "Transaction Check Opt-in Triggered",
      getDefaultPayload({ location, device, deviceInfo, appAndVersion }),
    );
  }

  if (
    transactionChecksOptIn !== null &&
    transactionChecksOptIn !== undefined &&
    !optInResult.current
  ) {
    optInResult.current = true;

    track(
      transactionChecksOptIn ? "Transaction Check Opt-in" : "Transaction Check Opt-out",
      getDefaultPayload({ location, device, deviceInfo, appAndVersion }),
    );
  }
};
