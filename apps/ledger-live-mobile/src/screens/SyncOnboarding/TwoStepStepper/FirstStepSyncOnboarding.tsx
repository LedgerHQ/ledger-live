import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Flex, VerticalTimeline } from "@ledgerhq/native-ui";
import CollapsibleStep from "./CollapsibleStep";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import useCompanionSteps from "./useCompanionSteps";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { SyncOnboardingScreenProps } from "../SyncOnboardingScreenProps";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector, useDispatch } from "~/context/store";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { isAllowedOnboardingStatePollingErrorDmk } from "@ledgerhq/live-dmk-mobile";
import { SeedOriginType, SeedPhraseType } from "@ledgerhq/types-live";
import { setIsReborn, setLastConnectedDevice, setOnboardingHasDevice } from "~/actions/settings";
import { addKnownDevice } from "~/actions/ble";
import { screen, TrackScreen } from "~/analytics";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import {
  OnboardingStep as DeviceOnboardingStep,
  fromSeedPhraseTypeToNbOfSeedWords,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import useFirstStepCompanionState from "./useFirstStepCompanionState";
import { useTrackOnboardingFlow } from "~/analytics/hooks/useTrackOnboardingFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import DeviceSeededSuccessPanel from "./DeviceSeededSuccessPanel";
import BackgroundGreen from "../assets/BackgroundGreen";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LayoutChangeEvent, ScrollView } from "react-native";
import { SEED_STATE, SeedPathStatus, FirstStepCompanionStepKey } from "./types";

/*
 * Constants
 */

const POLLING_PERIOD_MS = 1000;
const OPACITY_DURATION = 400;

const fromSeedPhraseTypeToAnalyticsPropertyString = new Map<SeedPhraseType, string>([
  [SeedPhraseType.TwentyFour, "TwentyFour"],
  [SeedPhraseType.Eighteen, "Eighteen"],
  [SeedPhraseType.Twelve, "Twelve"],
]);

/*
 * Types
 */

