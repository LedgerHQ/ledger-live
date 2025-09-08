import React, { useCallback, useEffect, useState } from "react";
import CollapsibleStep from "./CollapsibleStep";
import { useTranslation } from "react-i18next";
import InstallSetOfApps from "~/components/DeviceAction/InstallSetOfApps";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CompanionStep, COMPANION_STATE, SEED_STATE } from "./TwoStepSyncOnboardingCompanion";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import BackgroundBlue from "../assets/BackgroundBlue";
import { Box } from "@ledgerhq/native-ui";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LayoutChangeEvent } from "react-native";
import { SeedOriginType } from "@ledgerhq/types-live";

const ENTRY_TIMING = 300;
const ENTRY_OPACITY_TIMING = 400;
const EXIT_TIMING = 400;

const fallbackDefaultAppsToInstall = ["Bitcoin", "Ethereum", "Polygon"];

interface SecondStepSyncOnboardingProps {
  device: Device;
  companionStep: CompanionStep;
  isCollapsed: boolean;
  handleDone: (done: boolean) => void;
  analyticsSeedConfiguration: React.MutableRefObject<SeedOriginType | undefined>;
}

const SecondStepSyncOnboarding = ({
  device,
  companionStep,
  isCollapsed,
  handleDone,
  analyticsSeedConfiguration,
}: SecondStepSyncOnboardingProps) => {
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const { t } = useTranslation();
  const deviceInitialApps = useFeature("deviceInitialApps");
  const initialAppsToInstall = deviceInitialApps?.params?.apps || fallbackDefaultAppsToInstall;
  /*
   * Animation State
   */
  const sharedHeight = useSharedValue<number | null>(null);
  const sharedOpacity = useSharedValue<number>(0);
  const derivedOpacity = useDerivedValue(() => {
    return sharedOpacity.value / 100;
  });
  const animatedStyle = useAnimatedStyle(
    () => ({
      /**
       * If it's null the component still renders normally at its full height
       * without its height being derived from an animated value.
       */
      height: sharedHeight.value ?? 0,
    }),
    [sharedHeight],
  );
  const animatedOpacityStyle = useAnimatedStyle(
    () => ({
      opacity: derivedOpacity.value,
    }),
    [derivedOpacity],
  );

  const handleLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      sharedHeight.value = withTiming(layout.height, { duration: ENTRY_TIMING });
    },
    [sharedHeight],
  );

  const handleExit = useCallback(
    (done: boolean) => {
      if (!done || analyticsSeedConfiguration.current === "new_seed") return handleDone(done);

      setIsFinished(true);
      sharedHeight.value = withTiming(0, { duration: EXIT_TIMING });
      setTimeout(() => {
        handleDone(done);
      }, 800);
    },
    [handleDone, sharedHeight, setIsFinished, analyticsSeedConfiguration],
  );

  useEffect(() => {
    if (!isCollapsed) {
      sharedOpacity.value = withTiming(100, { duration: ENTRY_OPACITY_TIMING });
    } else {
      sharedOpacity.value = withTiming(0, { duration: EXIT_TIMING });
    }
  }, [isCollapsed, sharedOpacity]);

  return (
    <CollapsibleStep
      isCollapsed={isCollapsed}
      title={t("syncOnboarding.secureCryptoStep.title")}
      doneSubTitle={t("syncOnboarding.secureCryptoStep.doneSubTitle")}
      status={companionStep === COMPANION_STATE.EXIT || isFinished ? "complete" : "unfinished"}
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
          <Box mt={3}>
            <InstallSetOfApps
              isNewSeed={companionStep === SEED_STATE.NEW_SEED}
              restore={companionStep === SEED_STATE.RESTORE}
              device={device}
              onResult={handleExit}
              dependencies={initialAppsToInstall}
              seedConfiguration={analyticsSeedConfiguration.current}
            />
          </Box>
        </Animated.View>
      </Animated.ScrollView>
    </CollapsibleStep>
  );
};

export default SecondStepSyncOnboarding;
