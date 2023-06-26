import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BoxedIcon, Button, Flex, InfiniteLoader, Text, Link } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import UnlockDeviceDrawer from "./UnlockDeviceDrawer";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex";
import {
  CircledCheckSolidMedium,
  ExternalLinkMedium,
  WarningSolidMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { getDeviceModel } from "@ledgerhq/devices";
import { log } from "@ledgerhq/logs";
import AllowManagerDrawer from "./AllowManagerDrawer";
import GenuineCheckFailedDrawer from "./GenuineCheckFailedDrawer";
import { track } from "../../analytics";
import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/hw/hooks/useGetLatestAvailableFirmware";
import FirmwareUpdateDrawer from "./FirmwareUpdateDrawer";

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
  notifyOnboardingEarlyCheckEnded,
}) => {
  const { t } = useTranslation();
  const productName = getDeviceModel(device.modelId).productName || device.modelId;

  const [currentStep, setCurrentStep] = useState<
    "idle" | "genuine-check" | "firmware-update-check" | "firmware-updating"
  >("idle");

  const [genuineCheckStatus, setGenuineCheckStatus] = useState<GenuineCheckStatus>("unchecked");

  const [firmwareUpdateCheckStatus, setFirmwareUpdateCheckStatus] =
    useState<FirmwareUpdateStatus>("unchecked");

  // Not a real "device action" but we get: permission requested, granted and result.
  const {
    genuineState,
    devicePermissionState,
    error: genuineCheckError,
    resetGenuineCheckState,
  } = useGenuineCheck({
    isHookEnabled: genuineCheckStatus === "ongoing" && false,
    deviceId: device.deviceId,
    lockedDeviceTimeoutMs: LOCKED_DEVICE_TIMEOUT_MS,
  });

  console.log(`🦖 
    Genuine check input: ${JSON.stringify({
      isHookEnabled: genuineCheckStatus === "ongoing",
      deviceId: device.deviceId,
      lockedDeviceTimeoutMs: LOCKED_DEVICE_TIMEOUT_MS,
    })}
    \n
    Genuine check output: ${JSON.stringify({
      genuineState,
      devicePermissionState,
      error: genuineCheckError,
    })}  
  `);

  const {
    latestFirmware,
    error: latestFirmwareGettingError,
    status: latestFirmwareGettingStatus,
    lockedDevice: latestFirmwareGettingLockedDevice,
  } = useGetLatestAvailableFirmware({
    isHookEnabled: firmwareUpdateCheckStatus === "ongoing",
    deviceId: device.deviceId,
  });

  console.log(`🦕 
    Firmware update check input: ${JSON.stringify({
      isHookEnabled: firmwareUpdateCheckStatus === "ongoing",
      deviceId: device.deviceId,
    })}
    \n
    Firmware update check output: ${JSON.stringify({
      error: latestFirmwareGettingError,
      status: latestFirmwareGettingStatus,
      lockedDevice: latestFirmwareGettingLockedDevice,
      latestFirmware,
    })}  
  `);

  // Exit point
  // useEffect(() => {
  //   // FIXME: to adapt with skip and real fw update
  //   if (firmwareUpdateCheckStatus === "completed") {
  //     notifyOnboardingEarlyCheckEnded();
  //   }
  // }, [firmwareUpdateCheckStatus, notifyOnboardingEarlyCheckEnded]);

  const onStartChecks = useCallback(() => {
    setCurrentStep("genuine-check");
  }, []);

  // Check steps entry points
  useEffect(() => {
    // Genuine check start and retry entry point
    if (currentStep === "genuine-check" && genuineCheckStatus === "unchecked") {
      setGenuineCheckStatus("ongoing");
    }
    // Firmware update check start point
    else if (
      ["completed", "skipped"].includes(genuineCheckStatus) &&
      currentStep === "genuine-check"
    ) {
      setCurrentStep("firmware-update-check");
      setFirmwareUpdateCheckStatus("ongoing");
    }
  }, [currentStep, genuineCheckStatus]);

  let currentDisplayedDrawer: GenuineCheckUiDrawerStatus | FirmwareUpdateUiDrawerStatus = "none";
  let genuineCheckUiStepStatus: UiCheckStatus = "inactive";
  let firmwareUpdateUiStepStatus: UiCheckStatus = "inactive";

  console.log(
    `🍕 UI logic: ${JSON.stringify({
      currentStep,
      currentDisplayedDrawer,
      genuineCheckStatus,
      genuineCheckError,
      genuineState,
      devicePermissionState,
    })}`,
  );

  // Handles genuine check UI logic
  if (currentStep === "genuine-check") {
    if (genuineCheckStatus === "ongoing") {
      genuineCheckUiStepStatus = "active";
      currentDisplayedDrawer = "none";

      // Updates the genuineCheckStatus
      if (genuineCheckError) {
        log("EarlySecurityCheck", "Failed to run genuine check:", genuineCheckError.message);
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

  // Handles firmware update check UI logic
  if (currentStep === "firmware-update-check") {
    console.log(`🥦 fw update check UI logic: ${JSON.stringify({ latestFirmwareGettingStatus })}`);
    if (firmwareUpdateCheckStatus === "ongoing") {
      firmwareUpdateUiStepStatus = "active";
      currentDisplayedDrawer = "none";

      // Updates the firmwareUpdateCheckStatus
      if (latestFirmwareGettingError) {
        log(
          "EarlySecurityCheck",
          "Failed to retrieve latest firmware version with error:",
          latestFirmwareGettingError.message,
        );
        setFirmwareUpdateCheckStatus("failed");
      } else if (latestFirmwareGettingStatus === "no-available-firmware") {
        setFirmwareUpdateCheckStatus("completed");
      }

      // Updates the UI
      if (latestFirmwareGettingLockedDevice) {
        currentDisplayedDrawer = "unlock-needed";
      } else if (latestFirmwareGettingStatus === "available-firmware" && latestFirmware) {
        currentDisplayedDrawer = "new-firmware-available";
      } else {
        currentDisplayedDrawer = "none";
      }

      console.log(`🥦 fw update check UI logic end: ${JSON.stringify({ currentDisplayedDrawer })}`);
    }
    // currentSoftwareChecksStep can be any value for those UI updates
    if (firmwareUpdateCheckStatus === "completed") {
      firmwareUpdateUiStepStatus = "completed";
    } else if (firmwareUpdateCheckStatus === "failed") {
      firmwareUpdateUiStepStatus = "failed";
    }
  }

  // Handles the genuine check UI step title
  let genuineCheckStepTitle;
  switch (genuineCheckUiStepStatus) {
    case "active":
      genuineCheckStepTitle = t("earlySecurityCheck.genuineCheckStep.active.title");
      break;
    case "completed":
      genuineCheckStepTitle = t("earlySecurityCheck.genuineCheckStep.completed.title", {
        productName,
      });
      break;
    case "failed":
      genuineCheckStepTitle = t("earlySecurityCheck.genuineCheckStep.failed.title");
      break;
    default:
      genuineCheckStepTitle = t("earlySecurityCheck.genuineCheckStep.inactive.title");
      break;
  }

  // Handles the firmware update UI step title
  let firmwareUpdatecheckStepTitle;
  switch (firmwareUpdateUiStepStatus) {
    case "active":
      firmwareUpdatecheckStepTitle = t("earlySecurityCheck.firmwareUpdateCheckStep.active.title");
      break;
    case "completed":
      if (latestFirmwareGettingStatus === "available-firmware" && latestFirmware) {
        firmwareUpdatecheckStepTitle = t(
          "earlySecurityCheck.firmwareUpdateCheckStep.completed.updateAvailable.title",
          {
            firmwareVersion: JSON.stringify(latestFirmware.final.name),
          },
        );
      } else {
        firmwareUpdatecheckStepTitle = t(
          "earlySecurityCheck.firmwareUpdateCheckStep.completed.noUpdateAvailable.title",
          { productName },
        );
      }
      break;
    case "failed":
      firmwareUpdatecheckStepTitle = t("earlySecurityCheck.firmwareUpdateCheckStep.failed.title");
      break;
    default:
      firmwareUpdatecheckStepTitle = t("earlySecurityCheck.firmwareUpdateCheckStep.active.title");
      break;
  }

  let stepContent = (
    <Flex width="100%">
      <Text>{t("earlySecurityCheck.genuineCheck.description")}</Text>
      <CheckCard title={genuineCheckStepTitle} status={genuineCheckUiStepStatus} index={1} mb={4} />
      <CheckCard
        title={firmwareUpdatecheckStepTitle}
        status={firmwareUpdateUiStepStatus}
        index={2}
      />
    </Flex>
  );

  if (currentStep === "idle") {
    stepContent = (
      <Flex width="100%" mt="4">
        <Text mb="4">{t("earlySecurityCheck.idle.description")}</Text>
        <Link Icon={ExternalLinkMedium} style={{ justifyContent: "flex-start" }}>
          {t("earlySecurityCheck.idle.learnMore")}
        </Link>
      </Flex>
    );
  }

  let cta = <></>;

  if (currentStep === "idle") {
    cta = (
      <Button type="main" onPress={onStartChecks}>
        {t("earlySecurityCheck.idle.checkCta")}
      </Button>
    );
  }

  return (
    <>
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
            firmwareUpdateCheckStatus === "ongoing" &&
            currentDisplayedDrawer === "unlock-needed"
          ) {
            setFirmwareUpdateCheckStatus("failed");
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
      <FirmwareUpdateDrawer
        productName={productName}
        isOpen={currentDisplayedDrawer === "new-firmware-available"}
        onSkip={() => {
          track("button_clicked", {
            button: "skip software update",
            drawer: `Set up ${productName}: Step 4: Software update available`,
          });
          setFirmwareUpdateCheckStatus("completed");
        }}
        onUpdate={() => {
          track("button_clicked", {
            button: "download software update",
            drawer: `Set up ${productName}: Step 4: Software update available`,
          });
          // TODO: actual fw update
          setFirmwareUpdateCheckStatus("completed");
        }}
      />
      <Flex flexDirection="column" height="100%" width="100%">
        <Flex border="1px dashed #606060" borderRadius="16px" height="300px" mx="5"></Flex>
        <Flex
          flex={1}
          mt="5"
          flexDirection="column"
          alignItems="stretch"
          justifyContent="space-between"
        >
          <Flex paddingX="4">
            <Text variant="h4">{t("earlySecurityCheck.title")}</Text>
            {stepContent}
          </Flex>
          <Flex mx="5" mb="3">
            {cta}
          </Flex>
        </Flex>
      </Flex>
    </>
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
