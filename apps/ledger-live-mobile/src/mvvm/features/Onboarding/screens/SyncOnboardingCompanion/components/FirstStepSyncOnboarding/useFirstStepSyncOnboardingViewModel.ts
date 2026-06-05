import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useIsFocused } from "@react-navigation/core";
import { useFeature } from "@features/platform-feature-flags";
import {
  OnboardingStep,
  fromSeedPhraseTypeToNbOfSeedWords,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { isAllowedOnboardingStatePollingErrorDmk } from "@ledgerhq/live-dmk-mobile";
import { SeedPhraseType } from "@ledgerhq/types-live";
import { addKnownBleDevice } from "~/actions/ble";
import { setIsReborn, setLastConnectedDevice, setOnboardingHasDevice } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { NavigatorName, ScreenName } from "~/const";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { FirstStepCompanionStepKey, SEED_STATE } from "../../types";
import useFirstStepCompanionState from "~/screens/SyncOnboarding/TwoStepStepper/useFirstStepCompanionState";
import useCompanionSteps from "../../hooks/useCompanionSteps";
import { screen } from "~/analytics";
import { useTrackOnboardingFlow } from "~/analytics/hooks/useTrackOnboardingFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { SeedPathStatus, UseFirstStepSyncOnboardingViewModelProps } from "./types";
import { addKnownDevice, mapDeviceToKnownDevice } from "~/reducers/knownDevices";

const POLLING_PERIOD_MS = 1000;
const OPACITY_DURATION = 400;

const fromSeedPhraseTypeToAnalyticsPropertyString = new Map<SeedPhraseType, string>([
  [SeedPhraseType.TwentyFour, "TwentyFour"],
  [SeedPhraseType.Eighteen, "Eighteen"],
  [SeedPhraseType.Twelve, "Twelve"],
]);

export const useFirstStepSyncOnboardingViewModel = ({
  device,
  productName,
  navigation,
  handleSeedGenerationDelay,
  onLostDevice,
  notifyEarlySecurityCheckShouldReset,
  handlePollingError,
  isPollingOn,
  setIsPollingOn,
  handleFinishStep,
  parentRef,
  analyticsSeedConfiguration,
}: UseFirstStepSyncOnboardingViewModelProps) => {
  const { t } = useTranslation();
  const isFocused = useIsFocused();

  const [seedPathStatus, setSeedPathStatus] = useState<SeedPathStatus>("choice_new_or_restore");
  const [hasFinishedExitAnimation, setHasFinishedExitAnimation] = useState<boolean>(false);
  const [isFinishedStep, setIsFinishedStep] = useState<boolean>(false);

  const servicesConfig = useFeature("protectServicesMobile");

  const lastCompanionStepKey = useRef<FirstStepCompanionStepKey | undefined>(undefined);
  const analyticsSeedingTracked = useRef(false);
  const addedToKnownDevices = useRef(false);

  /**
   * True if the device was initially onboarded/seeded when this component got
   * mounted. False otherwise.
   * Value is undefined until the onboarding state polling returns a first
   * result.
   * */
  const deviceInitiallyOnboarded = useRef<boolean | undefined>(undefined);
  /**
   * Variable holding the seed phrase type (number of words) until we are
   * ready to track the event (when the seeding step finishes).
   * Should only be maintained if the device is not onboarded/not seeded as the
   * onboarding flags can only be trusted for a non-onboarded device.
   */
  const analyticsSeedPhraseType = useRef<SeedPhraseType | undefined>(undefined);

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

  const {
    activeStep,
    setStep: setCompanionStep,
    hasSyncStep,
    isLedgerSyncActive,
    steps,
  } = useCompanionSteps({
    device,
    productName,
    seedPathStatus,
    deviceOnboardingState,
    analyticsSeedConfiguration,
  });

  // Sets the state which is active based on device response
  useFirstStepCompanionState({
    deviceOnboardingState,
    setCompanionStep,
    notifyEarlySecurityCheckShouldReset,
    setSeedPathStatus,
    analyticsSeedConfiguration,
    activeStep,
    hasSyncStep,
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
    dispatchRedux(addKnownDevice(mapDeviceToKnownDevice(device)));
    if (!device.wired) {
      dispatchRedux(
        addKnownBleDevice({
          id: device.deviceId,
          name: device.deviceName ?? device.modelId,
          modelId: device.modelId,
        }),
      );
    }
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
      setCompanionStep(FirstStepCompanionStepKey.Exit);
      setIsFinishedStep(false);
      setHasFinishedExitAnimation(true);
    }, 400);
  }, [
    handleFinishStep,
    setCompanionStep,
    sharedHeight,
    analyticsSeedConfiguration,
    setHasFinishedExitAnimation,
  ]);

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
      activeStep === FirstStepCompanionStepKey.Seed &&
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
    lastCompanionStepKey.current = activeStep;
  }, [
    activeStep,
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
    if (activeStep > FirstStepCompanionStepKey.Ready) {
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
  }, [activeStep, addToKnownDevices, dispatchRedux, hasCompletedOnboarding, setIsPollingOn]);

  // When the user gets close to the seed generation step, sets the lost synchronization delay
  // and timers to a higher value. It avoids having a warning message while the connection is lost
  // because the device is generating the seed.
  useEffect(() => {
    if (
      deviceOnboardingState?.seedPhraseType &&
      [OnboardingStep.NewDeviceConfirming, OnboardingStep.RestoreSeed].includes(
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
    if (parentRef?.current && activeStep === FirstStepCompanionStepKey.Seed) {
      // Without timeout the component has not expanded yet on scroll
      const timer = setTimeout(() => parentRef.current?.scrollToEnd({ animated: true }), 300);
      return () => clearTimeout(timer);
    }
  }, [activeStep, parentRef]);

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

  const showSuccess = activeStep === FirstStepCompanionStepKey.Ready;

  useEffect(() => {
    if (showSuccess) {
      sharedOpacity.value = withTiming(100, { duration: OPACITY_DURATION });
    }
  }, [showSuccess, sharedOpacity]);

  useEffect(() => {
    if (isFocused && activeStep === FirstStepCompanionStepKey.Sync && isLedgerSyncActive) {
      screen(
        "Set up device: Step 4 Ledger Sync Success",
        undefined,
        {
          seedConfiguration: analyticsSeedConfiguration.current,
          flow: "onboarding",
        },
        true,
        true,
      );
      const timer = setTimeout(() => setCompanionStep(FirstStepCompanionStepKey.Ready), 1000);
      return () => clearTimeout(timer);
    }
  }, [isFocused, activeStep, isLedgerSyncActive, setCompanionStep, analyticsSeedConfiguration]);

  return {
    animatedStyle,
    handleLayout,
    formatEstimatedTime,
    handleNextStep,
    seedPathStatus,
    setSeedPathStatus,
    hasFinishedExitAnimation,
    isFinishedStep,
    activeStep,
    steps,
  };
};
