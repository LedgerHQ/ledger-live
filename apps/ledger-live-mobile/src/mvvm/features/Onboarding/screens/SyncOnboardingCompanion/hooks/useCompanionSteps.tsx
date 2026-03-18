import React, { useState, ReactNode, useMemo, useRef } from "react";
import { useTranslation } from "~/context/Locale";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { OnboardingState } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { Flex, Text, VerticalTimeline } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { TrackScreen } from "~/analytics";
import { SeedOriginType } from "@ledgerhq/types-live";
import BackgroundBlue from "../assets/BackgroundBlue";
import BackgroundRed from "../assets/BackgroundRed";
import ContinueOnDeviceWithAnim from "~/screens/SyncOnboarding/TwoStepStepper/ContinueOnDeviceWithAnim";
import SeedCompanionStep from "~/screens/SyncOnboarding/TwoStepStepper/SeedCompanionStep";
import {
  SeedPathStatus,
  FirstStepCompanionStepKey,
} from "~/screens/SyncOnboarding/TwoStepStepper/types";
import LedgerSyncActivationStep from "~/screens/SyncOnboarding/TwoStepStepper/LedgerSyncActivationStep";

const { BodyText } = VerticalTimeline;

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
  deviceOnboardingState: OnboardingState | null;
  analyticsSeedConfiguration: React.RefObject<SeedOriginType | undefined>;
}

interface UseCompanionStepsReturn {
  steps: Step[];
  activeStep: FirstStepCompanionStepKey;
  setStep: (step: FirstStepCompanionStepKey) => void;
  hasSyncStep: boolean;
  isLedgerSyncActive: boolean;
}

const useCompanionSteps = ({
  device,
  productName,
  seedPathStatus,
  deviceOnboardingState,
  analyticsSeedConfiguration,
}: UseCompanionStepsProps): UseCompanionStepsReturn => {
  const { t } = useTranslation();
  const llmOnboardingEnableSync = useFeature("llmOnboardingEnableSync");
  const isSyncStepEnabled = Boolean(
    llmOnboardingEnableSync?.enabled && llmOnboardingEnableSync?.params?.touchscreens,
  );

  /*
   * Local State
   */
  const [companionStepKey, setCompanionStepKey] = useState<FirstStepCompanionStepKey>(
    FirstStepCompanionStepKey.EarlySecurityCheckCompleted,
  );
  const isLedgerSyncActive = Boolean(useSelector(trustchainSelector)?.rootId);
  const isLedgerSyncActiveAtStart = useRef(isLedgerSyncActive);

  const hasSyncStep = !isLedgerSyncActiveAtStart.current && isSyncStepEnabled;

  const steps = useMemo(() => {
    let seedBackground: null | React.ReactNode = null;
    if (seedPathStatus === "new_seed") seedBackground = <BackgroundBlue />;
    if (seedPathStatus === "backup_charon") seedBackground = <BackgroundRed />;

    const steps: Array<
      Omit<Step, "status"> & {
        status?: Step["status"];
        isNeutral?: boolean;
        background?: React.JSX.Element | null;
      }
    > = [
      {
        key: FirstStepCompanionStepKey.EarlySecurityCheckCompleted,
        title: t("syncOnboarding.earlySecurityCheckCompletedStep.title", { productName }),
        renderBody: () => (
          <>
            <TrackScreen category={"Set up device: Step 1 device paired"} flow="onboarding" />
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
            <TrackScreen category={"Set up device: Step 2 PIN"} flow="onboarding" />
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
        isNeutral: true,
        background: seedBackground,
        renderBody: () => (
          <SeedCompanionStep
            productName={productName}
            device={device}
            seedPathStatus={seedPathStatus}
            charonSupported={deviceOnboardingState?.charonSupported}
            charonStatus={deviceOnboardingState?.charonStatus}
          />
        ),
      },
    ];

    if (hasSyncStep) {
      steps.push({
        key: FirstStepCompanionStepKey.Sync,
        title: t("syncOnboarding.syncStep.title"),
        doneTitle: t("syncOnboarding.syncStep.doneTitle"),
        isNeutral: true,
        background: null,
        status: isLedgerSyncActive ? "completed" : undefined,
        renderBody: () => (
          <LedgerSyncActivationStep
            handleContinue={() => setCompanionStepKey(FirstStepCompanionStepKey.Ready)}
            isLedgerSyncActive={isLedgerSyncActive}
            device={device}
            analyticsSeedConfiguration={analyticsSeedConfiguration}
          />
        ),
      });
    }

    return steps.map(step => {
      let status = step.status;
      if (!step.status) {
        if (step.key > companionStepKey) {
          status = "inactive";
        } else if (step.key < companionStepKey) {
          status = "completed";
        } else {
          status = "active";
        }
      }
      return {
        ...step,
        status: status!,
      };
    });
  }, [
    device,
    companionStepKey,
    deviceOnboardingState,
    productName,
    seedPathStatus,
    t,
    isLedgerSyncActive,
    hasSyncStep,
    analyticsSeedConfiguration,
  ]);

  return {
    steps,
    activeStep: companionStepKey,
    setStep: setCompanionStepKey,
    hasSyncStep,
    isLedgerSyncActive,
  };
};

export default useCompanionSteps;
