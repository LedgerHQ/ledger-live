import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, VerticalTimeline, ContinueOnDevice } from "@ledgerhq/react-ui";
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
        {/* @ts-expect-error weird props issue with React 18 */}
        <StepText mb={6}>
          {t("syncOnboarding.manual.seedContent.selection", {
            productName,
          })}
        </StepText>
        {/* @ts-expect-error weird props issue with React 18 */}
        <VerticalTimeline.SubtitleText>
          {t("syncOnboarding.manual.seedContent.selectionNewLedgerTitle")}
        </VerticalTimeline.SubtitleText>
        {/* @ts-expect-error weird props issue with React 18 */}
        <StepText mb={6}>
          {t("syncOnboarding.manual.seedContent.selectionNewLedgerDescription")}
        </StepText>
        {/* @ts-expect-error weird props issue with React 18 */}
        <VerticalTimeline.SubtitleText>
          {t("syncOnboarding.manual.seedContent.selectionRestoreTitle")}
        </VerticalTimeline.SubtitleText>
        {/* @ts-expect-error weird props issue with React 18 */}
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
