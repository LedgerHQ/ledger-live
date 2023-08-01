import React, { useCallback, useEffect, useState } from "react";
import { Flex } from "@ledgerhq/react-ui";
import manager from "@ledgerhq/live-common/manager/index";
import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware";
import Body from "./Body";
import LockedDeviceDrawer, { Props as LockedDeviceDrawerProps } from "../LockedDeviceDrawer";
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
import ErrorDrawer, { Props as ErrorDrawerProps } from "./ErrorDrawer";
import DeviceNotGenuineDrawer, {
  Props as DeviceNotGenuineDrawerProps,
} from "./DeviceNotGenuineDrawer";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { log } from "@ledgerhq/logs";

export type Props = {
  onComplete: () => void;
  device: Device;
  /**
   * Security checks re-run after a firmware update.
   * The difference between the first and subsequent runs is that:
   * - on the first run, the checks are started manually by a user action
   * - on the subsequent runs, the checks start automatically
   * - on the subsequent runs, the genuine check step is displayed as "validated",
   * but we still do that check in the background (optimistic strategy)
   * */
  isInitialRunOfSecurityChecks: boolean;
  restartChecksAfterUpdate: () => void;
  isBootloader: boolean | null;
};

const commonDrawerProps = {
  forceDisableFocusTrap: true,
  preventBackdropClick: true,
};

/**
 * Component representing the early security checks step, which polls the current device state
 * to display correctly information about the onboarding to the user.
 * It has two steps:
 * - Genuine check
 * - Firmware update availibity check. If a firmware update is available, offers
 * the user to perform that update. Then the checks are restarted.
 */
