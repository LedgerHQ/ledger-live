import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import type { StackScreenProps } from "@react-navigation/stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { InfiniteLoader, Flex } from "@ledgerhq/native-ui";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useToggleOnboardingEarlyCheck } from "@ledgerhq/live-common/deviceSDK/hooks/useToggleOnboardingEarlyChecks";
import { log } from "@ledgerhq/logs";
import { getDeviceModel } from "@ledgerhq/devices";
import { LockedDeviceError, UnexpectedBootloader } from "@ledgerhq/errors";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { RootStackParamList } from "~/components/RootNavigator/types/RootNavigator";
import { SyncOnboardingStackParamList } from "~/components/RootNavigator/types/SyncOnboardingNavigator";
import {
  SyncOnboardingCompanion,
  NORMAL_DESYNC_OVERLAY_DISPLAY_DELAY_MS,
} from "./SyncOnboardingCompanion";
import { EarlySecurityCheck } from "./EarlySecurityCheck";
import DesyncDrawer from "./DesyncDrawer";
import EarlySecurityCheckMandatoryDrawer from "./EarlySecurityCheckMandatoryDrawer";
import { PlainOverlay } from "./DesyncOverlay";
import { track } from "~/analytics";
import { NavigationHeaderCloseButton } from "~/components/NavigationHeaderCloseButton";
import UnlockDeviceDrawer from "~/components/UnlockDeviceDrawer";
import AutoRepairDrawer from "./AutoRepairDrawer";

export type SyncOnboardingScreenProps = CompositeScreenProps<
  StackScreenProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingCompanion>,
  CompositeScreenProps<
    StackScreenProps<BaseNavigatorStackParamList>,
    StackScreenProps<RootStackParamList>
  >
>;

const POLLING_PERIOD_MS = 1000;
const DESYNC_TIMEOUT_MS = 20000;

/**
 * Synchronous onboarding screen composed of the "early security/onboarding checks" step and the "synchronous companion" step
 *
 * This screen polls the state of the device to:
 * - toggle the onboarding early checks (enter/exit) on the device if needed
 * - know which steps it should display
 */
