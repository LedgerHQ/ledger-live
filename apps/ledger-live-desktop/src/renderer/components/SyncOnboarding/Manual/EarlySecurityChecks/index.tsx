import React, { useCallback, useEffect, useState } from "react";
import { Flex } from "@ledgerhq/react-ui";
import manager from "@ledgerhq/live-common/manager/index";
import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/hw/hooks/useGetLatestAvailableFirmware";
import { getGenuineCheckFromDeviceId } from "@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId";
import { getLatestAvailableFirmwareFromDeviceId } from "@ledgerhq/live-common/hw/getLatestAvailableFirmwareFromDeviceId";
import Body from "./Body";
import SoftwareCheckLockedDeviceDrawer, {
  Props as SoftwareCheckLockedDeviceModalProps,
} from "./SoftwareCheckLockedDeviceDrawer";
import SoftwareCheckAllowSecureChannelDrawer, {
  Props as SoftwareCheckAllowSecureChannelDrawerProps,
} from "./SoftwareCheckAllowSecureChannelDrawer";
import { Status as SoftwareCheckStatus } from "../types";
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
import GenuineCheckErrorDrawer, {
  Props as GenuineCheckErrorDrawerProps,
} from "./GenuineCheckErrorDrawer";
import DeviceNotGenuineDrawer, {
  Props as DeviceNotGenuineDrawerProps,
} from "./DeviceNotGenuineDrawer";

export type Props = {
  onComplete: () => void;
  device: Device;
};

const commonDrawerProps = {
  forceDisableFocusTrap: true,
  preventBackdropClick: true,
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

  const {
    genuineState,
    error: genuineCheckError,
    devicePermissionState,
    resetGenuineCheckState,
  } = useGenuineCheck({
    getGenuineCheckFromDeviceId,
    isHookEnabled: genuineCheckStatus === SoftwareCheckStatus.active,
    deviceId,
  });

  const { deviceInfo, latestFirmware, status, lockedDevice } = useGetLatestAvailableFirmware({
    getLatestAvailableFirmwareFromDeviceId,
    isHookEnabled: firmwareUpdateStatus === SoftwareCheckStatus.active,
    deviceId,
  });

  const closeFwUpdateDrawer = useCallback(() => {
    setDrawer();
    // TODO: set status to cancelled ? and update icon for cancelled
  }, []);

  const startFirmwareUpdate = useCallback(() => {
    if (!deviceInfo || !latestFirmware) return;
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
  }, [
    closeFwUpdateDrawer,
    device,
    deviceInfo,
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

    if (genuineCheckStatus === SoftwareCheckStatus.completed) {
      setFirmwareUpdateStatus(SoftwareCheckStatus.active);
    }
  }, [genuineCheckStatus, genuineState, devicePermissionState, genuineCheckError]);

  useEffect(() => {
    if (status === "available-firmware") {
      setAvailableFirmwareVersion(latestFirmware?.final.name || "");
      setFirmwareUpdateStatus(SoftwareCheckStatus.updateAvailable);
    }

    if (status === "no-available-firmware") {
      setFirmwareUpdateStatus(SoftwareCheckStatus.completed);
    }
  }, [firmwareUpdateStatus, onComplete, status, genuineCheckStatus, latestFirmware]);

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
      setDrawer(SoftwareCheckLockedDeviceDrawer, props, commonDrawerProps);
    } else if (allowSecureChannelIsOpen) {
      const props: SoftwareCheckAllowSecureChannelDrawerProps = {
        deviceModelId,
      };
      // FIXME: drawer is non closeable so we have to handle device disconnection
      setDrawer(SoftwareCheckAllowSecureChannelDrawer, props, commonDrawerProps);
    } else if (notGenuineIsOpen) {
      const props: DeviceNotGenuineDrawerProps = {
        productName,
      };
      setDrawer(DeviceNotGenuineDrawer, props, commonDrawerProps);
    } else if (genuineCheckError) {
      setGenuineCheckStatus(SoftwareCheckStatus.failed);
      const props: GenuineCheckErrorDrawerProps = {
        onClickRetry: () => {
          resetGenuineCheckState();
          setGenuineCheckStatus(SoftwareCheckStatus.active);
        },
        error: genuineCheckError,
      };
      setDrawer(GenuineCheckErrorDrawer, props, commonDrawerProps);
    }
    return () => setDrawer();
  }, [
    allowSecureChannelIsOpen,
    deviceModelId,
    genuineCheckError,
    lockedDeviceModalIsOpen,
    notGenuineIsOpen,
    productName,
    resetGenuineCheckState,
  ]);

  return (
    <Flex flex={1} justifyContent="center" alignItems="center">
      <Body
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
