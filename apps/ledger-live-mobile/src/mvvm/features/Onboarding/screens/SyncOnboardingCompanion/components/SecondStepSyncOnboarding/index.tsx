import React from "react";
import Animated from "react-native-reanimated";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { COMPANION_STATE, SEED_STATE } from "~/screens/SyncOnboarding/TwoStepStepper/types";
import BackgroundBlue from "LLM/features/Onboarding/screens/SyncOnboardingCompanion/assets/BackgroundBlue";
import CollapsibleStep from "LLM/features/Onboarding/screens/SyncOnboardingCompanion/components/CollapsibleStep";
import NewSeedPanel from "LLM/features/Onboarding/screens/SyncOnboardingCompanion/components/NewSeedPanel";
import InstallSetOfApps from "~/components/DeviceAction/InstallSetOfApps";
import { useSecondStepSyncOnboardingViewModel } from "./useSecondStepSyncOnboardingViewModel";
import { SecondStepSyncOnboardingProps } from "./types";

const SecondStepSyncOnboarding = ({
  device,
  companionStep,
  handleDone,
  analyticsSeedConfiguration,
}: SecondStepSyncOnboardingProps) => {
  const { t } = useTranslation();

  const {
    animatedStyle,
    animatedOpacityStyle,
    isFinished,
    handleLayout,
    handleExit,
    initialAppsToInstall,
  } = useSecondStepSyncOnboardingViewModel({
    companionStep,
    handleDone,
    analyticsSeedConfiguration,
  });

  return (
    <CollapsibleStep
      showDoneSubtitle={isFinished}
      isCollapsed={
        companionStep === COMPANION_STATE.SETUP || companionStep === COMPANION_STATE.EXIT
      }
      title={t("syncOnboarding.secureCryptoStep.title")}
      doneSubTitle={t("syncOnboarding.secureCryptoStep.doneSubTitle")}
      status={isFinished || companionStep === COMPANION_STATE.EXIT ? "complete" : "unfinished"}
      background={
        isFinished ? null : (
          <Animated.View
            style={[
              { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
              animatedOpacityStyle,
            ]}
          >
            <BackgroundBlue />
          </Animated.View>
        )
      }
    >
      <Animated.ScrollView style={animatedStyle} showsVerticalScrollIndicator={false}>
        <Animated.View onLayout={handleLayout}>
          <Box lx={{ marginTop: isFinished ? "s0" : "s4" }}>
            {companionStep === SEED_STATE.NEW_SEED ? (
              <NewSeedPanel
                handlePress={handleExit}
                seedConfiguration={analyticsSeedConfiguration.current ?? undefined}
              />
            ) : (
              <InstallSetOfApps
                restore={companionStep === SEED_STATE.RESTORE}
                device={device}
                onResult={handleExit}
                dependencies={initialAppsToInstall}
                seedConfiguration={analyticsSeedConfiguration.current ?? undefined}
              />
            )}
          </Box>
        </Animated.View>
      </Animated.ScrollView>
    </CollapsibleStep>
  );
};

export default SecondStepSyncOnboarding;
