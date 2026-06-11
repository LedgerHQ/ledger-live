import React from "react";
import { useTranslation } from "~/context/Locale";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { Flex, VerticalTimeline } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { FirstStepCompanionStepKey } from "../../types";
import CollapsibleStep from "../CollapsibleStep";
import { useFirstStepSyncOnboardingViewModel } from "./useFirstStepSyncOnboardingViewModel";
import { FirstStepSyncOnboardingProps } from "./types";
import DeviceSeededSuccessPanel from "../DeviceSeededSuccessPanel";
import BackgroundGreen from "../../assets/BackgroundGreen";

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
    activeStep,
    steps,
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
        activeStep <= FirstStepCompanionStepKey.Seed
          ? t("syncOnboarding.title", { productName })
          : t("syncOnboarding.firstStepReadyTitle", { productName })
      }
      status={activeStep >= FirstStepCompanionStepKey.Ready ? "complete" : "unfinished"}
      hideTitle={!isFinishedStep && activeStep === FirstStepCompanionStepKey.Ready}
      background={
        activeStep === FirstStepCompanionStepKey.Ready && !isFinishedStep ? (
          <Animated.View
            style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, animatedStyle]}
          >
            <BackgroundGreen />
          </Animated.View>
        ) : null
      }
    >
      {activeStep !== FirstStepCompanionStepKey.Ready && (
        <Flex mt={3}>
          <VerticalTimeline
            steps={steps}
            formatEstimatedTime={formatEstimatedTime}
            contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}
            parentScrollRef={parentRef}
          />
        </Flex>
      )}
      <Animated.ScrollView style={animatedStyle} showsVerticalScrollIndicator={false}>
        <Animated.View onLayout={handleLayout}>
          {activeStep === FirstStepCompanionStepKey.Ready && !isFinishedStep ? (
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