interface FirstStepSyncOnboardingProps {
  device: Device;
  productName: string;
  navigation: SyncOnboardingScreenProps["navigation"];
  handleSeedGenerationDelay: () => void;
  /**
   * Called when the polling from the companion component has definitely lost/is desync with the device
   */
  onLostDevice: () => void;
  /**
   * Called by the companion component to force a reset of the entire sync onboarding because the device is not in a correct state anymore
   */
  notifyEarlySecurityCheckShouldReset: () => void;
  /*
   * set or clean timeout of desync based on device connection errors
   */
  handlePollingError: (error: Error | null) => void;
  // Polling state
  isPollingOn: boolean;
  setIsPollingOn: (isPolling: boolean) => void;
  handleFinishStep: (nextStep: SEED_STATE) => void;
  parentRef: null | React.RefObject<ScrollView>;
  analyticsSeedConfiguration: React.MutableRefObject<SeedOriginType | undefined>;
}

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

  /*
   * Local State
   */

  const [seedPathStatus, setSeedPathStatus] = useState<SeedPathStatus>("choice_new_or_restore");
  const [hasFinishedExitAnimation, setHasFinishedExitAnimation] = useState<boolean>(false);
  const [isFinishedStep, setIsFinishedStep] = useState<boolean>(false);

  /*
   * Feature Flags
   */
  const servicesConfig = useFeature("protectServicesMobile");

  /*
   * Refs
   */
  const lastCompanionStepKey = useRef<FirstStepCompanionStepKey>();
  const analyticsSeedingTracked = useRef(false);
  const addedToKnownDevices = useRef(false);

  /**
   * True if the device was initially onboarded/seeded when this component got
   * mounted. False otherwise.
   * Value is undefined until the onboarding state polling returns a first
   * result.
   * */
  const deviceInitiallyOnboarded = useRef<boolean>();
  /**
   * Variable holding the seed phrase type (number of words) until we are
   * ready to track the event (when the seeding step finishes).
   * Should only be maintained if the device is not onboarded/not seeded as the
   * onboarding flags can only be trusted for a non-onboarded device.
   */
  const analyticsSeedPhraseType = useRef<SeedPhraseType>();

  /*
   * Redux State
   */
  const dispatchRedux = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

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
      height: sharedHeight.value ?? undefined,
      opacity: derivedOpacity.value, // interpolate(sharedOpacity.value, [0, 100], [0, 1], Extrapolation.CLAMP),
    }),
    [sharedHeight.value, derivedOpacity.value],
  );

  /*
   * Custom hooks
   */
  const {
    onboardingState: deviceOnboardingState,
    allowedError,
    fatalError,
  } = useOnboardingStatePolling({
    device,
    pollingPeriodMs: POLLING_PERIOD_MS,
    stopPolling: !isPollingOn,
    allowedErrorChecks: [isAllowedOnboardingStatePollingErrorDmk],
  });

  const companionSteps = useCompanionSteps({
    device,
    productName,
    seedPathStatus,
    deviceOnboardingState,
  });

  // Destructure for useEffect dependency
  const { setStep } = companionSteps;

  // Sets the state which is active based on device response
  useFirstStepCompanionState({
    deviceOnboardingState,
    setCompanionStep: setStep,
    notifyEarlySecurityCheckShouldReset,
    setSeedPathStatus,
    analyticsSeedConfiguration,
    activeStep: companionSteps.activeStep,
  });

  useTrackOnboardingFlow({
    location: HOOKS_TRACKING_LOCATIONS.onboardingFlow,
    device,
    seedPathStatus,
  });

  /*
   * Callbacks
   */
  const handleLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      sharedHeight.value = layout.height;
    },
    [sharedHeight],
  );

  const formatEstimatedTime = useCallback(
    (estimatedTime: number) =>
      t("syncOnboarding.estimatedTimeFormat", {
        estimatedTime: estimatedTime / 60,
      }),
    [t],
  );

  /**
   * Adds the device to the list of known devices
   */
  const addToKnownDevices = useCallback(() => {
    dispatchRedux(setLastConnectedDevice(device));
    dispatchRedux(
      addKnownDevice({
        id: device.deviceId,
        name: device.deviceName ?? device.modelId,
        modelId: device.modelId,
      }),
    );
  }, [device, dispatchRedux]);

  const handleNextStep = useCallback(() => {
    sharedHeight.value = withTiming(0, { duration: 400 });
    handleFinishStep(
      analyticsSeedConfiguration.current === SEED_STATE.NEW_SEED
        ? SEED_STATE.NEW_SEED
        : SEED_STATE.RESTORE,
    );
    setIsFinishedStep(true);
    setTimeout(() => {
      setStep(FirstStepCompanionStepKey.Exit);
      setIsFinishedStep(false);
      setHasFinishedExitAnimation(true);
    }, 400);
  }, [
    handleFinishStep,
    setStep,
    sharedHeight,
    analyticsSeedConfiguration,
    setHasFinishedExitAnimation,
  ]);

  /*
   * useEffects
   * Divided into three lifecycle events as logic is complex
   */

  /*
   * Initial effects
   */

  /**
   * Analytics: track complete seeding of device
   * We use useLayoutEffect to ensure the event is sent before the following
   * step gets rendered and its corresponding analytics event gets dispatched
   */
  useLayoutEffect(() => {
    if (
      deviceInitiallyOnboarded.current === false && // can't just use ! operator because value can be undefined
      lastCompanionStepKey.current !== undefined &&
      lastCompanionStepKey.current <= FirstStepCompanionStepKey.Seed &&
      companionSteps.activeStep === FirstStepCompanionStepKey.Seed &&
      !analyticsSeedingTracked.current &&
      (seedPathStatus === "backup_charon" ||
        (seedPathStatus === "restore_charon" && deviceOnboardingState?.isOnboarded))
    ) {
      /**
       * Now we have four ways to seed a device:
       * - new seed => Backup Recovery Key
       * - restore using Secret Recovery Phrase => Backup Recovery Key
       * - restore using Recovery Key => Next step
       * - restore using Recover subscription => Backup Recovery Key
       * Three of them will trigger the Backup Recovery Key step, but the last one
       * will trigger directly the install apps step, so its tracking is treated separately.
       */
      screen(
        "Set up device: Step 3 Seed Success",
        undefined,
        {
          seedPhraseType: analyticsSeedPhraseType.current
            ? fromSeedPhraseTypeToAnalyticsPropertyString.get(analyticsSeedPhraseType.current)
            : undefined,
          seedConfiguration: analyticsSeedConfiguration.current,
          flow: "onboarding",
        },
        true,
        true,
      );

      analyticsSeedingTracked.current = true;
    }
    lastCompanionStepKey.current = companionSteps.activeStep;
  }, [
    companionSteps.activeStep,
    deviceOnboardingState?.isOnboarded,
    productName,
    seedPathStatus,
    analyticsSeedConfiguration,
  ]);

  /*
   * Main effects
   */
  useEffect(() => {
    if (!deviceOnboardingState) return;

    if (deviceInitiallyOnboarded.current === undefined) {
      deviceInitiallyOnboarded.current = deviceOnboardingState.isOnboarded;
    }

    if (
      !deviceOnboardingState.isOnboarded && // onboarding state flags can only be trusted for a non-onboarded/non-seeded device
      deviceOnboardingState.seedPhraseType
    ) {
      analyticsSeedPhraseType.current = deviceOnboardingState.seedPhraseType;
    }
  }, [deviceOnboardingState]);

  useEffect(() => {
    if (!fatalError) {
      return;
    }
    setIsPollingOn(false);
    onLostDevice();
  }, [fatalError, onLostDevice, setIsPollingOn]);

  useEffect(() => {
    const cleanupFunction = handlePollingError(allowedError);

    return cleanupFunction;
  }, [allowedError, handlePollingError]);

  useEffect(() => {
    if (seedPathStatus === "recover_seed" && servicesConfig?.enabled) {
      navigation.navigate(NavigatorName.Base, {
        screen: ScreenName.Recover,
        params: {
          fromOnboarding: true,
          device,
          platform: servicesConfig.params?.protectId,
          redirectTo: "restore",
          date: new Date().toISOString(), // adding a date to reload the page in case of same device restored again
        },
      });
    }
  }, [
    device,
    navigation,
    seedPathStatus,
    servicesConfig?.enabled,
    servicesConfig?.params?.protectId,
  ]);

  useEffect(() => {
    if (companionSteps.activeStep > FirstStepCompanionStepKey.Ready) {
      // Stops the polling once the device is seeded
      setIsPollingOn(false);
      // At this step, device has been successfully setup so it can be saved in
      // the list of known devices
      dispatchRedux(setIsReborn(false));
      if (!hasCompletedOnboarding) {
        dispatchRedux(setOnboardingHasDevice(true));
      }
      if (!addedToKnownDevices.current) {
        addedToKnownDevices.current = true;
        addToKnownDevices();
      }
    }
  }, [
    companionSteps.activeStep,
    addToKnownDevices,
    dispatchRedux,
    hasCompletedOnboarding,
    setIsPollingOn,
  ]);

  // When the user gets close to the seed generation step, sets the lost synchronization delay
  // and timers to a higher value. It avoids having a warning message while the connection is lost
  // because the device is generating the seed.
  useEffect(() => {
    if (
      deviceOnboardingState?.seedPhraseType &&
      [DeviceOnboardingStep.NewDeviceConfirming, DeviceOnboardingStep.RestoreSeed].includes(
        deviceOnboardingState?.currentOnboardingStep,
      )
    ) {
      const nbOfSeedWords = fromSeedPhraseTypeToNbOfSeedWords.get(
        deviceOnboardingState.seedPhraseType,
      );

      if (nbOfSeedWords && deviceOnboardingState?.currentSeedWordIndex >= nbOfSeedWords - 2) {
        handleSeedGenerationDelay();
      }
    }
  }, [deviceOnboardingState, handleSeedGenerationDelay]);

  // Handle delay for animation to success step

  useEffect(() => {
    if (parentRef?.current && companionSteps.activeStep === FirstStepCompanionStepKey.Seed) {
      // Without timeout the component has not expanded yet on scroll
      const timer = setTimeout(() => parentRef.current?.scrollToEnd({ animated: true }), 300);
      return () => clearTimeout(timer);
    }
  }, [companionSteps.activeStep, parentRef]);

  /*
   * Exit effects
   */

  // Unmount cleanup to make sure the polling is stopped.
  // The cleanup function triggered by the useEffect of useOnboardingStatePolling
  // has been observed to be called after, and some apdu could still be exchanged with the device
  useEffect(() => {
    return () => {
      setIsPollingOn(false);
    };
  }, [setIsPollingOn]);

  const showSuccess = companionSteps.activeStep === FirstStepCompanionStepKey.Ready;

  useEffect(() => {
    if (showSuccess) {
      sharedOpacity.value = withTiming(100, { duration: OPACITY_DURATION });
    }
  }, [showSuccess, sharedOpacity]);

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
        showSuccess && !isFinishedStep ? (
          <Animated.View
            style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, animatedStyle]}
          >
            <BackgroundGreen />
          </Animated.View>
        ) : null
      }
    >
      {!showSuccess && (
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
          {showSuccess ? (
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