export const SyncOnboarding = ({ navigation, route }: SyncOnboardingScreenProps) => {
  const { device } = route.params;
  const [currentStep, setCurrentStep] = useState<"loading" | "early-security-check" | "companion">(
    "loading",
  );
  const [isPollingOn, setIsPollingOn] = useState<boolean>(true);
  const [toggleOnboardingEarlyCheckType, setToggleOnboardingEarlyCheckType] = useState<
    null | "enter" | "exit"
  >(null);

  const [isDesyncDrawerOpen, setIsDesyncDrawerOpen] = useState<boolean>(false);
  const [isAutoRepairOpen, setIsAutoRepairOpen] = useState<boolean>(false);
  const [isESCMandatoryDrawerOpen, setIsESCMandatoryDrawerOpen] = useState<boolean>(false);
  const [isLockedDeviceDrawerOpen, setLockedDeviceDrawerOpen] = useState<boolean>(false);

  // Used to know if a first genuine check already happened and to pass the information to the ESC
  const [isAlreadyGenuine, setIsAlreadyGenuine] = useState<boolean>(false);

  const [isPreviousUpdateCancelled, setIsPreviousUpdateCancelled] = useState<boolean>(false);

  // States handling a UI trick to hide the header while the desync alert overlay
  // is displayed from the companion
  const [isHeaderOverlayOpen, setIsHeaderOverlayOpen] = useState<boolean>(false);
  const [headerOverlayDelayMs, setHeaderOverlayDelayMs] = useState<number>(
    NORMAL_DESYNC_OVERLAY_DISPLAY_DELAY_MS,
  );

  const productName = getDeviceModel(device.modelId).productName || device.modelId;

  // Depending on the current step, the close button triggers different paths
  const onCloseButtonPress = useCallback(() => {
    if (currentStep === "early-security-check") {
      setIsESCMandatoryDrawerOpen(true);
    } else {
      navigation.popToTop();
    }
  }, [currentStep, navigation]);

  // Updates dynamically the screen header to handle a possible overlay
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => (
        <>
          <SafeAreaView edges={["top", "left", "right"]}>
            <Flex my={5} flexDirection="row" justifyContent="flex-end" alignItems="center">
              <NavigationHeaderCloseButton onPress={onCloseButtonPress} />
            </Flex>
          </SafeAreaView>
          <PlainOverlay isOpen={isHeaderOverlayOpen} delay={headerOverlayDelayMs} />
        </>
      ),
    });
  }, [device, navigation, isHeaderOverlayOpen, headerOverlayDelayMs, onCloseButtonPress]);

  const {
    onboardingState,
    allowedError,
    fatalError,
    resetStates: resetPollingStates,
    lockedDevice,
  } = useOnboardingStatePolling({
    device,
    pollingPeriodMs: POLLING_PERIOD_MS,
    stopPolling: !isPollingOn,
  });

  const { state: toggleOnboardingEarlyCheckState } = useToggleOnboardingEarlyCheck({
    deviceId: device.deviceId,
    toggleType: toggleOnboardingEarlyCheckType,
  });

  // Called when the ESC is complete
  const notifyOnboardingEarlyCheckEnded = useCallback(() => {
    setToggleOnboardingEarlyCheckType("exit");
  }, []);

  // Called when the device seems not to be in the correct state anymore.
  // Probably because the device restarted.
  // If the caller knows that the device is already genuine, save this information.
  const notifyEarlySecurityCheckShouldReset = useCallback(
    (
      {
        isAlreadyGenuine,
        isPreviousUpdateCancelled,
      }: { isAlreadyGenuine: boolean; isPreviousUpdateCancelled: boolean } = {
        isAlreadyGenuine: false,
        isPreviousUpdateCancelled: false,
      },
    ) => {
      setIsPreviousUpdateCancelled(isPreviousUpdateCancelled);
      setIsAlreadyGenuine(isAlreadyGenuine);
      setCurrentStep("loading");
      // Resets the polling state because it could return the same result object (and so no state has changed)
      // but we want to re-trigger the useEffect handling the polling result
      resetPollingStates();
      setIsPollingOn(true);
    },
    [resetPollingStates],
  );

  // Called when the user taps on the "cancel" button in the mandatory drawer
  const onCancelEarlySecurityCheck = useCallback(() => {
    setIsESCMandatoryDrawerOpen(false);
    navigation.popToTop();
  }, [navigation]);

  // Handles current step and toggling onboarding early check logics from polling information
  useEffect(() => {
    if (!onboardingState) {
      return;
    }

    const { currentOnboardingStep, isOnboarded } = onboardingState;

    if (
      !isOnboarded &&
      [
        OnboardingStep.WelcomeScreen1,
        OnboardingStep.WelcomeScreen2,
        OnboardingStep.WelcomeScreen3,
        OnboardingStep.WelcomeScreen4,
        OnboardingStep.WelcomeScreenReminder,
      ].includes(currentOnboardingStep)
    ) {
      setIsPollingOn(false);
      setToggleOnboardingEarlyCheckType("enter");
    } else if (!isOnboarded && currentOnboardingStep === OnboardingStep.OnboardingEarlyCheck) {
      setIsPollingOn(false);
      // Resets the `useToggleOnboardingEarlyCheck` hook. Avoids having a case where for ex
      // check type == "exit" and toggle status still being == "success" from the previous toggle
      setToggleOnboardingEarlyCheckType(null);
      setCurrentStep("early-security-check");
    } else {
      setIsPollingOn(false);
      setCurrentStep("companion");
    }
  }, [onboardingState]);

  // A fatal error during polling triggers directly an error message (or the auto repair)
  useEffect(() => {
    if (fatalError) {
      if ((fatalError as unknown) instanceof UnexpectedBootloader) {
        log("SyncOnboardingIndex", "Device in bootloader mode. Trying to auto repair", {
          fatalError,
        });
        setIsPollingOn(false);
        setIsAutoRepairOpen(true);
      } else {
        log("SyncOnboardingIndex", "Fatal error during polling", { fatalError });
        setIsPollingOn(false);
        setIsDesyncDrawerOpen(true);
      }
    }
  }, [fatalError]);

  // An allowed error during polling (which makes the polling retry) only triggers an error message after a timeout
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (allowedError && !(allowedError instanceof LockedDeviceError)) {
      log("SyncOnboardingIndex", "Polling allowed error", { allowedError });

      timeout = setTimeout(() => {
        setIsPollingOn(false);
        setIsDesyncDrawerOpen(true);
      }, DESYNC_TIMEOUT_MS);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [allowedError]);

  useEffect(() => {
    if (lockedDevice) {
      setLockedDeviceDrawerOpen(true);
    }

    return () => {
      setLockedDeviceDrawerOpen(false);
    };
  }, [lockedDevice]);

  // Handles onboarding early check toggle result
  useEffect(() => {
    if (toggleOnboardingEarlyCheckState.toggleStatus === "none") return;

    if (toggleOnboardingEarlyCheckState.toggleStatus === "failure") {
      // If an error occurred during the toggling the safe backup is to bring the device to the "companion" step
      // This will happen for older firmware that does not handle this new action.
      setToggleOnboardingEarlyCheckType(null);
      setCurrentStep("companion");
    }

    // After a successful "enter" or "exit", the polling is restarted to know the device state
    if (
      toggleOnboardingEarlyCheckType !== null &&
      toggleOnboardingEarlyCheckState.toggleStatus === "success"
    ) {
      // Resets the toggle hook
      setToggleOnboardingEarlyCheckType(null);
      setIsPollingOn(true);
      // Not setting the `currentStep` to "loading" here to avoid UI flash
    }
  }, [toggleOnboardingEarlyCheckState, toggleOnboardingEarlyCheckType]);

  const onLostDevice = useCallback(() => {
    setIsDesyncDrawerOpen(true);
  }, []);

  const handleDesyncRetry = useCallback(() => {
    track("button_clicked", {
      button: "Try again",
      drawer: "Could not connect to Stax",
    });
    // handleDesyncClose is then called once the drawer is fully closed
    setIsDesyncDrawerOpen(false);
  }, []);

  const handleDesyncClose = useCallback(() => {
    setIsDesyncDrawerOpen(false);
    navigation.goBack();
  }, [navigation]);

  const handleAutoRepairClose = useCallback(() => {
    setIsAutoRepairOpen(false);
    setIsPollingOn(true);
  }, []);

  let stepContent = (
    <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
      <InfiniteLoader />
    </Flex>
  );

  if (currentStep === "early-security-check") {
    stepContent = (
      <EarlySecurityCheck
        device={device}
        isAlreadyGenuine={isAlreadyGenuine}
        isPreviousUpdateCancelled={isPreviousUpdateCancelled}
        notifyOnboardingEarlyCheckEnded={notifyOnboardingEarlyCheckEnded}
        notifyEarlySecurityCheckShouldReset={notifyEarlySecurityCheckShouldReset}
        onCancelOnboarding={onCancelEarlySecurityCheck}
      />
    );
  } else if (currentStep === "companion") {
    stepContent = (
      <SyncOnboardingCompanion
        navigation={navigation}
        device={device}
        notifyEarlySecurityCheckShouldReset={notifyEarlySecurityCheckShouldReset}
        onLostDevice={onLostDevice}
        onShouldHeaderBeOverlaid={setIsHeaderOverlayOpen}
        updateHeaderOverlayDelay={setHeaderOverlayDelayMs}
      />
    );
  }

  return (
    <>
      <DesyncDrawer
        isOpen={isDesyncDrawerOpen}
        onClose={handleDesyncClose}
        onRetry={handleDesyncRetry}
        device={device}
      />
      <AutoRepairDrawer isOpen={isAutoRepairOpen} onDone={handleAutoRepairClose} device={device} />
      <EarlySecurityCheckMandatoryDrawer
        productName={productName}
        isOpen={isESCMandatoryDrawerOpen}
        onResume={() => {
          setIsESCMandatoryDrawerOpen(false);
        }}
        onCancel={onCancelEarlySecurityCheck}
      />
      <UnlockDeviceDrawer
        isOpen={isLockedDeviceDrawerOpen}
        onClose={() => {
          // Closing because the user pressed on close button (the device is still locked)
          if (lockedDevice) {
            // Triggers the same close button behavior than closing the entire sync onboarding
            onCloseButtonPress();
          }
        }}
        device={device}
      />
      {stepContent}
    </>
  );
};
