import React from "react";
import { Flex, Text, VerticalTimeline } from "@ledgerhq/native-ui";
import { ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TrackScreen } from "~/analytics";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SeedPathStatus } from "./TwoStepSyncOnboardingCompanion";
import ContinueOnDeviceWithAnim from "./ContinueOnDeviceWithAnim";
import BackgroundBlue from "../assets/BackgroundBlue";
import BackgroundRed from "../assets/BackgroundRed";
import SeedCompanionStep from "./SeedCompanionStep";
import { OnboardingState } from "@ledgerhq/live-common/hw/extractOnboardingState";

const { BodyText } = VerticalTimeline;

// Because of https://github.com/typescript-eslint/typescript-eslint/issues/1197
export enum FirstStepCompanionStepKey {
  EarlySecurityCheckCompleted = 0,
  Pin,
  Seed,
  Ready,
  Exit,
}

type StepStatus = "completed" | "active" | "inactive";

type Step = {
  key: FirstStepCompanionStepKey;
  status: StepStatus;
  title: string;
  doneTitle?: string;
  estimatedTime?: number;
  renderBody?: (isDisplayed?: boolean) => ReactNode;
};

interface UseCompanionStepsProps {
  /**
   * A `Device` object
   */
  device: Device;
  productName: string;
  seedPathStatus: SeedPathStatus;
  deviceOnboardingState: OnboardingState;
}

const useCompanionSteps = ({
  device,
  productName,
  seedPathStatus,
  deviceOnboardingState,
}: UseCompanionStepsProps): Step[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        key: FirstStepCompanionStepKey.EarlySecurityCheckCompleted,
        title: t("syncOnboarding.earlySecurityCheckCompletedStep.title", { productName }),
        renderBody: () => (
          <>
            <TrackScreen category={"Set up device: Step 1 device paired"} />
            <Text variant="body" color="neutral.c80" mb={6}>
              {t("syncOnboarding.earlySecurityCheckCompletedStep.subtitle", {
                productName,
              })}
            </Text>
            <ContinueOnDeviceWithAnim
              deviceModelId={device.modelId}
              text={t("syncOnboarding.earlySecurityCheckCompletedStep.description", {
                productName,
              })}
              withTopDivider={true}
            />
          </>
        ),
      },
      {
        key: FirstStepCompanionStepKey.Pin,
        title: t("syncOnboarding.pinStep.title"),
        doneTitle: t("syncOnboarding.pinStep.doneTitle"),
        renderBody: () => (
          <Flex>
            <TrackScreen category={"Set up device: Step 2 PIN"} />
            <BodyText>{t("syncOnboarding.pinStep.description", { productName })}</BodyText>
            <ContinueOnDeviceWithAnim
              deviceModelId={device.modelId}
              text={t("syncOnboarding.pinStep.continueOnDevice", {
                productName,
              })}
            />
          </Flex>
        ),
      },
      {
        key: FirstStepCompanionStepKey.Seed,
        title: t("syncOnboarding.seedStep.title"),
        doneTitle: t("syncOnboarding.seedStep.doneTitle"),
        background:
          seedPathStatus === "new_seed" ? (
            <BackgroundBlue />
          ) : seedPathStatus === "backup_charon" ? (
            <BackgroundRed />
          ) : null,
        renderBody: () => (
          <SeedCompanionStep
            seedPathStatus={seedPathStatus}
            charonSupported={deviceOnboardingState?.charonSupported}
            charonStatus={deviceOnboardingState?.charonStatus}
          />
        ),
      },
    ],
    [],
  );
};

export default useCompanionSteps;

// return useMemo(
//     () =>
//       [

//         {
//           key: CompanionStepKey.Ready,
//           title: t("syncOnboarding.readyStep.title"),
//           doneTitle: t("syncOnboarding.readyStep.doneTitle", { productName }),
//         },
//       ].map(step => ({
//         ...step,
//         status:
//           step.key > companionStepKey
//             ? "inactive"
//             : step.key < companionStepKey
//               ? "completed"
//               : "active",
//       })),
//     [
//       t,
//       productName,
//       seedPathStatus,
//       deviceInitialApps?.enabled,
//       device,
//       deviceOnboardingState?.charonSupported,
//       deviceOnboardingState?.charonStatus,
//       handleLearnMoreClick,
//       shouldRestoreApps,
//       handleInstallAppsComplete,
//       initialAppsToInstall,
//       companionStepKey,
//     ],
//   );
