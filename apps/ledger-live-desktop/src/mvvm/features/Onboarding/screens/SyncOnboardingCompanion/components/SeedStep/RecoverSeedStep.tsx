import React from "react";
import { useTranslation } from "react-i18next";
import StepText from "LLD/features/Onboarding/components/StepText";
import SeedStepWrapper from "./SeedStepWrapper";

const RecoverSeedStep = () => {
  const { t } = useTranslation();

  return (
    <SeedStepWrapper testId="recover-seed-step">
      {/* @ts-expect-error weird props issue with React 18 */}
      <StepText>{t("syncOnboarding.manual.seedContent.recoverSeed")}</StepText>
    </SeedStepWrapper>
  );
};

export default RecoverSeedStep;
