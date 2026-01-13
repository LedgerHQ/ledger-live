import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, VerticalTimeline, ContinueOnDevice } from "@ledgerhq/react-ui";
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
        {/* @ts-expect-error weird props issue with React 18 */}
        <VerticalTimeline.SubtitleText>
          {t("syncOnboarding.manual.seedContent.restoreCharonTitle")}
        </VerticalTimeline.SubtitleText>
        {/* @ts-expect-error weird props issue with React 18 */}
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
