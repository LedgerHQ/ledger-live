import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { ScrollView } from "react-native";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import DesyncOverlay from "~/screens/SyncOnboarding/DesyncOverlay";
import FirstStepSyncOnboarding from "../FirstStepSyncOnboarding";
import SecondStepSyncOnboarding from "../SecondStepSyncOnboarding";
import { SEED_STATE } from "../../types";
import {
  useTwoStepSyncOnboardingCompanionViewModel,
  type TwoStepSyncOnboardingCompanionViewProps,
} from "./useTwoStepSyncOnboardingCompanionViewModel";
import type { TwoStepSyncOnboardingCompanionProps } from "./types";

const View = ({
  device,
  navigation,
  productName,
  companionStep,
  isPollingOn,
  setIsPollingOn,
  scrollViewRef,
  analyticsSeedConfiguration,
  notifyEarlySecurityCheckShouldReset,
  onLostDevice,
  twoStepDesync,
  handleFinishFirstStep,
  handleSecondStepFinish,
}: TwoStepSyncOnboardingCompanionViewProps) => {
  const { t } = useTranslation();

  return (
    <Flex position="relative" flex={1} px={6}>
      <DesyncOverlay
        isOpen={twoStepDesync.isDesyncOverlayOpen}
        delay={twoStepDesync.desyncOverlayDisplayDelayMs}
        productName={productName}
      />
      <ScrollView showsVerticalScrollIndicator={false} ref={scrollViewRef}>
        <Flex paddingBottom={10}>
          <Text variant="h4" fontWeight="semiBold">
            {t("syncOnboarding.twoStepTitle")}
          </Text>
          <FirstStepSyncOnboarding
            device={device}
            productName={productName}
            navigation={navigation}
            onLostDevice={onLostDevice}
            handleSeedGenerationDelay={twoStepDesync.handleSeedGenerationDelay}
            notifyEarlySecurityCheckShouldReset={notifyEarlySecurityCheckShouldReset}
            handlePollingError={twoStepDesync.handlePollingError}
            handleFinishStep={handleFinishFirstStep}
            isPollingOn={isPollingOn}
            setIsPollingOn={setIsPollingOn}
            parentRef={scrollViewRef}
            analyticsSeedConfiguration={analyticsSeedConfiguration}
          />
          <SecondStepSyncOnboarding
            companionStep={companionStep}
            device={device}
            handleDone={handleSecondStepFinish}
            analyticsSeedConfiguration={analyticsSeedConfiguration}
          />
          {companionStep === SEED_STATE.NEW_SEED || companionStep === SEED_STATE.RESTORE ? (
            <TrackScreen
              category="Set up device: Secure your crypto"
              flow="onboarding"
              seedConfiguration={analyticsSeedConfiguration.current}
            />
          ) : null}
        </Flex>
      </ScrollView>
    </Flex>
  );
};

const TwoStepSyncOnboardingCompanion: React.FC<TwoStepSyncOnboardingCompanionProps> = props => (
  <View {...useTwoStepSyncOnboardingCompanionViewModel(props)} />
);

export default TwoStepSyncOnboardingCompanion;
