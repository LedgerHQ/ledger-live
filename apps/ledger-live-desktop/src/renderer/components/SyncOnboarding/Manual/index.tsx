import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { useToggleOnboardingEarlyCheck } from "@ledgerhq/live-common/deviceSDK/hooks/useToggleOnboardingEarlyChecks";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import HelpDrawer from "./HelpDrawer";
import TroubleshootingDrawer from "./TroubleshootingDrawer";
import Header from "./Header";
import { RecoverState } from "~/renderer/screens/recover/Player";
import SyncOnboardingCompanion from "./SyncOnboardingCompanion";
// import { stringToDeviceModelId } from "@ledgerhq/devices/lib/helpers";
import { DeviceModelId } from "@ledgerhq/devices";

const POLLING_PERIOD_MS = 1000;
const DESYNC_TIMEOUT_MS = 20000;

export type SyncOnboardingScreenProps = {
  /**
   * A device model used to render the animation and text.
   * Needed because the device object can be null if disconnected.
   *
   * Should be DeviceModelId. react-router 5 seems to only handle [K in keyof Params]?: string props
   */
  deviceModelId: string;
};

/**
 * Synchronous onboarding screen composed of the "early security/onboarding checks" step and the "synchronous companion" step
 *
 * This screen polls the state of the device to:
 * - toggle the onboarding early checks (enter/exit) on the device if needed
 * - know which steps it should display
 */
const SyncOnboardingScreen: React.FC<SyncOnboardingScreenProps> = ({
  deviceModelId: strDeviceModelId,
}) => {
  const history = useHistory<RecoverState>();

  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isTroubleshootingDrawerOpen, setTroubleshootingDrawerOpen] = useState<boolean>(false);

  const handleClose = useCallback(() => {
    history.push("/onboarding/select-device");
  }, [history]);

  // TODO: to check with UX
  const handleTroubleshootingDrawerClose = useCallback(() => {
    // setTroubleshootingDrawerOpen(false);
    // setStopPolling(false);
    history.push("/onboarding/select-device");
  }, [history]);

  // TODO: to remove ?
  // const handleDeviceReady = useCallback(() => {
  //   history.push("/onboarding/sync/completion");
  // }, [history]);

  // const handleDesyncTimerRunsOut = useCallback(() => {
  //   setTroubleshootingDrawerOpen(true);
  // }, []);

  // HERE
  const device = useSelector(getCurrentDevice);

  // TODO: to only keep in screen ?
  // ALSO why is it failing ? wtf
  const deviceModelId = strDeviceModelId as DeviceModelId; // stringToDeviceModelId(strDeviceModelId, DeviceModelId.stax);

  // Needed because the device object can be null or changed if disconnected/reconnected
  const [lastKnownDeviceModelId, setLastKnownDeviceModelId] =
    useState<DeviceModelId>(deviceModelId);

  useEffect(() => {
    if (device) {
      setLastKnownDeviceModelId(device.modelId);
    }
  }, [device]);

  const [currentStep, setCurrentStep] = useState<"loading" | "early-security-check" | "companion">(
    "loading",
  );
  const [isPollingOn, setIsPollingOn] = useState<boolean>(true);
  const [toggleOnboardingEarlyCheckType, setToggleOnboardingEarlyCheckType] = useState<
    null | "enter" | "exit"
  >(null);

  const { onboardingState, allowedError, fatalError } = useOnboardingStatePolling({
    device: device || null,
    pollingPeriodMs: POLLING_PERIOD_MS,
    stopPolling: !isPollingOn,
  });

  const { state: toggleOnboardingEarlyCheckState } = useToggleOnboardingEarlyCheck({
    deviceId: device?.deviceId ?? "",
    toggleType: toggleOnboardingEarlyCheckType,
  });

  // // Called when the ESC is complete
  // const notifyOnboardingEarlyCheckEnded = useCallback(() => {
  //   setToggleOnboardingEarlyCheckType("exit");
  // }, []);

  // Called when the companion component thinks the device is not in a correct state anymore
  const notifySyncOnboardingShouldReset = useCallback(() => {
    setIsPollingOn(true);
  }, []);

  // Handles current step and toggling onboarding early check logics
  useEffect(() => {
    if (!onboardingState) {
      return;
    }
    const { currentOnboardingStep } = onboardingState;

    if (
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
    } else if (currentOnboardingStep === OnboardingStep.OnboardingEarlyCheck) {
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

  // A fatal error during polling triggers directly an error message
  useEffect(() => {
    if (fatalError) {
      setIsPollingOn(false);
      setTroubleshootingDrawerOpen(true);
    }
  }, [fatalError]);

  // An allowed error during polling (which makes the polling retry) only triggers an error message after a timeout
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (allowedError) {
      timeout = setTimeout(() => {
        setIsPollingOn(false);
        setTroubleshootingDrawerOpen(true);
      }, DESYNC_TIMEOUT_MS);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [allowedError]);

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
    setTroubleshootingDrawerOpen(true);
  }, []);

  // const handleDesyncRetry = useCallback(() => {
  //   track("button_clicked", {
  //     button: "Try again",
  //     drawer: "Could not connect to Stax",
  //   });
  //   // handleDesyncClose is then called once the drawer is fully closed
  //   setDesyncDrawerOpen(false);
  // }, []);

  // const handleDesyncClose = useCallback(() => {
  //   setDesyncDrawerOpen(false);
  //   navigation.goBack();
  // }, [navigation]);

  let stepContent = (
    <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
      <InfiniteLoader />
    </Flex>
  );

  if (currentStep === "early-security-check" && device) {
    // stepContent = (
    //   <EarlySecurityCheck
    //     device={device}
    //     notifyOnboardingEarlyCheckEnded={notifyOnboardingEarlyCheckEnded}
    //   />
    // );
    stepContent = (
      <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
        <Text>ESC 🐬</Text>
        <InfiniteLoader />
      </Flex>
    );
  } else if (currentStep === "companion" && device) {
    stepContent = (
      <SyncOnboardingCompanion
        device={device}
        notifySyncOnboardingShouldReset={notifySyncOnboardingShouldReset}
        onLostDevice={onLostDevice}
      />
    );
  }

  return (
    <Flex width="100%" height="100%" flexDirection="column" justifyContent="flex-start">
      <Header onClose={handleClose} onHelp={() => setHelpDrawerOpen(true)} />
      <HelpDrawer isOpen={isHelpDrawerOpen} onClose={() => setHelpDrawerOpen(false)} />
      <TroubleshootingDrawer
        lastKnownDeviceId={lastKnownDeviceModelId}
        isOpen={isTroubleshootingDrawerOpen}
        onClose={handleTroubleshootingDrawerClose}
      />
      {stepContent}
    </Flex>
  );
};

export default SyncOnboardingScreen;
