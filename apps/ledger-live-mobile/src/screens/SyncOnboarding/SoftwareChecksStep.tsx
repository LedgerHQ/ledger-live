import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BoxedIcon, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import {
  CheckAloneMedium,
  CircledAlertMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useGenuineCheck } from "@ledgerhq/live-common/lib/hw/hooks/useGenuineCheck";
import { useGetLatestFirmware } from "@ledgerhq/live-common/lib/hw/hooks/useGetLatestFirmware";

import GenuineCheckDrawer from "./GenuineCheckDrawer";
import FirmwareUpdateDrawer from "./FirmwareUpdateDrawer";
import GenuineCheckCancelledDrawer from "./GenuineCheckCancelledDrawer";
import UnlockDeviceDrawer from "./UnlockDeviceDrawer";
import AllowManagerDrawer from "./AllowManagerDrawer";

const softwareStepDelay = 2500;
const uiDrawerDisplayDelayMs = 500;
const lockedDeviceTimeoutMs = 1000;

type CheckStatus = "inactive" | "active" | "completed" | "failed";

type GenuineCheckUiStepStatus = CheckStatus;
type GenuineCheckStatus =
  | "unchecked"
  | "requested"
  | "ongoing"
  | "unlock-needed"
  | "allow-manager-needed"
  | "cancelled"
  | "completed"
  | "failed";
type GenuineCheckUiDrawerStatus =
  | "none"
  | "requested"
  | "allow-manager"
  | "unlock-needed"
  | "cancelled";

type FirmwareUpdateUiStepStatus = CheckStatus;
type FirmwareUpdateStatus =
  | "unchecked"
  | "ongoing"
  | "new-firmware-available"
  | "completed"
  | "failed";
type FirmwareUpdateUiDrawerStatus = "none" | "new-firmware-available";

type CheckCardProps = FlexBoxProps & {
  title: string;
  index: number;
  status: CheckStatus;
};

