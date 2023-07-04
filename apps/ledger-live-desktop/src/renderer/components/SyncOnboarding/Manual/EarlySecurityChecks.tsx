import React, { useCallback, useEffect, useState } from "react";
import { Flex } from "@ledgerhq/react-ui";
import manager from "@ledgerhq/live-common/manager/index";
import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { from } from "rxjs";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/hw/hooks/useGetLatestAvailableFirmware";
import { getGenuineCheckFromDeviceId } from "@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId";
import { getLatestAvailableFirmwareFromDeviceId } from "@ledgerhq/live-common/hw/getLatestAvailableFirmwareFromDeviceId";
import SoftwareCheckContent from "./SoftwareCheckContent";
import GenuineCheckModal from "./GenuineCheckModal";
import SoftwareCheckLockedDeviceModal from "./SoftwareCheckLockedDeviceModal";
import SoftwareCheckAllowSecureChannelModal from "./SoftwareCheckAllowSecureChannelModal";
import GenuineCheckCancelModal from "./GenuineCheckCancelModal";
import GenuineCheckNotGenuineModal from "./GenuineCheckNotGenuineModal";
import { Status as SoftwareCheckStatus } from "./types";
import { getDeviceModel } from "@ledgerhq/devices";
import { useSelector } from "react-redux";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { localeSelector } from "~/renderer/reducers/settings";
import { setDrawer } from "~/renderer/drawers/Provider";
import UpdateFirmwareModal, {
  Props as UpdateFirmwareModalProps,
} from "~/renderer/modals/UpdateFirmwareModal";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { initialStepId } from "~/renderer/screens/manager/FirmwareUpdate";

const UIDelay = 2500;

export type Props = {
  onComplete: () => void;
  device: Device;
};

/**
 * Component representing the early security checks step, which polls the current device state
 * to display correctly information about the onboarding to the user
 */
const EarlySecurityChecks = ({ onComplete, device }: Props) => {
  const locale = useSelector(localeSelector);
  const whySecurityChecksUrl =
    locale in urls.genuineCheck
      ? urls.genuineCheck[locale as keyof typeof urls.genuineCheck]
      : urls.genuineCheck.en;
  const [genuineCheckStatus, setGenuineCheckStatus] = useState<SoftwareCheckStatus>(
    SoftwareCheckStatus.inactive,
  );
  const [firmwareUpdateStatus, setFirmwareUpdateStatus] = useState<SoftwareCheckStatus>(
    SoftwareCheckStatus.inactive,
  );
  const [availableFirmwareVersion, setAvailableFirmwareVersion] = useState<string>("");

  const deviceId = device.deviceId ?? "";
  const deviceModelId = device.modelId;
  const productName = getDeviceModel(device.modelId).productName;

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

  const closeFwUpdateDrawer = useCallback(() => {
    setDrawer();
    // TODO: set status to cancelled ? and update icon for cancelled
  }, []);

  const startFirmwareUpdate = useCallback(() => {
    // TODO: use deviceInfo from useGetLatestAvailableFirmware once implemented by Alex
    withDevice(deviceId)(transport => from(getDeviceInfo(transport)))
      .toPromise()
      .then(deviceInfo => {
        console.log("deviceInfo", deviceInfo);
        const modal = deviceInfo.isOSU ? "install" : "disclaimer";
        const stepId = initialStepId({ device, deviceInfo });
        const updateFirmwareModalProps: UpdateFirmwareModalProps = {
          withAppsToReinstall: false,
          withResetStep: manager.firmwareUpdateNeedsLegacyBlueResetInstructions(
            deviceInfo,
            device.modelId,
          ),
          onDrawerClose: closeFwUpdateDrawer,
          status: modal,
          stepId: stepId,
          firmware: latestFirmware,
          deviceInfo,
          device,
          deviceModelId: deviceModelId,
          setFirmwareUpdateOpened: () => null, // TODO: see if we need to keep that state locally
          setFirmwareUpdateCompleted: () => {
            setGenuineCheckStatus(SoftwareCheckStatus.requested);
            setFirmwareUpdateStatus(SoftwareCheckStatus.inactive);
          },
        };

        setDrawer(UpdateFirmwareModal, updateFirmwareModalProps, {
          preventBackdropClick: true,
          forceDisableFocusTrap: true,
          onRequestClose: closeFwUpdateDrawer,
        });
      })
      .catch(e => console.error(e));
  }, [device, deviceId, deviceModelId, latestFirmware]);

  useEffect(() => {
    if (devicePermissionState === "refused") {
      setGenuineCheckStatus(SoftwareCheckStatus.cancelled);
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
  }, [genuineCheckStatus, genuineState, devicePermissionState]);

  useEffect(() => {
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
  }, [firmwareUpdateStatus, onComplete, status, genuineCheckStatus, latestFirmware]);

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
    <Flex flex={1} justifyContent="center" alignItems="center">
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
        modelName={productName}
        onClickStartChecks={() => setGenuineCheckStatus(SoftwareCheckStatus.requested)}
        onClickWhyPerformSecurityChecks={() => openURL(whySecurityChecksUrl)}
        onClickResumeGenuineCheck={() => setGenuineCheckStatus(SoftwareCheckStatus.requested)}
        onClickViewUpdate={startFirmwareUpdate}
        onClickContinueToSetup={onComplete}
      />
    </Flex>
  );
};

export default EarlySecurityChecks;
