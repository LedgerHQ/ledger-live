import React from "react";
import { Step, StepKey } from "./useCompanionSteps";
import { useTranslation } from "react-i18next";
import { Flex, VerticalTimeline } from "@ledgerhq/react-ui";
import CollapsibleStep from "LLD/features/Onboarding/screens/SyncOnboardingCompanion/components/CollapsibleStep";
import SuccessStep from "LLD/features/Onboarding/screens/SyncOnboardingCompanion/components/SuccessStep";
import SuccessBackground from "../assets/SuccessBackground";
import NewSeedPanel from "LLD/features/Onboarding/screens/SyncOnboardingCompanion/components/NewSeedPanel";
import { SeedOriginType } from "@ledgerhq/types-live";

interface TwoStepCompanionProps {
  steps: Step[];
  activeStepKey: StepKey;
  isNewSeed: boolean;
  installStep: React.JSX.Element;
  deviceName: string;
  handleComplete: () => void;
  seedConfiguration?: SeedOriginType;
}

const TwoStepCompanion = ({
  steps,
  activeStepKey,
  isNewSeed,
  installStep,
  deviceName,
  handleComplete,
  seedConfiguration,
}: TwoStepCompanionProps) => {
  const { t } = useTranslation();

  const isSecondStepActive = activeStepKey > StepKey.Seed;
  const isSuccess = activeStepKey === StepKey.Success;
  const hasFinishedSecondStep = activeStepKey > StepKey.Apps;
  const isReady = activeStepKey === StepKey.Ready;

  return (
    <Flex flexDirection="column" rowGap="12px">
      <CollapsibleStep
        isCollapsed={isSecondStepActive && !isSuccess}
        title={
          isSecondStepActive
            ? t("syncOnboarding.manual.titleFirstStepDone", { deviceName })
            : t("syncOnboarding.manual.title", { deviceName })
        }
        isComplete={isSecondStepActive || isSuccess}
        hideTitle={isSuccess}
        background={isSuccess ? <SuccessBackground /> : undefined}
      >
        {isSuccess ? (
          <SuccessStep deviceName={deviceName} />
        ) : (
          <VerticalTimeline steps={steps} isNeutral />
        )}
      </CollapsibleStep>
      <CollapsibleStep
        isCollapsed={!isSecondStepActive || isSuccess || isReady}
        title={t("syncOnboarding.manual.secureCryptoTitle")}
        doneTitle={isReady ? t("syncOnboarding.manual.secureCryptoDoneTitle") : undefined}
        isComplete={hasFinishedSecondStep}
      >
        {isNewSeed ? (
          <NewSeedPanel handleComplete={handleComplete} seedConfiguration={seedConfiguration} />
        ) : (
          installStep
        )}
      </CollapsibleStep>
    </Flex>
  );
};

export default TwoStepCompanion;
