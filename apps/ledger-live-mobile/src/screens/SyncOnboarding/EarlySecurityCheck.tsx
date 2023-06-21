import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BoxedIcon, Button, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import UnlockDeviceDrawer from "./UnlockDeviceDrawer";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex";
import { CircledCheckSolidMedium, WarningSolidMedium } from "@ledgerhq/native-ui/assets/icons";
import { getDeviceModel } from "@ledgerhq/devices";
import AllowManagerDrawer from "./AllowManagerDrawer";
import GenuineCheckFailedDrawer from "./GenuineCheckFailedDrawer";
import { track } from "../../analytics";
import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";

const LOCKED_DEVICE_TIMEOUT_MS = 1000;

// Represents the UI status of each check step
type UiCheckStatus = "inactive" | "active" | "completed" | "failed";

// Represents the status of the genuine check from which is derived the displayed UI and if the genuine check hook can be started or not
type GenuineCheckStatus = "unchecked" | "ongoing" | "completed" | "failed" | "skipped";
// Defines which drawer should be displayed during the genuine check
type GenuineCheckUiDrawerStatus =
  | "none"
  | "allow-manager"
  | "unlock-needed"
  | "genuine-check-failed";

// Represents the status of the firmware check from which is derived the displayed UI and if the genuine check hook can be started or not
type FirmwareUpdateStatus = "unchecked" | "ongoing" | "completed" | "failed";
// Defines which drawer should be displayed during the firmware check
type FirmwareUpdateUiDrawerStatus = "none" | "unlock-needed" | "new-firmware-available";

export type EarlySecurityCheckProps = {
  /**
   * A `Device` object
   */
  device: Device;
  /**
   * Function called once the ESC step is finished
   */
  notifyOnboardingEarlyCheckEnded: () => void;
};

/**
 * Component representing the early security checks step, which polls the current device state
 * to display correctly information about the onboarding to the user
 */
