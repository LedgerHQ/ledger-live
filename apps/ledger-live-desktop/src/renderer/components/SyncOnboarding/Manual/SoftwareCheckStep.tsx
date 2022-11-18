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
import GenuineCheckCancelModal from "./GenuineCheckCancelModal";
import GenuineCheckNotGenuineModal from "./GenuineCheckNotGenuineModal";
import { Status as SoftwareCheckStatus } from "./shared";

const UIDelay = 2500;

export type Props = {
  isDisplayed?: boolean;
  onComplete: () => void;
  productName: string;
};

// The commands needs to be defined outside of the function component, to avoid creating it at
// each render, and re-triggering a run for their associated hooks
const getGenuineCheckFromDeviceIdCommand = command("getGenuineCheckFromDeviceId");
const getLatestAvailableFirmwareFromDeviceIdCommand = command(
  "getLatestAvailableFirmwareFromDeviceId",
);

const SoftwareCheckStep = ({ isDisplayed, onComplete, productName }: Props) => {
  const [genuineCheckStatus, setGenuineCheckStatus] = useState<SoftwareCheckStatus>(
    SoftwareCheckStatus.inactive,
  );
  const [firmwareUpdateStatus, setFirmwareUpdateStatus] = useState<SoftwareCheckStatus>(
    SoftwareCheckStatus.inactive,
  );
  const [availableFirmwareVersion, setAvailableFirmwareVersion] = useState<string>("");

  const device = useSelector(getCurrentDevice);
  const deviceId = device?.deviceId ?? "";

  const { genuineState, devicePermissionState, error, resetGenuineCheckState } = useGenuineCheck({
    getGenuineCheckFromDeviceId: getGenuineCheckFromDeviceIdCommand,
    isHookEnabled: genuineCheckStatus === SoftwareCheckStatus.active,
    deviceId,
  });

  const { latestFirmware /*, error */, status } = useGetLatestAvailableFirmware({
    getLatestAvailableFirmwareFromDeviceId: getLatestAvailableFirmwareFromDeviceIdCommand,
    isHookEnabled: firmwareUpdateStatus === SoftwareCheckStatus.active,
    deviceId,
  });

  useEffect(() => {
    if (!isDisplayed) {
      return;
    }

    if (devicePermissionState === "refused") {
      setGenuineCheckStatus(SoftwareCheckStatus.cancelled);
    }

    if (genuineCheckStatus === SoftwareCheckStatus.inactive) {
      setTimeout(() => setGenuineCheckStatus(SoftwareCheckStatus.requested), UIDelay);
    }

    if (genuineState === "non-genuine") {
      setGenuineCheckStatus(SoftwareCheckStatus.notGenuine);
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
  }, [isDisplayed, genuineCheckStatus, genuineState, devicePermissionState]);

  useEffect(() => {
    if (!isDisplayed) {
      return;
    }

    if (firmwareUpdateStatus === SoftwareCheckStatus.requested) {
      setFirmwareUpdateStatus(SoftwareCheckStatus.active);
    }

    if (status === "available-firmware") {
      setAvailableFirmwareVersion(latestFirmware?.final.name || "");
      setFirmwareUpdateStatus(SoftwareCheckStatus.updateAvailable);
    }

    if (status === "no-available-firmware") {
      setFirmwareUpdateStatus(SoftwareCheckStatus.completed);
    }

    if (
      firmwareUpdateStatus === SoftwareCheckStatus.failed ||
      firmwareUpdateStatus === SoftwareCheckStatus.completed
    ) {
      setTimeout(onComplete, UIDelay);
    }
  }, [isDisplayed, firmwareUpdateStatus, onComplete, status, genuineCheckStatus, latestFirmware]);

  return (
    <Box>
      <GenuineCheckModal
        isOpen={genuineCheckStatus === SoftwareCheckStatus.requested}
        onClose={() => setGenuineCheckStatus(SoftwareCheckStatus.active)}
        productName={productName}
      />
      <GenuineCheckCancelModal
        isOpen={genuineCheckStatus === SoftwareCheckStatus.cancelled}
        onClose={() => {
          resetGenuineCheckState();
          setGenuineCheckStatus(SoftwareCheckStatus.requested);
        }}
        onSkip={() => {
          resetGenuineCheckState();
          setGenuineCheckStatus(SoftwareCheckStatus.failed);
        }}
        productName={productName}
      />
      <GenuineCheckNotGenuineModal
        isOpen={genuineCheckStatus === SoftwareCheckStatus.notGenuine}
        onClose={() => {
          resetGenuineCheckState();
          setGenuineCheckStatus(SoftwareCheckStatus.requested);
        }}
        onSkip={() => {
          resetGenuineCheckState();
          setGenuineCheckStatus(SoftwareCheckStatus.failed);
        }}
      />
      <GenuineCheckAnimationModal
        isOpen={devicePermissionState === "unlock-needed" || devicePermissionState === "requested"}
        animationName={
          devicePermissionState === "unlock-needed" ? "plugAndPinCode" : "allowManager"
        }
        deviceId={device?.modelId}
        productName={productName}
      />
      <SoftwareCheckContent
        genuineCheckStatus={genuineCheckStatus}
        firmwareUpdateStatus={firmwareUpdateStatus}
        availableFirmwareVersion={availableFirmwareVersion}
        handleSkipFirmwareUpdate={onComplete}
        productName={productName}
      />
    </Box>
  );
};

export default SoftwareCheckStep;
