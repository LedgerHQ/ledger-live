import React, { useEffect, useState } from "react";
import { Box } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";

import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/hw/hooks/useGetLatestAvailableFirmware";
import { command } from "~/renderer/commands";
import { getCurrentDevice } from "~/renderer/reducers/devices";

import SoftwareCheckContent from "./SoftwareCheckContent";
import GenuineCheckModal from "./GenuineCheckModal";
import GenuineCheckAnimationModal from "./GenuineCheckAnimationModal";
import { Status as SoftwareCheckStatus } from "./shared";

const UIDelay = 2500;

export type Props = {
  isDisplayed?: boolean;
  onComplete: () => void;
};

// The commands needs to be defined outside of the function component, to avoid creating it at
// each render, and re-triggering a run for their associated hooks
const getGenuineCheckFromDeviceIdCommand = command("getGenuineCheckFromDeviceId");
const getLatestAvailableFirmwareFromDeviceIdCommand = command(
  "getLatestAvailableFirmwareFromDeviceId",
);

const SoftwareCheckStep = ({ isDisplayed, onComplete }: Props) => {
  const [genuineCheckStatus, setGenuineCheckStatus] = useState<SoftwareCheckStatus>(
    SoftwareCheckStatus.inactive,
  );
  const [firmwareUpdateStatus, setFirmwareUpdateStatus] = useState<SoftwareCheckStatus>(
    SoftwareCheckStatus.inactive,
  );
  const [availableFirmwareVersion, setAvailableFirmwareVersion] = useState<string>("");

  const device = useSelector(getCurrentDevice);
  console.log(device);
  const deviceId = device?.deviceId ?? "";

  const { genuineState, devicePermissionState, error, resetGenuineCheckState } = useGenuineCheck({
    getGenuineCheckFromDeviceId: getGenuineCheckFromDeviceIdCommand,
    isHookEnabled: genuineCheckStatus === SoftwareCheckStatus.active,
    deviceId,
  });

  console.log(
    `🏴‍☠️🧙‍♂️: genuineState = ${genuineState}, devicePermissionState = ${devicePermissionState}, error = ${error}`,
  );

  const { latestFirmware /*, error */, status } = useGetLatestAvailableFirmware({
    getLatestAvailableFirmwareFromDeviceId: getLatestAvailableFirmwareFromDeviceIdCommand,
    isHookEnabled: firmwareUpdateStatus === SoftwareCheckStatus.active,
    deviceId,
  });

  console.log(
    `🏝: latestFirmware = ${JSON.stringify(
      latestFirmware,
    )}, status = ${status}, error = remove above comment`,
  );

  useEffect(() => {
    if (!isDisplayed) {
      return;
    }

    if (genuineCheckStatus === SoftwareCheckStatus.inactive) {
      setGenuineCheckStatus(SoftwareCheckStatus.requested);
    }

    if (genuineState === "genuine") {
      setGenuineCheckStatus(SoftwareCheckStatus.completed);
    }

    if (
      genuineCheckStatus === SoftwareCheckStatus.failed ||
      genuineCheckStatus === SoftwareCheckStatus.completed
    ) {
      setFirmwareUpdateStatus(SoftwareCheckStatus.requested);
    }
  }, [isDisplayed, genuineCheckStatus, genuineState]);

  useEffect(() => {
    if (!isDisplayed) {
      return;
    }

    if (firmwareUpdateStatus === SoftwareCheckStatus.requested) {
      setFirmwareUpdateStatus(SoftwareCheckStatus.active);
    }

    if (status === "available-firmware") {
      setAvailableFirmwareVersion(latestFirmware?.final.name ?? "");
      setFirmwareUpdateStatus(SoftwareCheckStatus.updateAvailable);
    }

    if (status === "no-available-firmware") {
      setFirmwareUpdateStatus(SoftwareCheckStatus.completed);
    }

    if (
      firmwareUpdateStatus === SoftwareCheckStatus.failed ||
      firmwareUpdateStatus === SoftwareCheckStatus.completed
    ) {
      console.log("DONE", genuineCheckStatus, firmwareUpdateStatus);
      setTimeout(onComplete, UIDelay);
    }
  }, [isDisplayed, firmwareUpdateStatus, onComplete, status, genuineCheckStatus, latestFirmware]);

  return (
    <Box>
      <GenuineCheckModal
        isOpen={genuineCheckStatus === "requested"}
        onClose={() => setGenuineCheckStatus(SoftwareCheckStatus.active)}
      />
      <GenuineCheckAnimationModal
        isOpen={devicePermissionState === "unlock-needed" || devicePermissionState === "requested"}
        animationName={
          devicePermissionState === "unlock-needed" ? "plugAndPinCode" : "allowManager"
        }
        deviceId={device?.modelId}
      />
      <SoftwareCheckContent
        genuineCheckStatus={genuineCheckStatus}
        firmwareUpdateStatus={firmwareUpdateStatus}
        availableFirmwareVersion={availableFirmwareVersion}
        handleSkipFirmwareUpdate={onComplete}
      />
    </Box>
  );
};

export default SoftwareCheckStep;