const CheckCard = ({ title, index, status, ...props }: CheckCardProps) => {
  const getCheckIcon = useCallback((status: CheckStatus, index: number) => {
    if (status === "active") {
      return <InfiniteLoader size={24} />;
    }
    if (status === "completed") {
      return <CheckAloneMedium color="success.c100" size={16} />;
    }
    if (status === "failed") {
      return <CircledAlertMedium color="warning.c100" size={24} />;
    }
    return <Text variant="body">{index}</Text>;
  }, []);

  return (
    <Flex flexDirection="row" alignItems="center" {...props}>
      <BoxedIcon
        backgroundColor="neutral.c30"
        borderColor="neutral.c30"
        variant="circle"
        Icon={getCheckIcon(status, index)}
      />
      <Text ml={4} variant="body">
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

  const [genuineCheckUiStepStatus, setGenuineCheckUiStepStatus] = useState<
    GenuineCheckUiStepStatus
  >("inactive");

  const [genuineCheckStatus, setGenuineCheckStatus] = useState<
    GenuineCheckStatus
  >("unchecked");

  const [genuineCheckUiDrawerStatus, setGenuineCheckUiDrawerStatus] = useState<
    GenuineCheckUiDrawerStatus
  >("none");

  const [genuineCheckStepTitle, setGenuineCheckStepTitle] = useState<string>(
    t("syncOnboarding.sofwareChecksSteps.genuineCheckStep.inactive.title"),
  );

  const [firmwareUpdateUiStepStatus, setFirmwareUpdateUiStepStatus] = useState<
    FirmwareUpdateUiStepStatus
  >("inactive");

  const [firmwareUpdateStatus, setFirmwareUpdateStatus] = useState<
    FirmwareUpdateStatus
  >("unchecked");

  const [
    firmwareUpdateUiDrawerStatus,
    setFirmwareUpdateUiDrawerStatus,
  ] = useState<FirmwareUpdateUiDrawerStatus>("none");

  const [firmwareUpdateStepTitle, setFirmwareUpdateStepTitle] = useState<
    string
  >(t("syncOnboarding.sofwareChecksSteps.firmwareUpdateStep.inactive.title"));

  // Not a DeviceAction as we're only interested in the permission requested, granted and result.
  // No need the full DeviceAction with its retry strategy etc.
  const {
    genuineState,
    devicePermissionState,
    error: genuineCheckError,
    resetGenuineCheckState,
  } = useGenuineCheck({
    isHookEnabled: [
      "ongoing",
      "allow-manager-needed",
      "unlock-needed",
    ].includes(genuineCheckStatus),
    deviceId: device.deviceId,
    lockedDeviceTimeoutMs,
  });

  // Handles the genuine check logic
  useEffect(() => {
    // The software check step is not the current step
    if (!isDisplayed) return;

    // Entry point for the genuine check
    if (genuineCheckStatus === "unchecked") {
      setGenuineCheckStatus("requested");
    }

    if (
      devicePermissionState === "unlock-needed" &&
      genuineCheckStatus === "ongoing"
    ) {
      setGenuineCheckStatus("unlock-needed");
    }

    if (
      devicePermissionState === "unlocked" &&
      genuineCheckStatus === "unlock-needed"
    ) {
      setGenuineCheckStatus("ongoing");
    }

    if (
      devicePermissionState === "requested" &&
      genuineCheckStatus === "ongoing"
    ) {
      setGenuineCheckStatus("allow-manager-needed");
    }

    if (
      devicePermissionState === "granted" &&
      genuineCheckStatus === "allow-manager-needed"
    ) {
      setGenuineCheckStatus("ongoing");
    }

    if (
      devicePermissionState === "refused" &&
      genuineCheckStatus === "allow-manager-needed"
    ) {
      setGenuineCheckStatus("cancelled");
    }

    if (genuineCheckError) {
      setGenuineCheckStatus("failed");
    }

    if (genuineState === "genuine") {
      setGenuineCheckStatus("completed");
    }

    if (genuineState === "non-genuine") {
      // FIXME: if the device is non-genuine, we should display something else
      setGenuineCheckStatus("failed");
    }
  }, [
    devicePermissionState,
    genuineCheckError,
    genuineCheckStatus,
    genuineState,
    isDisplayed,
  ]);

  // Handles the genuine check UI
  useEffect(() => {
    // The software check step is not the current step
    if (!isDisplayed) {
      setGenuineCheckUiStepStatus("inactive");
      setGenuineCheckUiDrawerStatus("none");
      return;
    }

    switch (genuineCheckStatus) {
      case "completed":
        setGenuineCheckUiStepStatus("completed");
        setGenuineCheckUiDrawerStatus("none");
        break;
      case "failed":
        setGenuineCheckUiStepStatus("failed");
        setGenuineCheckUiDrawerStatus("none");
        break;
      case "requested":
        setGenuineCheckUiStepStatus("active");
        setGenuineCheckUiDrawerStatus("none");

        setTimeout(() => {
          setGenuineCheckUiDrawerStatus("requested");
        }, uiDrawerDisplayDelayMs);
        break;
      case "ongoing":
        setGenuineCheckUiStepStatus("active");
        setGenuineCheckUiDrawerStatus("none");
        break;
      case "allow-manager-needed":
        setGenuineCheckUiStepStatus("active");
        setGenuineCheckUiDrawerStatus("none");

        setTimeout(() => {
          setGenuineCheckUiDrawerStatus("allow-manager");
        }, uiDrawerDisplayDelayMs);
        break;
      case "cancelled":
        setGenuineCheckUiStepStatus("active");
        setGenuineCheckUiDrawerStatus("none");

        setTimeout(() => {
          setGenuineCheckUiDrawerStatus("cancelled");
        }, uiDrawerDisplayDelayMs);
        break;
      case "unlock-needed":
        setGenuineCheckUiDrawerStatus("none");

        setTimeout(() => {
          setGenuineCheckUiDrawerStatus("unlock-needed");
        }, uiDrawerDisplayDelayMs);
        break;
      case "unchecked":
      default:
        setGenuineCheckUiStepStatus("inactive");
        setGenuineCheckUiDrawerStatus("none");
        break;
    }
  }, [isDisplayed, genuineCheckStatus]);

  // Handles the genuine check UI step title
  useEffect(() => {
    switch (genuineCheckUiStepStatus) {
      case "active":
        setGenuineCheckStepTitle(
          t("syncOnboarding.sofwareChecksSteps.genuineCheckStep.active.title", {
            productName: "Nano", // TODO: put something like device.modelId,
          }),
        );
        break;
      case "completed":
        setGenuineCheckStepTitle(
          t(
            "syncOnboarding.sofwareChecksSteps.genuineCheckStep.completed.title",
            {
              productName: "Nano", // TODO: put something like device.modelId,
            },
          ),
        );
        break;
      case "failed":
        setGenuineCheckStepTitle(
          t("syncOnboarding.sofwareChecksSteps.genuineCheckStep.failed.title"),
        );
        break;
      default:
        setGenuineCheckStepTitle(
          t(
            "syncOnboarding.sofwareChecksSteps.genuineCheckStep.inactive.title",
          ),
        );
        break;
    }
  }, [t, genuineCheckUiStepStatus]);

  const {
    latestFirmware,
    error: latestFirmwareGettingError,
    status: latestFirmwareGettingStatus,
  } = useGetLatestFirmware({
    isHookEnabled: firmwareUpdateStatus === "ongoing",
    deviceId: device.deviceId,
  });

  // Handles the firmware update logic
  useEffect(() => {
    // The software check step is not the current step
    if (!isDisplayed) return;

    // Transitions from genuine check step to firmware update step
    if (
      (genuineCheckStatus === "completed" || genuineCheckStatus === "failed") &&
      firmwareUpdateStatus === "unchecked"
    ) {
      setTimeout(() => {
        setFirmwareUpdateStatus("ongoing");
      }, softwareStepDelay);
    }

    if (latestFirmwareGettingError) {
      setFirmwareUpdateStatus("failed");
    }

    if (
      latestFirmwareGettingStatus === "available-firmware" &&
      latestFirmware &&
      firmwareUpdateStatus === "ongoing"
    ) {
      setFirmwareUpdateStatus("new-firmware-available");
    }

    if (latestFirmwareGettingStatus === "no-available-firmware") {
      setFirmwareUpdateStatus("completed");
    }
  }, [
    firmwareUpdateStatus,
    genuineCheckStatus,
    isDisplayed,
    latestFirmware,
    latestFirmwareGettingError,
    latestFirmwareGettingStatus,
  ]);

  // Handles the firmware update UI
  useEffect(() => {
    // The software check step is not the current step
    if (!isDisplayed) {
      setFirmwareUpdateUiDrawerStatus("none");
      setFirmwareUpdateUiStepStatus("inactive");
      return;
    }

    switch (firmwareUpdateStatus) {
      case "ongoing":
        setFirmwareUpdateUiStepStatus("active");
        setFirmwareUpdateUiDrawerStatus("none");
        break;
      case "new-firmware-available":
        setFirmwareUpdateUiStepStatus("active");
        setFirmwareUpdateUiDrawerStatus("new-firmware-available");
        break;
      case "completed":
        setFirmwareUpdateUiStepStatus("completed");
        setFirmwareUpdateUiDrawerStatus("none");
        break;
      case "failed":
        setFirmwareUpdateUiStepStatus("failed");
        setFirmwareUpdateUiDrawerStatus("none");
        break;
      case "unchecked":
      default:
        setFirmwareUpdateUiStepStatus("inactive");
        setFirmwareUpdateUiDrawerStatus("none");
    }
  }, [firmwareUpdateStatus, isDisplayed]);

  // Handles the firmware update UI step title
  useEffect(() => {
    switch (firmwareUpdateUiStepStatus) {
      case "active":
        setFirmwareUpdateStepTitle(
          t(
            "syncOnboarding.sofwareChecksSteps.firmwareUpdateStep.active.title",
          ),
        );
        break;
      case "completed":
        if (
          latestFirmwareGettingStatus === "available-firmware" &&
          latestFirmware
        ) {
          setFirmwareUpdateStepTitle(
            t(
              "syncOnboarding.sofwareChecksSteps.firmwareUpdateStep.completed.updateAvailable.title",
              {
                firmwareVersion: JSON.stringify(latestFirmware.final.name),
              },
            ),
          );
        } else {
          setFirmwareUpdateStepTitle(
            t(
              "syncOnboarding.sofwareChecksSteps.firmwareUpdateStep.completed.noUpdateAvailable.title",
            ),
          );
        }
        break;
      case "failed":
        setFirmwareUpdateStepTitle(
          t(
            "syncOnboarding.sofwareChecksSteps.firmwareUpdateStep.failed.title",
          ),
        );
        break;
      default:
        setFirmwareUpdateStepTitle(
          t(
            "syncOnboarding.sofwareChecksSteps.firmwareUpdateStep.inactive.title",
          ),
        );
        break;
    }
  }, [
    firmwareUpdateUiStepStatus,
    latestFirmware,
    latestFirmwareGettingStatus,
    t,
  ]);

  // Handles the completion of the entire software check step
  useEffect(() => {
    if (isDisplayed && onComplete && firmwareUpdateStatus === "completed") {
      // FIXME: timeout for now to display the status of the available fw update
      setTimeout(() => onComplete(), 2000);
    }
  }, [isDisplayed, firmwareUpdateStatus, onComplete]);

  return (
    <Flex>
      {isDisplayed && (
        <Flex>
          <GenuineCheckDrawer
            isOpen={genuineCheckUiDrawerStatus === "requested"}
            onPress={() => setGenuineCheckStatus("ongoing")}
          />
          <UnlockDeviceDrawer
            isOpen={genuineCheckUiDrawerStatus === "unlock-needed"}
            device={device}
          />
          <AllowManagerDrawer
            isOpen={genuineCheckUiDrawerStatus === "allow-manager"}
            device={device}
          />
          <GenuineCheckCancelledDrawer
            isOpen={genuineCheckUiDrawerStatus === "cancelled"}
            onRetry={() => {
              resetGenuineCheckState();
              setGenuineCheckStatus("ongoing");
            }}
            onSkip={() => setGenuineCheckStatus("failed")}
          />
          <FirmwareUpdateDrawer
            isOpen={firmwareUpdateUiDrawerStatus === "new-firmware-available"}
            onSkip={() => setFirmwareUpdateStatus("completed")}
            onUpdate={() => setFirmwareUpdateStatus("completed")}
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
