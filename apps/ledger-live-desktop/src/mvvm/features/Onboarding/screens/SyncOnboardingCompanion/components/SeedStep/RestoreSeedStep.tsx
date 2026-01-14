import React from "react";
import { useTranslation } from "react-i18next";
import { ContinueOnDevice } from "@ledgerhq/react-ui";
import StepText from "LLD/features/Onboarding/components/StepText";
import SeedStepWrapper from "./SeedStepWrapper";

export type Props = {
  productName: string;
  deviceIcon: React.ComponentType<{ size: number; color?: string }>;
};

const RestoreSeedStep = ({ productName, deviceIcon }: Props) => {
  const { t } = useTranslation();

  return (
    <SeedStepWrapper testId="restore-seed-step">
      {/* @ts-expect-error weird props issue with React 18 */}
      <StepText>{t("syncOnboarding.manual.seedContent.restoreSeed", { productName })}</StepText>
      <ContinueOnDevice
        Icon={deviceIcon}
        text={t("syncOnboarding.manual.seedContent.followInstructions", { productName })}
      />
    </SeedStepWrapper>
  );
};

export default RestoreSeedStep;
