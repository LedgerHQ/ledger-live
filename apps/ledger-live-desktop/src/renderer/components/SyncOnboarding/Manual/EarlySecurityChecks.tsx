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
import SoftwareCheckLockedDeviceModal, {
  Props as SoftwareCheckLockedDeviceModalProps,
} from "./SoftwareCheckLockedDeviceDrawer";
import SoftwareCheckAllowSecureChannelDrawer, {
  Props as SoftwareCheckAllowSecureChannelDrawerProps,
} from "./SoftwareCheckAllowSecureChannelDrawer";
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
          stepId,
          firmware: latestFirmware,
          deviceInfo,
          device,
          deviceModelId: deviceModelId,
          setFirmwareUpdateOpened: () => null, // we don't need to keep the state
          setFirmwareUpdateCompleted: () => {
            resetGenuineCheckState();
            setGenuineCheckStatus(SoftwareCheckStatus.active);
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
  }, [
    closeFwUpdateDrawer,
    device,
    deviceId,
    deviceModelId,
    latestFirmware,
    resetGenuineCheckState,
  ]);

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
      setFirmwareUpdateStatus(SoftwareCheckStatus.active);
    }
  }, [genuineCheckStatus, genuineState, devicePermissionState]);

  useEffect(() => {
    if (status === "available-firmware") {
      setAvailableFirmwareVersion(latestFirmware?.final.name || "");
      setFirmwareUpdateStatus(SoftwareCheckStatus.updateAvailable);
    }

    if (status === "no-available-firmware") {
      setFirmwareUpdateStatus(SoftwareCheckStatus.completed);
    }
  }, [firmwareUpdateStatus, onComplete, status, genuineCheckStatus, latestFirmware]);

  const handleCloseLockedDeviceDrawer = useCallback(() => {
    // TODO: see if this behaviour is still adapted
    if (genuineCheckStatus === SoftwareCheckStatus.active) {
      setGenuineCheckStatus(SoftwareCheckStatus.cancelled);
    } else if (firmwareUpdateStatus === SoftwareCheckStatus.active) {
      setFirmwareUpdateStatus(SoftwareCheckStatus.cancelled);
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

  const notGenuineIsOpen = genuineCheckStatus === SoftwareCheckStatus.notGenuine;

  /** Opening and closing of drawers */
  useEffect(() => {
    if (lockedDeviceModalIsOpen) {
      const props: SoftwareCheckLockedDeviceModalProps = {
        deviceModelId,
        productName,
      };
      setDrawer(SoftwareCheckLockedDeviceModal, props, {
        forceDisableFocusTrap: true,
        preventBackdropClick: true,
      });
      return () => setDrawer();
    } else if (allowSecureChannelIsOpen) {
      const props: SoftwareCheckAllowSecureChannelDrawerProps = {
        deviceModelId,
      };
      setDrawer(SoftwareCheckAllowSecureChannelDrawer, props, {
        forceDisableFocusTrap: true,
        preventBackdropClick: true,
        // FIXME: drawer is non closeable so we have to handle device disconnection
      });
      return () => setDrawer();
    } else if (notGenuineIsOpen) {
      // TODO: set drawer
    }
  }, [
    allowSecureChannelIsOpen,
    deviceModelId,
    handleCloseLockedDeviceDrawer,
    lockedDeviceModalIsOpen,
    notGenuineIsOpen,
    productName,
    resetGenuineCheckState,
  ]);

  return (
    <Flex flex={1} justifyContent="center" alignItems="center">
      <SoftwareCheckContent
        genuineCheckStatus={genuineCheckStatus}
        firmwareUpdateStatus={firmwareUpdateStatus}
        availableFirmwareVersion={availableFirmwareVersion}
        modelName={productName}
        onClickStartChecks={() => {
          setGenuineCheckStatus(SoftwareCheckStatus.active);
          resetGenuineCheckState();
        }}
        onClickWhyPerformSecurityChecks={() => openURL(whySecurityChecksUrl)}
        onClickResumeGenuineCheck={() => {
          setGenuineCheckStatus(SoftwareCheckStatus.active);
          resetGenuineCheckState();
        }}
        onClickViewUpdate={startFirmwareUpdate}
        onClickContinueToSetup={onComplete}
      />
    </Flex>
  );
};

export default EarlySecurityChecks;
