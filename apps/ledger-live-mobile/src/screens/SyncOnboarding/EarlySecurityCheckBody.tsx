import React from "react";
import { ScrollView } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import Button from "../../components/wrappedUi/Button";
import type { Step, UiCheckStatus } from "./EarlySecurityCheck";
import CheckCard from "./CheckCard";

export type Props = {
  productName: string;
  currentStep: Step;
  onStartChecks: () => void;
  genuineCheckUiStepStatus: UiCheckStatus;
  onGenuineCheckLearnMore: () => void;
  onRetryGenuineCheck: () => void;
  firmwareUpdateUiStepStatus: UiCheckStatus;
  hasLatestAvailableFirmwareStatus: boolean;
  latestAvailableFirmwareVersion?: string;
  notifyOnboardingEarlyCheckEnded: () => void;
  onSkipFirmwareUpdate: () => void;
  onUpdateFirmware: () => void;
};

/**
 * UI rendering of the EarlySecurityCheck component
 */
const EarlySecurityCheckBody: React.FC<Props> = ({
  productName,
  currentStep,
  onStartChecks,
  genuineCheckUiStepStatus,
  onGenuineCheckLearnMore,
  onRetryGenuineCheck,
  firmwareUpdateUiStepStatus,
  hasLatestAvailableFirmwareStatus,
  latestAvailableFirmwareVersion,
  notifyOnboardingEarlyCheckEnded,
  onSkipFirmwareUpdate,
  onUpdateFirmware,
}) => {
  const { t } = useTranslation();

  // ***** Updates UI *****
  // For both genuine check step and firmware update check step
  let primaryBottomCta: JSX.Element | null = null;
  let secondaryBottomCta: JSX.Element | null = null;

  // Updates the genuine check UI step
  let genuineCheckStepTitle;
  let genuineCheckStepDescription: string | null = null;
  // Always displays the learn more section on the genuine check
  const genuineCheckStepLearnMore = t("earlySecurityCheck.genuineCheckStep.learnMore");
  const genuineCheckOnLearnMore = onGenuineCheckLearnMore;

  switch (genuineCheckUiStepStatus) {
    case "active":
      genuineCheckStepTitle = t("earlySecurityCheck.genuineCheckStep.active.title");
      genuineCheckStepDescription = t("earlySecurityCheck.genuineCheckStep.active.description", {
        productName,
      });
      break;
    case "completed":
      genuineCheckStepTitle = t("earlySecurityCheck.genuineCheckStep.completed.title", {
        productName,
      });
      genuineCheckStepDescription = t("earlySecurityCheck.genuineCheckStep.completed.description", {
        productName,
      });
      break;
    case "error":
      genuineCheckStepTitle = t("earlySecurityCheck.genuineCheckStep.error.title");
      genuineCheckStepDescription = t("earlySecurityCheck.genuineCheckStep.error.description", {
        productName,
      });
      break;
    case "genuineCheckRefused":
      genuineCheckStepTitle = t("earlySecurityCheck.genuineCheckStep.refused.title");
      genuineCheckStepDescription = t("earlySecurityCheck.genuineCheckStep.refused.description");
      primaryBottomCta = (
        <Button type="main" onPress={onRetryGenuineCheck}>
          {t("earlySecurityCheck.genuineCheckStep.refused.cta")}
        </Button>
      );
      break;
    default:
      genuineCheckStepTitle = t("earlySecurityCheck.genuineCheckStep.inactive.title");
      genuineCheckStepDescription = t("earlySecurityCheck.genuineCheckStep.inactive.description", {
        productName,
      });
      break;
  }

  // Handles the firmware update UI step title
  let firmwareUpdateCheckStepTitle;
  let firmwareUpdateCheckStepDescription: string | null = null;

  switch (firmwareUpdateUiStepStatus) {
    case "active":
      firmwareUpdateCheckStepTitle = t("earlySecurityCheck.firmwareUpdateCheckStep.active.title");
      firmwareUpdateCheckStepDescription = t(
        "earlySecurityCheck.firmwareUpdateCheckStep.active.description",
        {
          productName,
        },
      );
      break;
    case "completed":
      firmwareUpdateCheckStepTitle = t(
        "earlySecurityCheck.firmwareUpdateCheckStep.completed.noUpdateAvailable.title",
        { productName },
      );
      firmwareUpdateCheckStepDescription = t(
        "earlySecurityCheck.firmwareUpdateCheckStep.completed.noUpdateAvailable.description",
        {
          productName,
        },
      );

      primaryBottomCta = (
        <Button type="main" onPress={notifyOnboardingEarlyCheckEnded}>
          {t("earlySecurityCheck.completed.continueCta")}
        </Button>
      );
      break;
    case "error":
      firmwareUpdateCheckStepTitle = t("earlySecurityCheck.firmwareUpdateCheckStep.error.title");

      // So the user can continue the onboarding in case of failure
      primaryBottomCta = (
        <Button type="main" onPress={onSkipFirmwareUpdate} mt="2">
          {t("earlySecurityCheck.firmwareUpdateCheckStep.error.skipCta")}
        </Button>
      );
      break;
    case "firmwareUpdateRefused":
      if (hasLatestAvailableFirmwareStatus) {
        firmwareUpdateCheckStepTitle = t(
          "earlySecurityCheck.firmwareUpdateCheckStep.refused.title",
          {
            firmwareVersion: latestAvailableFirmwareVersion,
          },
        );

        firmwareUpdateCheckStepDescription = t(
          "earlySecurityCheck.firmwareUpdateCheckStep.refused.description",
        );

        primaryBottomCta = (
          <Button type="main" onPress={onUpdateFirmware} mt="2">
            {t("earlySecurityCheck.firmwareUpdateCheckStep.refused.updateCta")}
          </Button>
        );
      } else {
        // This should not happen: if the user refused the update, it means one was available
        firmwareUpdateCheckStepTitle = t(
          "earlySecurityCheck.firmwareUpdateCheckStep.completed.noUpdateAvailable.title",
          { productName },
        );
      }

      secondaryBottomCta = (
        <Button type="default" onPress={onSkipFirmwareUpdate}>
          {t("earlySecurityCheck.firmwareUpdateCheckStep.refused.skipCta")}
        </Button>
      );

      break;
    case "inactive":
    default:
      firmwareUpdateCheckStepTitle = t("earlySecurityCheck.firmwareUpdateCheckStep.inactive.title");
      firmwareUpdateCheckStepDescription = t(
        "earlySecurityCheck.firmwareUpdateCheckStep.inactive.description",
        {
          productName,
        },
      );
      break;
  }

  if (currentStep === "idle") {
    primaryBottomCta = (
      <Button type="main" onPress={onStartChecks}>
        {t("earlySecurityCheck.idle.checkCta")}
      </Button>
    );
  }

  return (
    <ScrollView
      style={{
        display: "flex",
        flex: 1,
      }}
      contentContainerStyle={{
        flexGrow: 1,
        flexDirection: "column",
      }}
    >
      <Flex
        flex={1}
        mt="5"
        flexDirection="column"
        alignItems="stretch"
        justifyContent="space-between"
      >
        <Flex paddingX="4">
          <Text variant="h4" mb="4">
            {t("earlySecurityCheck.title")}
          </Text>
          <Flex width="100%" mt="4">
            <CheckCard
              title={genuineCheckStepTitle}
              description={genuineCheckStepDescription}
              status={genuineCheckUiStepStatus}
              learnMore={genuineCheckStepLearnMore}
              onLearnMore={genuineCheckOnLearnMore}
              index={1}
              mb={6}
            />
            <CheckCard
              title={firmwareUpdateCheckStepTitle}
              description={firmwareUpdateCheckStepDescription}
              status={firmwareUpdateUiStepStatus}
              index={2}
            />
          </Flex>
        </Flex>
        <Flex mx="5" mb="4">
          {primaryBottomCta}
          {secondaryBottomCta}
        </Flex>
      </Flex>
    </ScrollView>
  );
};

export default EarlySecurityCheckBody;
