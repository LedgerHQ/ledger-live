import React from "react";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Flex, VerticalTimeline } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import { FirstStepCompanionStepKey } from "~/screens/SyncOnboarding/TwoStepStepper/types";
import BackgroundGreen from "LLM/features/Onboarding/screens/SyncOnboardingCompanion/assets/BackgroundGreen";
import CollapsibleStep from "LLM/features/Onboarding/screens/SyncOnboardingCompanion/components/CollapsibleStep";
import DeviceSeededSuccessPanel from "./DeviceSeededSuccessPanel";
import {
  FirstStepSyncOnboardingProps,
  useFirstStepSyncOnboardingViewModel,
} from "./useFirstStepSyncOnboardingViewModel";

const FirstStepSyncOnboarding = ({
  device,
  productName,
  navigation,
  onLostDevice,
  handleSeedGenerationDelay,
  notifyEarlySecurityCheckShouldReset,
  handlePollingError,
  isPollingOn,
  setIsPollingOn,
  handleFinishStep,
  parentRef,
  analyticsSeedConfiguration,
}: FirstStepSyncOnboardingProps) => {
  const { t } = useTranslation();
  const safeAreaInsets = useSafeAreaInsets();

  const {
    companionSteps,
    hasFinishedExitAnimation,
    isFinishedStep,
    formatEstimatedTime,
    animatedStyle,
    handleLayout,
    handleNextStep,
  } = useFirstStepSyncOnboardingViewModel({
    device,
    productName,
    navigation,
    onLostDevice,
    handleSeedGenerationDelay,
    notifyEarlySecurityCheckShouldReset,
    handlePollingError,
    isPollingOn,
    setIsPollingOn,
    handleFinishStep,
    parentRef,
    analyticsSeedConfiguration,
  });

  return (
    <CollapsibleStep
      isFirst
      isCollapsed={hasFinishedExitAnimation}
      title={
        companionSteps.activeStep <= FirstStepCompanionStepKey.Seed
          ? t("syncOnboarding.title", { productName })
          : t("syncOnboarding.firstStepReadyTitle", { productName })
      }
      status={
        companionSteps.activeStep >= FirstStepCompanionStepKey.Ready ? "complete" : "unfinished"
      }
      hideTitle={!isFinishedStep && companionSteps.activeStep === FirstStepCompanionStepKey.Ready}
      background={
        companionSteps.activeStep === FirstStepCompanionStepKey.Ready && !isFinishedStep ? (
          <Animated.View
            style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, animatedStyle]}
          >
            <BackgroundGreen />
          </Animated.View>
        ) : null
      }
    >
      {companionSteps.activeStep !== FirstStepCompanionStepKey.Ready && (
        <Flex mt={3}>
          <VerticalTimeline
            steps={companionSteps.steps}
            formatEstimatedTime={formatEstimatedTime}
            contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}
            parentScrollRef={parentRef}
          />
        </Flex>
      )}
      <Animated.ScrollView style={animatedStyle} showsVerticalScrollIndicator={false}>
        <Animated.View onLayout={handleLayout}>
          {companionSteps.activeStep === FirstStepCompanionStepKey.Ready && !isFinishedStep ? (
            <>
              <TrackScreen
                category="Set up device: Final Step Your device is ready"
                flow="onboarding"
                seedConfiguration={analyticsSeedConfiguration.current}
              />

              <DeviceSeededSuccessPanel handleNextStep={handleNextStep} productName={productName} />
            </>
          ) : null}
        </Animated.View>
      </Animated.ScrollView>
    </CollapsibleStep>
  );
};

export default FirstStepSyncOnboarding;
