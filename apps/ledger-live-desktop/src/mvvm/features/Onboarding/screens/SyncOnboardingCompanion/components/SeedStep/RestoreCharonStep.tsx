import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, ContinueOnDevice } from "@ledgerhq/react-ui";
import { SubtitleText } from "LLD/features/Onboarding/components/VerticalTimeline";
import StepText from "LLD/features/Onboarding/components/StepText";
import SeedStepWrapper from "./SeedStepWrapper";

export type Props = {
  productName: string;
  deviceIcon: React.ComponentType<{ size: number; color?: string }>;
};

const RestoreCharonStep = ({ productName, deviceIcon }: Props) => {
  const { t } = useTranslation();

  return (
    <SeedStepWrapper testId="restore-charon-step">
      <Flex flexDirection="column">
        <SubtitleText>{t("syncOnboarding.manual.seedContent.restoreCharonTitle")}</SubtitleText>
        <StepText>{t("syncOnboarding.manual.seedContent.restoreCharonDescription")}</StepText>
        <ContinueOnDevice
          Icon={deviceIcon}
          text={t("syncOnboarding.manual.seedContent.restoreCharonContinueOnDevice", {
            productName,
          })}
        />
      </Flex>
    </SeedStepWrapper>
  );
};

export default RestoreCharonStep;
