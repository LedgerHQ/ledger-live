import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BoxedIcon,
  Flex,
  InfiniteLoader,
  Text,
  VerticalTimeline,
} from "@ledgerhq/native-ui";
import {
  CircledCheckSolidMedium,
  WarningSolidMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/hw/hooks/useGetLatestAvailableFirmware";
import { getDeviceModel } from "@ledgerhq/devices";

import GenuineCheckDrawer from "./GenuineCheckDrawer";
import FirmwareUpdateDrawer from "./FirmwareUpdateDrawer";
import GenuineCheckFailedDrawer from "./GenuineCheckFailedDrawer";
import UnlockDeviceDrawer from "./UnlockDeviceDrawer";
import AllowManagerDrawer from "./AllowManagerDrawer";
import { TrackScreen, track } from "../../analytics";

const lockedDeviceTimeoutMs = 1000;

type CheckStatus = "inactive" | "active" | "completed" | "failed";

type CurrentSoftwareChecksStep = "none" | "genuine-check" | "firmware-update";

// Represents the UI of the step block for the genuine check
type GenuineCheckUiStepStatus = CheckStatus;
// Represents the status of the genuine check from which is derived the displayed UI and if the genuine check hook can be started or not
type GenuineCheckStatus =
  | "unchecked"
  | "requested"
  | "ongoing"
  | "completed"
  | "skipped"
  | "failed";
// Defines which drawer should be displayed during the genuine check
type GenuineCheckUiDrawerStatus =
  | "none"
  | "requested"
  | "allow-manager"
  | "unlock-needed"
  | "failed";

// Represents the UI of the step block for the firmware check
type FirmwareUpdateUiStepStatus = CheckStatus;
// Represents the status of the firmware check from which is derived the displayed UI and if the genuine check hook can be started or not
type FirmwareUpdateStatus = "unchecked" | "ongoing" | "completed" | "failed";
// Defines which drawer should be displayed during the firmware check
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
    lockedDevice: latestFirmwareGettingLockedDevice,
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
        ["completed", "skipped"].includes(genuineCheckStatus) &&
        currentSoftwareChecksStep === "genuine-check"
      ) {
        setCurrentSoftwareChecksStep("firmware-update");
        setFirmwareUpdateStatus("ongoing");
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
          setGenuineCheckStatus("failed");
        } else if (genuineState === "genuine") {
          setGenuineCheckStatus("completed");
        } else if (genuineState === "non-genuine") {
          setGenuineCheckStatus("failed");
        }

        // Updates the UI
        if (devicePermissionState === "unlock-needed") {
          nextDrawerToDisplay = "unlock-needed";
        } else if (devicePermissionState === "requested") {
          nextDrawerToDisplay = "allow-manager";
        } else if (devicePermissionState === "refused") {
          nextDrawerToDisplay = "failed";
        }
      } else if (genuineCheckStatus === "failed") {
        nextDrawerToDisplay = "failed";
      }
    }
    // currentSoftwareChecksStep can be any value for those UI updates
    if (genuineCheckStatus === "completed") {
      genuineCheckUiStepStatus = "completed";
    } else if (genuineCheckStatus === "skipped") {
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
        if (latestFirmwareGettingLockedDevice) {
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

  return (
    <Flex>
      <TrackScreen
        category={`Set up ${productName}: Step 4 Software & Hardware check`}
      />
      {isDisplayed && (
        <Flex>
          <GenuineCheckDrawer
            productName={productName}
            isOpen={nextDrawerToDisplay === "requested"}
            onPress={() => {
              setGenuineCheckStatus("ongoing");
              track("button_clicked", {
                button: "Start genuine check",
                drawer: "Start Stax hardware check",
              });
            }}
          />
          <UnlockDeviceDrawer
            isOpen={nextDrawerToDisplay === "unlock-needed"}
            onClose={() => {
              // Closing because the user pressed on close button, and the genuine check is ongoing
              if (genuineCheckStatus === "ongoing") {
                // Fails the genuine check entirely - not "skipped" so the GenuineCheckFailedDrawer is displayed
                setGenuineCheckStatus("failed");
              }
              // Closing because the user pressed on close button, and the firmware check is ongoing
              else if (firmwareUpdateStatus === "ongoing") {
                setFirmwareUpdateStatus("failed");
              }
            }}
            device={device}
          />
          <AllowManagerDrawer
            isOpen={nextDrawerToDisplay === "allow-manager"}
            device={device}
          />
          <GenuineCheckFailedDrawer
            productName={productName}
            isOpen={nextDrawerToDisplay === "failed"}
            error={genuineCheckError}
            onRetry={() => {
              track("button_clicked", {
                button: "run genuine check again",
                drawer: "Failed Stax hardware check",
              });
              resetGenuineCheckState();
              setGenuineCheckStatus("unchecked");
            }}
            onSkip={() => {
              track("button_clicked", {
                button: "check if hardware genuine later",
                drawer: "Failed Stax hardware check",
              });
              setGenuineCheckStatus("skipped");
            }}
          />
          <FirmwareUpdateDrawer
            productName={productName}
            isOpen={nextDrawerToDisplay === "new-firmware-available"}
            onSkip={() => {
              track("button_clicked", {
                button: "skip software update",
                drawer: `Set up ${productName}: Step 4: Software update available`,
              });
              setFirmwareUpdateStatus("completed");
            }}
            onUpdate={() => {
              track("button_clicked", {
                button: "download software update",
                drawer: `Set up ${productName}: Step 4: Software update available`,
              });
              setFirmwareUpdateStatus("completed");
            }}
          />
        </Flex>
      )}
      {genuineCheckUiStepStatus === "failed" ? (
        <TrackScreen
          category={`Set up ${productName}: Step 4 Hardware not checked`}
        />
      ) : null}
      {firmwareUpdateUiStepStatus === "active" ? (
        <TrackScreen
          category={`Set up ${productName}: Step 4 Checking software`}
        />
      ) : null}
      {genuineCheckUiStepStatus === "completed" &&
      firmwareUpdateUiStepStatus === "completed" ? (
        <TrackScreen
          category={`Set up ${productName}: Step 4: Software & Hardware checked successfully`}
        />
      ) : null}
      <VerticalTimeline.BodyText mb={6}>
        {t("syncOnboarding.softwareChecksSteps.description")}
      </VerticalTimeline.BodyText>
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
