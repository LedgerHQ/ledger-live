import React from "react";
import CollapsibleStep from "./CollapsibleStep";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
// import { useDispatch } from "react-redux";
// import { ScreenName } from "~/const";
// import { SyncOnboardingScreenProps } from "../SyncOnboardingScreenProps";
// import { Device } from "@ledgerhq/live-common/hw/actions/types";
// import { CompanionStep } from "./TwoStepSyncOnboardingCompanion";

interface SecondStepSyncOnboardingProps {
  //   navigation: SyncOnboardingScreenProps["navigation"];
  //   device: Device;
  //   companionStep: CompanionStep;
  isCollapsed: boolean;
}

const SecondStepSyncOnboarding = ({
  //   navigation,
  //   device,
  //   companionStep,
  isCollapsed,
}: SecondStepSyncOnboardingProps) => {
  const { t } = useTranslation();

  return (
    <CollapsibleStep
      isCollapsed={isCollapsed}
      title={t("syncOnboarding.secureCryptoStep.title")}
      status="unfinished"
    >
      <Flex>
        <Text>OPEN SECOND STEP</Text>
      </Flex>
    </CollapsibleStep>
  );
};

export default SecondStepSyncOnboarding;
