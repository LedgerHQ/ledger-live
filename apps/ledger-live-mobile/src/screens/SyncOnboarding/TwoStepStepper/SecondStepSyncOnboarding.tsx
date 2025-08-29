import React, { useCallback, useState } from "react";
import CollapsibleStep from "./CollapsibleStep";
import { useTranslation } from "react-i18next";
import InstallSetOfApps from "~/components/DeviceAction/InstallSetOfApps";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CompanionStep } from "./TwoStepSyncOnboardingCompanion";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import BackgroundBlue from "../assets/BackgroundBlue";
import { Box } from "@ledgerhq/native-ui";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { LayoutChangeEvent } from "react-native";

const fallbackDefaultAppsToInstall = ["Bitcoin", "Ethereum", "Polygon"];

interface SecondStepSyncOnboardingProps {
  device: Device;
  companionStep: CompanionStep;
  isCollapsed: boolean;
  handleDone: (done: boolean) => void;
}

const SecondStepSyncOnboarding = ({
  device,
  companionStep,
  isCollapsed,
  handleDone,
}: SecondStepSyncOnboardingProps) => {
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const { t } = useTranslation();
  const deviceInitialApps = useFeature("deviceInitialApps");
  const initialAppsToInstall = deviceInitialApps?.params?.apps || fallbackDefaultAppsToInstall;
  /*
   * Animation State
   */
  const sharedHeight = useSharedValue<number | null>(null);
  const animatedStyle = useAnimatedStyle(
    () => ({
      /**
       * If it's null the component still renders normally at its full height
       * without its height being derived from an animated value.
       */
      height: sharedHeight.value ?? 0,
      opacity: interpolate(sharedHeight.value || 0, [0, 100], [0, 1], Extrapolation.CLAMP),
    }),
    [],
  );

  const handleLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      sharedHeight.value = withDelay(300, withTiming(layout.height, { duration: 300 }));
    },
    [sharedHeight],
  );

  const handleExit = useCallback(
    (done: boolean) => {
      setIsFinished(true);
      sharedHeight.value = withTiming(0, { duration: 400 });
      setTimeout(() => {
        handleDone(done);
      }, 800);
    },
    [handleDone, sharedHeight, setIsFinished],
  );

  return (
    <CollapsibleStep
      isCollapsed={isCollapsed}
      title={t("syncOnboarding.secureCryptoStep.title")}
      doneSubTitle={t("syncOnboarding.secureCryptoStep.doneSubTitle")}
      status={companionStep === "exit" || isFinished ? "complete" : "unfinished"}
      background={!isFinished ? <BackgroundBlue /> : null}
    >
      <Animated.ScrollView style={animatedStyle} showsVerticalScrollIndicator={false}>
        <Animated.View onLayout={handleLayout}>
          <Box mt={3}>
            <InstallSetOfApps
              isNewSeed={companionStep === "new_seed"}
              restore={companionStep === "restore"}
              device={device}
              onResult={handleExit}
              dependencies={initialAppsToInstall}
            />
          </Box>
        </Animated.View>
      </Animated.ScrollView>
    </CollapsibleStep>
  );
};

export default SecondStepSyncOnboarding;
