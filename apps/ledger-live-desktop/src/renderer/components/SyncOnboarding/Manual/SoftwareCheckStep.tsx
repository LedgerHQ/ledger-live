import React, { useCallback, useEffect, useState } from "react";
import { Box } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";

import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/hw/hooks/useGetLatestAvailableFirmware";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { getGenuineCheckFromDeviceId } from "@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId";
import { getLatestAvailableFirmwareFromDeviceId } from "@ledgerhq/live-common/hw/getLatestAvailableFirmwareFromDeviceId";

import SoftwareCheckContent from "./SoftwareCheckContent";
import GenuineCheckModal from "./GenuineCheckModal";
import SoftwareCheckLockedDeviceModal from "./SoftwareCheckLockedDeviceModal";
import SoftwareCheckAllowSecureChannelModal from "./SoftwareCheckAllowSecureChannelModal";
import GenuineCheckCancelModal from "./GenuineCheckCancelModal";
import GenuineCheckNotGenuineModal from "./GenuineCheckNotGenuineModal";
import { Status as SoftwareCheckStatus } from "./shared";

const UIDelay = 2500;

export type Props = {
  isDisplayed?: boolean;
  onComplete: () => void;
  productName: string;
  deviceModelId: DeviceModelId;
};

const SoftwareCheckStep = ({ isDisplayed, onComplete, productName, deviceModelId }: Props) => {
  const [genuineCheckStatus, setGenuineCheckStatus] = useState<SoftwareCheckStatus>(
    SoftwareCheckStatus.inactive,
  );
  const [firmwareUpdateStatus, setFirmwareUpdateStatus] = useState<SoftwareCheckStatus>(
    SoftwareCheckStatus.inactive,
  );
  const [availableFirmwareVersion, setAvailableFirmwareVersion] = useState<string>("");

  const device = useSelector(getCurrentDevice);
  const deviceId = device?.deviceId ?? "";

  const { genuineState, devicePermissionState, resetGenuineCheckState } = useGenuineCheck({
    getGenuineCheckFromDeviceId,
    isHookEnabled: genuineCheckStatus === SoftwareCheckStatus.active,
    deviceId,
  });

  const { latestFirmware, status, lockedDevice } = useGetLatestAvailableFirmware({
    getLatestAvailableFirmwareFromDeviceId,
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

  const lockedDeviceOnClose = useCallback(() => {
    if (genuineCheckStatus === SoftwareCheckStatus.active) {
      // Triggers a prompt asking for the user to retry or confirm cancelling
      setGenuineCheckStatus(SoftwareCheckStatus.cancelled);
    } else if (firmwareUpdateStatus === SoftwareCheckStatus.active) {
      // No prompt, directly failed status
      setFirmwareUpdateStatus(SoftwareCheckStatus.failed);
    }
  }, [firmwareUpdateStatus, genuineCheckStatus]);

  const lockedDeviceModalIsOpen =
    (devicePermissionState === "unlock-needed" &&
      genuineCheckStatus === SoftwareCheckStatus.active) ||
    (lockedDevice && firmwareUpdateStatus === SoftwareCheckStatus.active);

  const allowSecureChannelIsOpen =
    devicePermissionState === "requested" &&
    (genuineCheckStatus === SoftwareCheckStatus.active ||
      firmwareUpdateStatus === SoftwareCheckStatus.active);

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
      <SoftwareCheckLockedDeviceModal
        isOpen={lockedDeviceModalIsOpen}
        deviceModelId={deviceModelId}
        productName={productName}
        onClose={lockedDeviceOnClose}
      />
      <SoftwareCheckAllowSecureChannelModal
        isOpen={allowSecureChannelIsOpen}
        deviceModelId={deviceModelId}
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
