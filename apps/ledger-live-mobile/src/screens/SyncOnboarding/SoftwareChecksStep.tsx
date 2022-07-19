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
import GenuineCheckActiveDrawer from "./GenuineCheckActiveDrawer";

type CheckStatus =
  | "inactive"
  | "requested"
  | "active"
  | "cancelled"
  | "completed"
  | "failed";

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

export const SoftwareChecksStep = ({
  device,
  isDisplayed,
  onComplete,
}: Props) => {
  const { t } = useTranslation();
  const [genuineCheckStepStatus, setGenuineCheckStepStatus] = useState<
    CheckStatus
  >("inactive");
  const [genuineCheckStepTitle, setGenuineCheckStepTitle] = useState<string>(
    t("syncOnboarding.sofwareChecksSteps.genuineCheckStep.inactive.title"),
  );

  const [firmwareUpdateStepStatus, setFirmwareUpdateStepStatus] = useState<
    CheckStatus
  >("inactive");
  const [firmwareUpdateStepTitle, setFirmwareUpdateStepTitle] = useState<
    string
  >(t("syncOnboarding.sofwareChecksSteps.firmwareUpdateStep.inactive.title"));

  // Not a DeviceAction as we're only interested in the permission requested, granted and result.
  // No need the full DeviceAction with its retry strategy etc.
  const {
    genuineState,
    devicePermissionState,
    error: genuineCheckError,
  } = useGenuineCheck({
    isHookEnabled: genuineCheckStepStatus === "active",
    deviceId: device.deviceId,
  });

  // Handles genuine check UI and logic states
  useEffect(() => {
    if (
      !isDisplayed ||
      genuineCheckStepStatus === "completed" ||
      genuineCheckStepStatus === "failed"
    ) {
      return;
    }

    if (genuineCheckStepStatus === "inactive") {
      setGenuineCheckStepStatus("requested");
    } else if (genuineState === "genuine") {
      setGenuineCheckStepStatus("completed");
    } else if (devicePermissionState === "refused") {
      setGenuineCheckStepStatus("cancelled");
    } else if (genuineCheckError) {
      setGenuineCheckStepStatus("failed");
    } else if (genuineState === "non-genuine") {
      // FIXME: if the device is non-genuine, we should display something else
      setGenuineCheckStepStatus("failed");
    }
  }, [
    t,
    genuineState,
    devicePermissionState,
    genuineCheckError,
    isDisplayed,
    genuineCheckStepStatus,
  ]);

  const {
    latestFirmware,
    error: latestFirmwareGettingError,
    status: latestFirmwareGettingStatus,
  } = useGetLatestFirmware({
    isHookEnabled: firmwareUpdateStepStatus === "active",
    deviceId: device.deviceId,
  });

  useEffect(() => {
    switch (genuineCheckStepStatus) {
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
      case "cancelled":
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
  }, [t, genuineCheckStepStatus]);

  useEffect(() => {
    switch (firmwareUpdateStepStatus) {
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
      case "cancelled":
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
    t,
    firmwareUpdateStepStatus,
    latestFirmware,
    latestFirmwareGettingStatus,
  ]);

  // Handles software update UI and logic states
  useEffect(() => {
    if (!isDisplayed) {
      return;
    }

    // Transitions from genuine check step to firmware update step
    if (
      (genuineCheckStepStatus === "completed" ||
        genuineCheckStepStatus === "failed") &&
      firmwareUpdateStepStatus === "inactive"
    ) {
      setFirmwareUpdateStepStatus("requested");
    }

    if (firmwareUpdateStepStatus === "active") {
      if (latestFirmwareGettingError) {
        setFirmwareUpdateStepStatus("failed");
      } else if (
        latestFirmwareGettingStatus === "available-firmware" &&
        latestFirmware
      ) {
        setFirmwareUpdateStepStatus("completed");
      } else if (latestFirmwareGettingStatus === "no-available-firmware") {
        setFirmwareUpdateStepStatus("completed");
      }
    }
  }, [
    isDisplayed,
    genuineCheckStepStatus,
    firmwareUpdateStepStatus,
    latestFirmware,
    latestFirmwareGettingError,
    t,
    latestFirmwareGettingStatus,
  ]);

  useEffect(() => {
    if (isDisplayed && onComplete && firmwareUpdateStepStatus === "completed") {
      // FIXME: timeout for now to display the status of the available fw update
      setTimeout(() => onComplete(), 2000);
    }
  }, [isDisplayed, firmwareUpdateStepStatus, onComplete]);

  return (
    <Flex>
      {isDisplayed && (
        <Flex>
          <GenuineCheckDrawer
            isOpen={genuineCheckStepStatus === "requested"}
            onPress={() => setGenuineCheckStepStatus("active")}
          />
          <GenuineCheckActiveDrawer
            isOpen={genuineCheckStepStatus === "active"}
          />
          <GenuineCheckCancelledDrawer
            isOpen={genuineCheckStepStatus === "cancelled"}
            onRetry={() => setGenuineCheckStepStatus("active")}
            onSkip={() => setGenuineCheckStepStatus("failed")}
          />
          <FirmwareUpdateDrawer
            isOpen={firmwareUpdateStepStatus === "requested"}
            onSkip={() => setFirmwareUpdateStepStatus("completed")}
            onUpdate={() => setFirmwareUpdateStepStatus("active")}
          />
        </Flex>
      )}
      <CheckCard
        title={genuineCheckStepTitle}
        status={genuineCheckStepStatus}
        index={1}
        mb={4}
      />
      <CheckCard
        title={firmwareUpdateStepTitle}
        status={firmwareUpdateStepStatus}
        index={2}
      />
    </Flex>
  );
};