const EarlySecurityChecks = ({
  onComplete,
  device,
  restartChecksAfterUpdate,
  isInitialRunOfSecurityChecks,
  isBootloader,
}: Props) => {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const whySecurityChecksUrl =
    locale in urls.genuineCheck
      ? urls.genuineCheck[locale as keyof typeof urls.genuineCheck]
      : urls.genuineCheck.en;

  const optimisticGenuineCheck = !isInitialRunOfSecurityChecks;
  const [genuineCheckStatus, setGenuineCheckStatus] = useState<SoftwareCheckStatus>(
    optimisticGenuineCheck ? SoftwareCheckStatus.optimisticCompleted : SoftwareCheckStatus.inactive,
  );
  const [firmwareUpdateStatus, setFirmwareUpdateStatus] = useState<SoftwareCheckStatus>(
    SoftwareCheckStatus.inactive,
  );
  const [availableFirmwareVersion, setAvailableFirmwareVersion] = useState<string>("");
  const [updateInterrupted, setUpdateInterrupted] = useState(false);

  const deviceId = device.deviceId ?? "";
  const deviceModelId = device.modelId;
  const productName = getDeviceModel(device.modelId).productName;

  const genuineCheckActive =
    genuineCheckStatus === SoftwareCheckStatus.active ||
    genuineCheckStatus === SoftwareCheckStatus.optimisticCompleted;

  const {
    genuineState,
    error: genuineCheckError,
    devicePermissionState,
    resetGenuineCheckState,
  } = useGenuineCheck({
    isHookEnabled: genuineCheckActive,
    deviceId,
  });

  const {
    state: {
      deviceInfo,
      firmwareUpdateContext: latestFirmware,
      status,
      lockedDevice,
      error: getLatestAvailableFirmwareError,
    },
  } = useGetLatestAvailableFirmware({
    isHookEnabled: firmwareUpdateStatus === SoftwareCheckStatus.active,
    deviceId,
  });

  const [completionLoading, setCompletionLoading] = useState(false);
  const handleCompletion = () => {
    setCompletionLoading(true);
    onComplete();
  };

  const closeFwUpdateDrawer = useCallback(() => {
    setDrawer();
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
      onDrawerClose: () => {
        closeFwUpdateDrawer();
        setUpdateInterrupted(true);
      },
      status: modal,
      stepId,
      firmware: latestFirmware,
      deviceInfo,
      device,
      deviceModelId: deviceModelId,
      setFirmwareUpdateOpened: () => null, // we don't need to keep the state
      setFirmwareUpdateCompleted: () => null,

      finalStepSuccessDescription: t(
        "syncOnboarding.manual.softwareCheckContent.firmwareUpdate.finalStepSuccessDescription",
      ),
      finalStepSuccessButtonLabel: t(
        "syncOnboarding.manual.softwareCheckContent.firmwareUpdate.finalStepSuccessButtonLabel",
      ),
      finalStepSuccessButtonOnClick: () => {
        closeFwUpdateDrawer();
        restartChecksAfterUpdate();
      },
      deviceHasPin: false, // early security checks are triggered only if the device is in one of the steps prior to setting a PIN code
    };

    setDrawer(UpdateFirmwareModal, updateFirmwareModalProps, {
      preventBackdropClick: true,
      forceDisableFocusTrap: true,
      onRequestClose: () => {
        closeFwUpdateDrawer();
        setUpdateInterrupted(true);
      },
    });
  }, [
    closeFwUpdateDrawer,
    device,
    deviceInfo,
    deviceModelId,
    latestFirmware,
    restartChecksAfterUpdate,
    t,
  ]);

  useEffect(() => {
    if (updateInterrupted && isBootloader) {
      restartChecksAfterUpdate();
    }
  }, [isBootloader, restartChecksAfterUpdate, updateInterrupted]);

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
    /**
     * for infinite loop firmware, we arbitrarily decide that the il2 -> il0
     * path does not exist. It allows testing this flow without being stuck
     * in an infinite loop (UX wise)
     * */
    const isIL2firmware = deviceInfo?.version.endsWith("-il2");
    const isIL0firmwareAvailable = latestFirmware?.final?.name?.endsWith("-il0");
    const shouldPretendNoAvailableFirmware = isIL2firmware && isIL0firmwareAvailable;

    if (firmwareUpdateStatus !== SoftwareCheckStatus.active) return;

    if (
      (shouldPretendNoAvailableFirmware && status === "available-firmware") ||
      status === "no-available-firmware"
    ) {
      setFirmwareUpdateStatus(SoftwareCheckStatus.completed);
      setAvailableFirmwareVersion("");
    } else if (status === "available-firmware") {
      setAvailableFirmwareVersion(latestFirmware?.final.name || "");
      setFirmwareUpdateStatus(SoftwareCheckStatus.updateAvailable);
    }
  }, [
    firmwareUpdateStatus,
    status,
    genuineCheckStatus,
    latestFirmware,
    deviceInfo?.version,
    getLatestAvailableFirmwareError,
  ]);

  const lockedDeviceModalIsOpen =
    (devicePermissionState === "unlock-needed" && genuineCheckActive) ||
    (lockedDevice && firmwareUpdateStatus === SoftwareCheckStatus.active);

  const allowSecureChannelIsOpen =
    devicePermissionState === "requested" &&
    (genuineCheckActive || firmwareUpdateStatus === SoftwareCheckStatus.active);

  const notGenuineIsOpen = genuineCheckStatus === SoftwareCheckStatus.notGenuine;

  /** Opening and closing of drawers */
  useEffect(() => {
    if (lockedDeviceModalIsOpen) {
      const props: LockedDeviceDrawerProps = {
        deviceModelId,
      };
      setDrawer(LockedDeviceDrawer, props, commonDrawerProps);
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
      const props: ErrorDrawerProps = {
        onClickRetry: () => {
          resetGenuineCheckState();
          setGenuineCheckStatus(SoftwareCheckStatus.active);
        },
        error: genuineCheckError,
      };
      setDrawer(ErrorDrawer, props, commonDrawerProps);
    } else if (
      getLatestAvailableFirmwareError &&
      !(
        getLatestAvailableFirmwareError.type === "SharedError" &&
        // If the current error triggered a retry attempt, does not display failure
        getLatestAvailableFirmwareError.retrying
      )
    ) {
      log(
        "EarlySecurityCheck",
        "Failed to retrieve latest firmware version with error:",
        getLatestAvailableFirmwareError.name,
      );
      setFirmwareUpdateStatus(SoftwareCheckStatus.failed);
      const props: ErrorDrawerProps = {
        onClickRetry: () => {
          setFirmwareUpdateStatus(SoftwareCheckStatus.active);
        },
        error: { message: "Unknown error", ...getLatestAvailableFirmwareError },
        closeable: true,
      };
      setDrawer(ErrorDrawer, props, { forceDisableFocusTrap: true });
    }
    return () => setDrawer();
  }, [
    allowSecureChannelIsOpen,
    deviceModelId,
    genuineCheckError,
    getLatestAvailableFirmwareError,
    lockedDeviceModalIsOpen,
    notGenuineIsOpen,
    productName,
    resetGenuineCheckState,
  ]);

  return (
    <Flex flex={1} flexDirection="column" justifyContent="center" alignItems="center">
      {isInitialRunOfSecurityChecks && (
        <TrackPage category="Genuine check and OS update check start" />
      )}
      {isInitialRunOfSecurityChecks && genuineCheckStatus === SoftwareCheckStatus.cancelled && (
        <TrackPage category="Error: user declined genuine check on their device" />
      )}
      {isInitialRunOfSecurityChecks && genuineCheckStatus === SoftwareCheckStatus.completed && (
        <TrackPage category="The genuine check is successful" />
      )}
      {genuineCheckStatus === SoftwareCheckStatus.completed &&
        firmwareUpdateStatus === SoftwareCheckStatus.completed && (
          <TrackPage category="The Stax is genuine and up to date" />
        )}
      {firmwareUpdateStatus === SoftwareCheckStatus.updateAvailable && (
        <TrackPage category="Download OS update" />
      )}
      <Body
        genuineCheckStatus={
          genuineCheckStatus === SoftwareCheckStatus.optimisticCompleted
            ? SoftwareCheckStatus.completed
            : genuineCheckStatus
        }
        firmwareUpdateStatus={
          genuineCheckStatus === SoftwareCheckStatus.optimisticCompleted
            ? SoftwareCheckStatus.active
            : firmwareUpdateStatus
        }
        availableFirmwareVersion={availableFirmwareVersion}
        modelName={productName}
        updateSkippable={updateInterrupted}
        onClickStartChecks={() => {
          track("button_clicked", { button: "Start checks" });
          setGenuineCheckStatus(SoftwareCheckStatus.active);
          resetGenuineCheckState();
        }}
        onClickWhyPerformSecurityChecks={() => {
          track("button_clicked", { button: "Why perform these security checks" });
          openURL(whySecurityChecksUrl);
        }}
        onClickResumeGenuineCheck={() => {
          track("button_clicked", { button: "Resume genuine check" });
          setGenuineCheckStatus(SoftwareCheckStatus.active);
          resetGenuineCheckState();
        }}
        onClickViewUpdate={() => {
          track("button_clicked", { button: "View update" });
          startFirmwareUpdate();
        }}
        onClickSkipUpdate={() => {
          track("button_clicked", { button: "Skip update" });
          handleCompletion();
        }}
        onClickContinueToSetup={() => {
          track("button_clicked", { button: "Continue to setup" });
          handleCompletion();
        }}
        onClickRetryUpdate={() => {
          setFirmwareUpdateStatus(SoftwareCheckStatus.active);
        }}
        loading={completionLoading}
      />
    </Flex>
  );
};

export default EarlySecurityChecks;