export const EarlySecurityCheck: React.FC<EarlySecurityCheckProps> = ({
  device,
  // notifyOnboardingEarlyCheckEnded,
}) => {
  const { t } = useTranslation();
  const productName = getDeviceModel(device.modelId).productName || device.modelId;

  const [currentStep, setCurrentStep] = useState<
    "idle" | "genuine-check" | "firmware-update-check" | "firmware-updating"
  >("idle");

  const [genuineCheckStatus, setGenuineCheckStatus] = useState<GenuineCheckStatus>("unchecked");

  const [firmwareUpdateStatus, setFirmwareUpdateStatus] =
    useState<FirmwareUpdateStatus>("unchecked");

  // Not a real "device action" but we get: permission requested, granted and result.
  const {
    genuineState,
    devicePermissionState,
    error: genuineCheckError,
    resetGenuineCheckState,
  } = useGenuineCheck({
    isHookEnabled: genuineCheckStatus === "ongoing",
    deviceId: device.deviceId,
    lockedDeviceTimeoutMs: LOCKED_DEVICE_TIMEOUT_MS,
  });

  console.log(`🦖 
    Genuine check input: ${JSON.stringify({
      isHookEnabled: genuineCheckStatus === "ongoing",
      deviceId: device.deviceId,
      lockedDeviceTimeoutMs: LOCKED_DEVICE_TIMEOUT_MS,
    })}
    \n\n
    Genuine check output: ${JSON.stringify({
      genuineState,
      devicePermissionState,
      error: genuineCheckError,
    })}  
  `);

  // For now short circuiting the ESC step
  // useEffect(() => {
  //   notifyOnboardingEarlyCheckEnded();
  // }, [notifyOnboardingEarlyCheckEnded]);

  const onStartChecks = useCallback(() => {
    setCurrentStep("genuine-check");
  }, []);

  // Check steps entry points
  useEffect(() => {
    // Genuine check start and retry entry point
    if (currentStep === "genuine-check" && genuineCheckStatus === "unchecked") {
      setGenuineCheckStatus("ongoing");
    }
    // // First time doing the firmware check
    // else if (
    //   ["completed", "skipped"].includes(genuineCheckStatus) &&
    //   currentSoftwareChecksStep === "genuine-check"
    // ) {
    //   setCurrentSoftwareChecksStep("firmware-update");
    //   setFirmwareUpdateStatus("ongoing");
    // }
  }, [currentStep, genuineCheckStatus]);

  let currentDisplayedDrawer: GenuineCheckUiDrawerStatus | FirmwareUpdateUiDrawerStatus = "none";
  let genuineCheckUiStepStatus: UiCheckStatus = "inactive";
  // let firmwareUpdateUiStepStatus: FirmwareUpdateUiStepStatus = "inactive";

  console.log(
    `🍕 UI logic: ${JSON.stringify({
      currentStep,
      genuineCheckStatus,
      genuineCheckError,
      genuineState,
      devicePermissionState,
    })}`,
  );

  // Handle genuine check UI logic
  if (currentStep === "genuine-check") {
    if (genuineCheckStatus === "ongoing") {
      genuineCheckUiStepStatus = "active";
      currentDisplayedDrawer = "none";

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
        // As the PIN has not been set before the ESC, the "unlock-needed" happens if the device is powered off.
        // But an error `CantOpenDevice` should be triggered quickly after.
        currentDisplayedDrawer = "unlock-needed";
      } else if (devicePermissionState === "requested") {
        currentDisplayedDrawer = "allow-manager";
      } else if (devicePermissionState === "refused") {
        currentDisplayedDrawer = "genuine-check-failed";
      }
    } else if (genuineCheckStatus === "failed") {
      // Currently genuine check failed or refused is handled in the same way. This can be changed in the future.
      currentDisplayedDrawer = "genuine-check-failed";
    }
  }
  // `currentStep` can be any value for those UI updates
  if (genuineCheckStatus === "completed") {
    genuineCheckUiStepStatus = "completed";
  } else if (genuineCheckStatus === "skipped") {
    // "skipped" represents the user skipping the genuine check because they refused or it failed
    genuineCheckUiStepStatus = "failed";
  }

  // // Handle firmware update UI logic
  // if (currentSoftwareChecksStep === "firmware-update") {
  //   if (firmwareUpdateStatus === "ongoing") {
  //     firmwareUpdateUiStepStatus = "active";
  //     nextDrawerToDisplay = "none";

  //     // Updates the firmwareUpdateStatus
  //     if (latestFirmwareGettingError) {
  //       console.error(
  //         "Failed to retrieve latest firmware version with error:",
  //         latestFirmwareGettingError.message,
  //       );
  //       setFirmwareUpdateStatus("failed");
  //     } else if (latestFirmwareGettingStatus === "no-available-firmware") {
  //       setFirmwareUpdateStatus("completed");
  //     }

  //     // Updates the UI
  //     if (latestFirmwareGettingLockedDevice) {
  //       nextDrawerToDisplay = "unlock-needed";
  //     } else if (latestFirmwareGettingStatus === "available-firmware" && latestFirmware) {
  //       nextDrawerToDisplay = "new-firmware-available";
  //     } else {
  //       nextDrawerToDisplay = "none";
  //     }
  //   }
  //   // currentSoftwareChecksStep can be any value for those UI updates
  //   if (firmwareUpdateStatus === "completed") {
  //     firmwareUpdateUiStepStatus = "completed";
  //   } else if (firmwareUpdateStatus === "failed") {
  //     firmwareUpdateUiStepStatus = "failed";
  //   }
  // }

  // Handles the genuine check UI step title
  let genuineCheckStepTitle;
  switch (genuineCheckUiStepStatus) {
    case "active":
      genuineCheckStepTitle = t("syncOnboarding.softwareChecksSteps.genuineCheckStep.active.title");
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
      genuineCheckStepTitle = t("syncOnboarding.softwareChecksSteps.genuineCheckStep.failed.title");
      break;
    default:
      genuineCheckStepTitle = t(
        "syncOnboarding.softwareChecksSteps.genuineCheckStep.inactive.title",
      );
      break;
  }

  let stepContent = (
    <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
      <Text>{t("earlySecurityCheck.genuineCheck.description")}</Text>
      <CheckCard title={genuineCheckStepTitle} status={genuineCheckUiStepStatus} index={1} mb={4} />
      {/* <CheckCard title={firmwareUpdateStepTitle} status={firmwareUpdateUiStepStatus} index={2} /> */}
    </Flex>
  );

  if (currentStep === "idle") {
    stepContent = (
      <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
        <Text>{t("earlySecurityCheck.idle.description")}</Text>
      </Flex>
    );
  }

  let cta = <></>;

  if (currentStep === "idle") {
    cta = (
      <Button type="main" mb={6} onPress={onStartChecks}>
        {t("earlySecurityCheck.idle.checkCta")}
      </Button>
    );
  }

  return (
    <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
      <UnlockDeviceDrawer
        isOpen={currentDisplayedDrawer === "unlock-needed"}
        onClose={() => {
          // Closing because the user pressed on close button, and the genuine check is ongoing
          if (genuineCheckStatus === "ongoing" && currentDisplayedDrawer === "unlock-needed") {
            // Fails the genuine check entirely - not "skipped" so the GenuineCheckFailedDrawer is displayed
            setGenuineCheckStatus("failed");
          }
          // Closing because the user pressed on close button, and the firmware check is ongoing
          else if (
            firmwareUpdateStatus === "ongoing" &&
            currentDisplayedDrawer === "unlock-needed"
          ) {
            setFirmwareUpdateStatus("failed");
          }
        }}
        device={device}
      />
      <AllowManagerDrawer isOpen={currentDisplayedDrawer === "allow-manager"} device={device} />
      <GenuineCheckFailedDrawer
        productName={productName}
        isOpen={currentDisplayedDrawer === "genuine-check-failed"}
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
      <Text>{t("earlySecurityCheck.title")}</Text>
      <Text>{stepContent}</Text>
      {cta}
    </Flex>
  );
};

type CheckCardProps = FlexBoxProps & {
  title: string;
  index: number;
  status: UiCheckStatus;
};

/**
 * TODO:
 * - another status `info` ? Not sure how we are going to handle a user refusing to install a fw update
 *   after going to the fw update screen <- maybe it won't be implemented
 * - title and optional description message ?
 */
const CheckCard = ({ title, index, status, ...props }: CheckCardProps) => {
  let checkIcon;
  switch (status) {
    case "active":
      checkIcon = <InfiniteLoader color="primary.c80" size={24} />;
      break;
    case "completed":
      checkIcon = <CircledCheckSolidMedium color="success.c50" size={24} />;
      break;
    case "failed":
      checkIcon = <WarningSolidMedium color="warning.c40" size={24} />;
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
