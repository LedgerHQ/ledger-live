import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, ContinueOnDevice } from "@ledgerhq/react-ui";
import { SubtitleText } from "LLD/features/Onboarding/components/VerticalTimeline";
import StepText from "LLD/features/Onboarding/components/StepText";
import SeedStepWrapper from "./SeedStepWrapper";

export type Props = {
  productName: string;
  deviceIcon: React.ComponentType<{ size: number; color?: string }>;
  charonSupported: boolean;
};

const SelectionStep = ({ productName, deviceIcon, charonSupported }: Props) => {
  const { t } = useTranslation();

  return (
    <SeedStepWrapper testId="selection-step">
      <Flex flexDirection="column">
        <StepText mb={6}>
          {t("syncOnboarding.manual.seedContent.selection", {
            productName,
          })}
        </StepText>
        <SubtitleText>
          {t("syncOnboarding.manual.seedContent.selectionNewLedgerTitle")}
        </SubtitleText>
        <StepText mb={6}>
          {t("syncOnboarding.manual.seedContent.selectionNewLedgerDescription")}
        </StepText>
        <SubtitleText>{t("syncOnboarding.manual.seedContent.selectionRestoreTitle")}</SubtitleText>
        <StepText>
          {charonSupported
            ? t("syncOnboarding.manual.seedContent.selectionRestoreDescriptionWithCharon")
            : t("syncOnboarding.manual.seedContent.selectionRestoreDescription")}
        </StepText>
        <ContinueOnDevice
          Icon={deviceIcon}
          text={t("syncOnboarding.manual.seedContent.selectionContinueOnDevice", {
            productName,
          })}
        />
      </Flex>
    </SeedStepWrapper>
  );
};

export default SelectionStep;
