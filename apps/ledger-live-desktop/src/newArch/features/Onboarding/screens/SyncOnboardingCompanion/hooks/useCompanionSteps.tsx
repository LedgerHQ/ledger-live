import React, { ReactNode, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/devices";
import { ContinueOnDevice, Flex } from "@ledgerhq/react-ui";
import { useSelector } from "LLD/hooks/redux";
import { SeedOriginType } from "@ledgerhq/types-live";
import { OnboardingState } from "@ledgerhq/live-common/hw/extractOnboardingState";

import { useTheme } from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import OnboardingAppInstallStep from "~/renderer/components/OnboardingAppInstall";
import SeedStep from "LLD/features/Onboarding/screens/SyncOnboardingCompanion/components/SeedStep";
import { SeedPathStatus } from "LLD/features/Onboarding/screens/SyncOnboardingCompanion/types";

import StepText from "LLD/features/Onboarding/components/StepText";
import BackupBackground from "../assets/BackupBackground";
import SetupBackground from "../assets/SetupBackground";
import ContinueOnStax from "../assets/ContinueOnStax";
import ContinueOnEuropa from "../assets/ContinueOnEuropa";
import ContinueOnApex from "../assets/ContinueOnApex";
import { analyticsFlowName } from "../utils/constants/analytics";

export const READY_REDIRECT_DELAY_MS = 2000;

export enum StepKey {
  Paired = 0,
  Pin,
  Seed,
  Backup,
  Success,
  Apps,
  Ready,
  Exit,
}

export type StepStatus = "completed" | "active" | "inactive";
const InactiveStep: StepStatus = "inactive";

export type Step = {
  key: StepKey;
  status: StepStatus;
  title: string;
  titleCompleted?: string;
  hasLoader?: boolean;
  estimatedTime?: number;
  renderBody?: () => ReactNode;
  background?: ReactNode;
};

interface UseCompanionStepsProps {
  device: Device;
  setStepKey: (step: StepKey) => void;
  shouldRestoreApps: boolean;
  deviceName: string;
  seedPathStatus: SeedPathStatus;
  productName: string;
  isTwoStep: boolean;
  charonSupported?: OnboardingState["charonSupported"];
  charonStatus?: OnboardingState["charonStatus"];
  seedConfiguration?: SeedOriginType;
}

function nextStepKey(step: StepKey): StepKey {
  if (step === StepKey.Exit) {
    return StepKey.Exit;
  }
  return step + 1;
}

const useCompanionSteps = ({
  device,
  setStepKey,
  shouldRestoreApps,
  deviceName,
  seedPathStatus,
  productName,
  charonSupported,
  charonStatus,
  isTwoStep,
  seedConfiguration,
}: UseCompanionStepsProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [hasAppLoader, setHasAppLoader] = useState<boolean>(false);

  const deviceToRestore = useSelector(lastSeenDeviceSelector);
  const handleAppStepComplete = useCallback(() => setStepKey(StepKey.Exit), [setStepKey]);
  const handleInstallRecommendedApplicationComplete = useCallback(() => {
    setTimeout(() => setStepKey(nextStepKey(StepKey.Apps)), READY_REDIRECT_DELAY_MS);
  }, [setStepKey]);

  const DeviceIcon = useMemo(() => {
    switch (device.modelId) {
      case DeviceModelId.stax:
        return ContinueOnStax;
      case DeviceModelId.europa:
        return ContinueOnEuropa;
      case DeviceModelId.apex:
        return ContinueOnApex; // Use the same icon as Europa for now
      default:
        return ContinueOnEuropa; // Fallback to Europa icon
    }
  }, [device.modelId]);

  const activeBackground = isTwoStep ? colors.opacityDefault.c05 : undefined;

  const defaultSteps: Step[] = useMemo(
    () => [
      {
        key: StepKey.Paired,
        status: "active",
        title: t("syncOnboarding.manual.pairedContent.title", {
          deviceName,
        }),
        activeBackground,
        renderBody: () => (
          <Flex flexDirection="column">
            <TrackPage
              category={`Set up ${productName}: Step 1 device paired`}
              flow={analyticsFlowName}
            />
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText>
              {t("syncOnboarding.manual.pairedContent.description", {
                productName,
              })}
            </StepText>
            <ContinueOnDevice
              Icon={DeviceIcon}
              text={t("syncOnboarding.manual.pairedContent.continueOnDevice", { productName })}
            />
          </Flex>
        ),
      },
      {
        key: StepKey.Pin,
        status: "inactive",
        title: t("syncOnboarding.manual.pinContent.title"),
        titleCompleted: t("syncOnboarding.manual.pinContent.titleCompleted"),
        activeBackground,
        renderBody: () => (
          <Flex flexDirection="column">
            <TrackPage category={`Set up ${productName}: Step 2 PIN`} flow={analyticsFlowName} />
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText>
              {t("syncOnboarding.manual.pinContent.description", { productName })}
            </StepText>
            <ContinueOnDevice
              Icon={DeviceIcon}
              text={t("syncOnboarding.manual.pinContent.continueOnDevice", { productName })}
            />
          </Flex>
        ),
      },
      {
        key: StepKey.Seed,
        status: "inactive",
        title: t("syncOnboarding.manual.seedContent.title"),
        titleCompleted: t("syncOnboarding.manual.seedContent.titleCompleted"),
        activeBackground,
        background:
          seedPathStatus === "new_seed" ? (
            // Secret Phrase screen
            <SetupBackground />
          ) : seedPathStatus === "backup_charon" ? (
            // Recovery Key screen
            <BackupBackground />
          ) : null,
        renderBody: () => (
          <>
            <TrackPage
              category={`Set up ${productName}: Step 3 Seed Intro`}
              flow={analyticsFlowName}
            />
            <SeedStep
              seedPathStatus={seedPathStatus}
              deviceName={productName}
              deviceIcon={DeviceIcon}
              charonSupported={Boolean(charonSupported)}
              charonStatus={charonStatus ?? null}
            />
          </>
        ),
      },
      ...(isTwoStep
        ? []
        : [
            {
              key: StepKey.Apps,
              status: InactiveStep,
              hasLoader: hasAppLoader,
              title: t("syncOnboarding.manual.installApplications.title", { productName }),
              titleCompleted: t("syncOnboarding.manual.installApplications.titleCompleted", {
                productName,
              }),
              renderBody: () => (
                <OnboardingAppInstallStep
                  device={device}
                  deviceToRestore={
                    shouldRestoreApps && deviceToRestore ? deviceToRestore : undefined
                  }
                  setHeaderLoader={(hasLoader: boolean) => setHasAppLoader(hasLoader)}
                  onComplete={handleInstallRecommendedApplicationComplete}
                  seedConfiguration={seedConfiguration}
                />
              ),
            },
            {
              key: StepKey.Ready,
              status: InactiveStep,
              title: t("syncOnboarding.manual.endOfSetup.title"),
              titleCompleted: t("syncOnboarding.manual.endOfSetup.titleCompleted", {
                deviceName: productName,
              }),
            },
          ]),
    ],
    [
      t,
      deviceName,
      seedPathStatus,
      hasAppLoader,
      productName,
      DeviceIcon,
      charonSupported,
      charonStatus,
      device,
      shouldRestoreApps,
      deviceToRestore,
      handleInstallRecommendedApplicationComplete,
      isTwoStep,
      activeBackground,
      seedConfiguration,
    ],
  );

  const installStep = useMemo(
    () => (
      <OnboardingAppInstallStep
        device={device}
        deviceToRestore={shouldRestoreApps && deviceToRestore ? deviceToRestore : undefined}
        setHeaderLoader={(hasLoader: boolean) => setHasAppLoader(hasLoader)}
        onComplete={(installedApps?: boolean) =>
          installedApps ? handleInstallRecommendedApplicationComplete() : handleAppStepComplete()
        }
        seedConfiguration={seedConfiguration}
      />
    ),
    [
      device,
      shouldRestoreApps,
      deviceToRestore,
      handleInstallRecommendedApplicationComplete,
      handleAppStepComplete,
      seedConfiguration,
    ],
  );

  return {
    defaultSteps,
    installStep,
    handleAppStepComplete,
  };
};

export default useCompanionSteps;
