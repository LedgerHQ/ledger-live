import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, ContinueOnDevice } from "@ledgerhq/react-ui";
import { SubtitleText } from "LLD/features/Onboarding/components/VerticalTimeline";
import StepText from "LLD/features/Onboarding/components/StepText";
import SecretRecoveryPhrasePng from "../../assets/secret-recovery-phrase.png";
import SeedStepWrapper from "./SeedStepWrapper";

export type Props = {
  productName: string;
  deviceIcon: React.ComponentType<{ size: number; color?: string }>;
};

const NewSeedStep = ({ productName, deviceIcon }: Props) => {
  const { t } = useTranslation();

  return (
    <SeedStepWrapper testId="new-seed-step">
      <Flex flexDirection="column">
        <Flex alignItems="center" justifyContent="center" flexDirection="column">
          <Flex
            style={{
              width: 220,
              height: 150,
              overflow: "visible",
              justifyContent: "center",
            }}
          >
            <img
              src={SecretRecoveryPhrasePng}
              alt="Secret Recovery Phrase"
              style={{ height: 220, objectFit: "contain" }}
            />
          </Flex>
          <StepText
            mb={6}
            fontWeight="semiBold"
            variant="largeLineHeight"
            color="neutral.c100"
            textAlign="center"
          >
            {t("syncOnboarding.manual.seedContent.selectionNewSeedTitle")}
          </StepText>
          <SubtitleText textAlign="center">
            {t("syncOnboarding.manual.seedContent.selectionNewSeedSubtitle")}
          </SubtitleText>
          <StepText mb={6} justifyContent={"center"} textAlign="center">
            {t("syncOnboarding.manual.seedContent.selectionNewSeedDescription")}
          </StepText>
        </Flex>
        <ContinueOnDevice
          Icon={deviceIcon}
          text={t("syncOnboarding.manual.seedContent.selectionNewSeedContinueOnDevice", {
            productName,
          })}
        />
      </Flex>
    </SeedStepWrapper>
  );
};

export default NewSeedStep;
