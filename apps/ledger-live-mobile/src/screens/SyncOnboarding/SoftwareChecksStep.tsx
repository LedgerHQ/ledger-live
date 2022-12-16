import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BoxedIcon, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import {
  CircledCheckSolidMedium,
  WarningSolidMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/hw/hooks/useGetLatestAvailableFirmware";
import { getDeviceModel } from "@ledgerhq/devices";

import GenuineCheckDrawer from "./GenuineCheckDrawer";
import FirmwareUpdateDrawer from "./FirmwareUpdateDrawer";
import GenuineCheckCancelledDrawer from "./GenuineCheckCancelledDrawer";
import UnlockDeviceDrawer from "./UnlockDeviceDrawer";
import AllowManagerDrawer from "./AllowManagerDrawer";

const softwareStepDelay = 2500;
const lockedDeviceTimeoutMs = 1000;

type CheckStatus = "inactive" | "active" | "completed" | "failed";

type CurrentSoftwareChecksStep = "none" | "genuine-check" | "firmware-update";

type GenuineCheckUiStepStatus = CheckStatus;
type GenuineCheckStatus =
  | "unchecked"
  | "requested"
  | "ongoing"
  | "completed"
  | "failed";
type GenuineCheckUiDrawerStatus =
  | "none"
  | "requested"
  | "allow-manager"
  | "unlock-needed"
  | "cancelled";

type FirmwareUpdateUiStepStatus = CheckStatus;
type FirmwareUpdateStatus = "unchecked" | "ongoing" | "completed" | "failed";
type FirmwareUpdateUiDrawerStatus =
  | "none"
  | "unlock-needed"
  | "new-firmware-available";

type CheckCardProps = FlexBoxProps & {
  title: string;
  index: number;
  status: CheckStatus;
};

const CheckCard = ({ title, index, status, ...props }: CheckCardProps) => {
  let checkIcon;
  switch (status) {
    case "active":
      checkIcon = <InfiniteLoader color="primary.c80" size={24} />;
      break;
    case "completed":
      checkIcon = <CircledCheckSolidMedium color="success.c100" size={24} />;
      break;
    case "failed":
      checkIcon = <WarningSolidMedium color="warning.c80" size={24} />;
      break;
    case "inactive":
    default:
      checkIcon = <Text variant="body">{index}</Text>;
  }

  return (
    <Flex flexDirection="row" alignItems="center" {...props}>
      <BoxedIcon
        backgroundColor="neutral.c30"
        borderColor="neutral.c30"
        variant="circle"
        Icon={checkIcon}
      />
      <Text ml={4} variant="body" flex={1}>
        {title}
      </Text>
    </Flex>
  );
};

export type Props = {
  device: Device;
  isDisplayed?: boolean;
  onComplete?: () => void;
};

const SoftwareChecksStep = ({ device, isDisplayed, onComplete }: Props) => {
  const { t } = useTranslation();

  const productName =
    getDeviceModel(device.modelId).productName || device.modelId;

  const [currentDisplayedDrawer, setCurrentDisplayedDrawer] = useState<
    GenuineCheckUiDrawerStatus | FirmwareUpdateUiDrawerStatus
  >("none");

  // Will be computed depending on the states. Updating nextDrawerToDisplay
  // triggers the current displayed drawer to close
  let nextDrawerToDisplay:
    | GenuineCheckUiDrawerStatus
    | FirmwareUpdateUiDrawerStatus = "none";

  const [currentSoftwareChecksStep, setCurrentSoftwareChecksStep] =
    useState<CurrentSoftwareChecksStep>("none");

  const [genuineCheckStatus, setGenuineCheckStatus] =
    useState<GenuineCheckStatus>("unchecked");

  const [firmwareUpdateStatus, setFirmwareUpdateStatus] =
    useState<FirmwareUpdateStatus>("unchecked");

  // Not a DeviceAction as we're only interested in the permission requested, granted and result.
  // No need the full DeviceAction with its retry strategy etc.
  const {
    genuineState,
    devicePermissionState,
    error: genuineCheckError,
    resetGenuineCheckState,
  } = useGenuineCheck({
    isHookEnabled: genuineCheckStatus === "ongoing",
    deviceId: device.deviceId,
    lockedDeviceTimeoutMs,
  });

  const {
    latestFirmware,
    error: latestFirmwareGettingError,
    status: latestFirmwareGettingStatus,
    deviceIsLocked: latestFirmwareGettingDeviceIsLocked,
  } = useGetLatestAvailableFirmware({
    isHookEnabled: firmwareUpdateStatus === "ongoing",
    deviceId: device.deviceId,
  });

  // Software check steps entry points
  useEffect(() => {
    if (isDisplayed) {
      // First time doing the genuine check
      if (currentSoftwareChecksStep === "none") {
        setCurrentSoftwareChecksStep("genuine-check");
        setGenuineCheckStatus("requested");
      }
      // Genuine check retry entry point
      else if (
        currentSoftwareChecksStep === "genuine-check" &&
        genuineCheckStatus === "unchecked"
      ) {
        setGenuineCheckStatus("ongoing");
      }
      // First time doing the firmware check
      else if (
        ["completed", "failed"].includes(genuineCheckStatus) &&
        currentSoftwareChecksStep === "genuine-check"
      ) {
        setCurrentSoftwareChecksStep("firmware-update");

        setTimeout(() => {
          setFirmwareUpdateStatus("ongoing");
        }, softwareStepDelay);
      }
    }
  }, [isDisplayed, currentSoftwareChecksStep, genuineCheckStatus]);

  // Handles the completion of the entire software check step
  useEffect(() => {
    if (
      isDisplayed &&
      onComplete &&
      ["completed", "failed"].includes(firmwareUpdateStatus)
    ) {
      // FIXME: timeout for now to display the status of the available fw update
      setTimeout(() => onComplete(), 2000);
    }
  }, [firmwareUpdateStatus, isDisplayed, onComplete]);

  let genuineCheckUiStepStatus: GenuineCheckUiStepStatus = "inactive";
  let firmwareUpdateUiStepStatus: FirmwareUpdateUiStepStatus = "inactive";

  if (isDisplayed) {
    // Handle genuine check UI logic
    if (currentSoftwareChecksStep === "genuine-check") {
      if (genuineCheckStatus === "requested") {
        genuineCheckUiStepStatus = "active";
        nextDrawerToDisplay = "requested";
      } else if (genuineCheckStatus === "ongoing") {
        genuineCheckUiStepStatus = "active";
        nextDrawerToDisplay = "none";

        // Updates the genuineCheckStatus
        if (genuineCheckError) {
          console.error(
            "Failed to perform genuine check with error:",
            genuineCheckError.message,
          );
          setGenuineCheckStatus("failed");
        } else if (genuineState === "genuine") {
          setGenuineCheckStatus("completed");
        } else if (genuineState === "non-genuine") {
          // FIXME: if the device is non-genuine, we should display something else
          setGenuineCheckStatus("failed");
        }

        // Updates the UI
        if (devicePermissionState === "unlock-needed") {
          nextDrawerToDisplay = "unlock-needed";
        } else if (devicePermissionState === "requested") {
          nextDrawerToDisplay = "allow-manager";
        } else if (devicePermissionState === "refused") {
          nextDrawerToDisplay = "cancelled";
        }
      }
    }
    // currentSoftwareChecksStep can be any value for those UI updates
    if (genuineCheckStatus === "completed") {
      genuineCheckUiStepStatus = "completed";
    } else if (genuineCheckStatus === "failed") {
      genuineCheckUiStepStatus = "failed";
    }

    // Handle firmware update UI logic
    if (currentSoftwareChecksStep === "firmware-update") {
      if (firmwareUpdateStatus === "ongoing") {
        firmwareUpdateUiStepStatus = "active";
        nextDrawerToDisplay = "none";

        // Updates the firmwareUpdateStatus
        if (latestFirmwareGettingError) {
          console.error(
            "Failed to retrieve latest firmware version with error:",
            latestFirmwareGettingError.message,
          );
          setFirmwareUpdateStatus("failed");
        } else if (latestFirmwareGettingStatus === "no-available-firmware") {
          setFirmwareUpdateStatus("completed");
        }

        // Updates the UI
        if (latestFirmwareGettingDeviceIsLocked) {
          nextDrawerToDisplay = "unlock-needed";
        } else if (
          latestFirmwareGettingStatus === "available-firmware" &&
          latestFirmware
        ) {
          nextDrawerToDisplay = "new-firmware-available";
        } else {
          nextDrawerToDisplay = "none";
        }
      }
      // currentSoftwareChecksStep can be any value for those UI updates
      if (firmwareUpdateStatus === "completed") {
        firmwareUpdateUiStepStatus = "completed";
      } else if (firmwareUpdateStatus === "failed") {
        firmwareUpdateUiStepStatus = "failed";
      }
    }
  }

  // Handles the genuine check UI step title
  let genuineCheckStepTitle;
  switch (genuineCheckUiStepStatus) {
    case "active":
      genuineCheckStepTitle = t(
        "syncOnboarding.softwareChecksSteps.genuineCheckStep.active.title",
      );
      break;
    case "completed":
      genuineCheckStepTitle = t(
        "syncOnboarding.softwareChecksSteps.genuineCheckStep.completed.title",
        {
          productName,
        },
      );
      break;
    case "failed":
      genuineCheckStepTitle = t(
        "syncOnboarding.softwareChecksSteps.genuineCheckStep.failed.title",
      );
      break;
    default:
      genuineCheckStepTitle = t(
        "syncOnboarding.softwareChecksSteps.genuineCheckStep.inactive.title",
      );
      break;
  }

  // Handles the firmware update UI step title
  let firmwareUpdateStepTitle;
  switch (firmwareUpdateUiStepStatus) {
    case "active":
      firmwareUpdateStepTitle = t(
        "syncOnboarding.softwareChecksSteps.firmwareUpdateStep.active.title",
      );
      break;
    case "completed":
      if (
        latestFirmwareGettingStatus === "available-firmware" &&
        latestFirmware
      ) {
        firmwareUpdateStepTitle = t(
          "syncOnboarding.softwareChecksSteps.firmwareUpdateStep.completed.updateAvailable.title",
          {
            firmwareVersion: JSON.stringify(latestFirmware.final.name),
          },
        );
      } else {
        firmwareUpdateStepTitle = t(
          "syncOnboarding.softwareChecksSteps.firmwareUpdateStep.completed.noUpdateAvailable.title",
          { productName },
        );
      }
      break;
    case "failed":
      firmwareUpdateStepTitle = t(
        "syncOnboarding.softwareChecksSteps.firmwareUpdateStep.failed.title",
      );
      break;
    default:
      firmwareUpdateStepTitle = t(
        "syncOnboarding.softwareChecksSteps.firmwareUpdateStep.active.title",
      );
      break;
  }

  // If there is already a displayed drawer, the currentDisplayedDrawer would be
  // synchronized with nextDrawerToDisplay during the displayed drawer onClose event.
  // Otherwise, currentDisplayDrawer needs to be set to nextDrawerToDisplay manually:
  if (currentDisplayedDrawer === "none" && nextDrawerToDisplay !== "none") {
    setCurrentDisplayedDrawer(nextDrawerToDisplay);
  }

  return (
    <Flex>
      {isDisplayed && (
        <Flex>
          <GenuineCheckDrawer
            productName={productName}
            isOpen={
              currentDisplayedDrawer === "requested" &&
              nextDrawerToDisplay === "requested"
            }
            onPress={() => setGenuineCheckStatus("ongoing")}
            onClose={() => setCurrentDisplayedDrawer(nextDrawerToDisplay)}
          />
          <UnlockDeviceDrawer
            isOpen={
              currentDisplayedDrawer === "unlock-needed" &&
              nextDrawerToDisplay === "unlock-needed"
            }
            onClose={() => setCurrentDisplayedDrawer(nextDrawerToDisplay)}
            device={device}
          />
          <AllowManagerDrawer
            isOpen={
              currentDisplayedDrawer === "allow-manager" &&
              nextDrawerToDisplay === "allow-manager"
            }
            onClose={() => setCurrentDisplayedDrawer(nextDrawerToDisplay)}
            device={device}
          />
          <GenuineCheckCancelledDrawer
            productName={productName}
            isOpen={
              currentDisplayedDrawer === "cancelled" &&
              nextDrawerToDisplay === "cancelled"
            }
            onRetry={() => {
              resetGenuineCheckState();
              setGenuineCheckStatus("unchecked");
            }}
            onSkip={() => setGenuineCheckStatus("failed")}
            onClose={() => setCurrentDisplayedDrawer(nextDrawerToDisplay)}
          />
          <FirmwareUpdateDrawer
            productName={productName}
            isOpen={
              currentDisplayedDrawer === "new-firmware-available" &&
              nextDrawerToDisplay === "new-firmware-available"
            }
            onSkip={() => setFirmwareUpdateStatus("completed")}
            onUpdate={() => setFirmwareUpdateStatus("completed")}
            onClose={() => setCurrentDisplayedDrawer(nextDrawerToDisplay)}
          />
        </Flex>
      )}
      <CheckCard
        title={genuineCheckStepTitle}
        status={genuineCheckUiStepStatus}
        index={1}
        mb={4}
      />
      <CheckCard
        title={firmwareUpdateStepTitle}
        status={firmwareUpdateUiStepStatus}
        index={2}
      />
    </Flex>
  );
};

export default SoftwareChecksStep;
