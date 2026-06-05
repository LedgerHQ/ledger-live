import React from "react";
import { ScrollView } from "react-native";

import { Flex, Text } from "@ledgerhq/native-ui";

import FirstStepSyncOnboarding from "../FirstStepSyncOnboarding";
import SecondStepSyncOnboarding from "../SecondStepSyncOnboarding";

import { TrackScreen } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import DesyncOverlay from "~/screens/SyncOnboarding/DesyncOverlay";

import { SEED_STATE } from "../../types";
import type { TwoStepSyncOnboardingCompanionProps } from "./types";
import { useTwoStepSyncOnboardingCompanionViewModel } from "./useTwoStepSyncOnboardingCompanionViewModel";

/**
 * Component representing the synchronous companion step, which polls the current device state
 * to display correctly information about the onboarding to the user
 *
 * The desync alert message overlay is rendered from this component to better handle relative position
 * with the vertical timeline.
 */

const TwoStepSyncOnboardingCompanion: React.FC<TwoStepSyncOnboardingCompanionProps> = ({
  navigation,
  device,
  updateHeaderOverlayDelay,
  onShouldHeaderBeOverlaid,
  onLostDevice,
  notifyEarlySecurityCheckShouldReset,
}) => {
  const { t } = useTranslation();

  const {
    productName,
    scrollViewRef,
    analyticsSeedConfiguration,
    companionStep,
    setCompanionStep,
    isPollingOn,
    setIsPollingOn,
    twoStepDesync,
    handleSecondStepFinish,
  } = useTwoStepSyncOnboardingCompanionViewModel({
    navigation,
    device,
    updateHeaderOverlayDelay,
    onShouldHeaderBeOverlaid,
    onLostDevice,
  });

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
            handleFinishStep={(nextStep: SEED_STATE) => setCompanionStep(nextStep)}
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

export default TwoStepSyncOnboardingCompanion;
