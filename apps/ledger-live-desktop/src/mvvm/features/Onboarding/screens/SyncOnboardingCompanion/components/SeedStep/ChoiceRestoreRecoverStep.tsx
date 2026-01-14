import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, VerticalTimeline, Icons, ContinueOnDevice } from "@ledgerhq/react-ui";
import StepText from "LLD/features/Onboarding/components/StepText";
import SeedStepWrapper from "./SeedStepWrapper";

export type Props = {
  productName: string;
  deviceIcon: React.ComponentType<{ size: number; color?: string }>;
  charonSupported: boolean;
};

const ChoiceRestoreRecoverStep = ({ productName, deviceIcon, charonSupported }: Props) => {
  const { t } = useTranslation();

  return (
    <SeedStepWrapper testId="choice-restore-recover-step">
      <Flex flexDirection="column">
        {/* @ts-expect-error weird props issue with React 18 */}
        <StepText mb={6}>{t("syncOnboarding.manual.seedContent.restoreDescription")}</StepText>

        <Flex mb={8}>
          <Icons.Note size="M" color="white" />
          <Flex ml={5} flexDirection="column" flex={1}>
            {/* @ts-expect-error weird props issue with React 18 */}
            <VerticalTimeline.SubtitleText mb={2}>
              {t("syncOnboarding.manual.seedContent.restoreChoiceSRPTitle")}
            </VerticalTimeline.SubtitleText>
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText>
              {t("syncOnboarding.manual.seedContent.restoreChoiceSRPDescription")}
            </StepText>
          </Flex>
        </Flex>
        {charonSupported && (
          <Flex mb={8} data-testid="choice-restore-recover-charon">
            <Icons.RecoveryKey size="M" color="white" />

            <Flex ml={5} flexDirection="column" flex={1}>
              {/* @ts-expect-error weird props issue with React 18 */}
              <VerticalTimeline.SubtitleText mb={2}>
                {t("syncOnboarding.manual.seedContent.restoreChoiceCharonTitle")}
              </VerticalTimeline.SubtitleText>
              {/* @ts-expect-error weird props issue with React 18 */}
              <StepText>
                {t("syncOnboarding.manual.seedContent.restoreChoiceCharonDescription")}
              </StepText>
            </Flex>
          </Flex>
        )}

        <Flex mb={0}>
          <Icons.ShieldCheck size="M" color="white" />

          <Flex ml={5} flexDirection="column" flex={1}>
            {/* @ts-expect-error weird props issue with React 18 */}
            <VerticalTimeline.SubtitleText mb={2}>
              {t("syncOnboarding.manual.seedContent.restoreChoiceRecoverTitle")}
            </VerticalTimeline.SubtitleText>
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText>
              {t("syncOnboarding.manual.seedContent.restoreChoiceRecoverDescription")}
            </StepText>
          </Flex>
        </Flex>
        <ContinueOnDevice
          Icon={deviceIcon}
          text={t("syncOnboarding.manual.seedContent.restoreChoiceContinueOnDevice", {
            productName,
          })}
        />
      </Flex>
    </SeedStepWrapper>
  );
};

export default ChoiceRestoreRecoverStep;
