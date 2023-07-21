import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { useToggleOnboardingEarlyCheck } from "@ledgerhq/live-common/deviceSDK/hooks/useToggleOnboardingEarlyChecks";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { stringToDeviceModelId } from "@ledgerhq/devices/helpers";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import TroubleshootingDrawer from "./TroubleshootingDrawer";
import Header from "./Header";
import { RecoverState } from "~/renderer/screens/recover/Player";
import SyncOnboardingCompanion from "./SyncOnboardingCompanion";
import EarlySecurityChecks from "./EarlySecurityChecks";
import { setDrawer } from "~/renderer/drawers/Provider";
import ExitChecksDrawer, {
  Props as ExitChecksDrawerProps,
} from "./EarlySecurityChecks/ExitChecksDrawer";
import { renderError } from "../../DeviceAction/rendering";
import { useTranslation } from "react-i18next";
import { LockedDeviceError } from "@ledgerhq/errors";
import { useChangeLanguagePrompt } from "./EarlySecurityChecks/useChangeLanguagePrompt";

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
  const { t } = useTranslation();

  const device = useSelector(getCurrentDevice);
  const deviceModelId = stringToDeviceModelId(strDeviceModelId, DeviceModelId.stax);

  // Needed because `device` object can be null or changed if disconnected/reconnected
  const [lastSeenDevice, setLastSeenDevice] = useState<Device | null>(device ?? null);
  useEffect(() => {
    if (device) {
      setLastSeenDevice(device);
    }
  }, [device]);

  const [isTroubleshootingDrawerOpen, setTroubleshootingDrawerOpen] = useState<boolean>(false);

  const [currentStep, setCurrentStep] = useState<"loading" | "early-security-check" | "companion">(
    "loading",
  );
  const [isPollingOn, setIsPollingOn] = useState<boolean>(true);
  const [toggleOnboardingEarlyCheckType, setToggleOnboardingEarlyCheckType] = useState<
    null | "enter" | "exit"
  >(null);

  const [autoStartChecks, setAutoStartChecks] = useState(false);

  const { onboardingState, allowedError, fatalError } = useOnboardingStatePolling({
    device: lastSeenDevice,
    pollingPeriodMs: POLLING_PERIOD_MS,
    stopPolling: !isPollingOn,
  });

  const { state: toggleOnboardingEarlyCheckState } = useToggleOnboardingEarlyCheck({
    deviceId: lastSeenDevice?.deviceId ?? "",
    toggleType: toggleOnboardingEarlyCheckType,
  });

  // Called when the ESC is complete
  const notifyOnboardingEarlyCheckEnded = useCallback(() => {
    setToggleOnboardingEarlyCheckType("exit");
  }, []);

  // Called when the companion component thinks the device is not in a correct state anymore
  const notifyOnboardingEarlyCheckShouldReset = useCallback(() => {
    setIsPollingOn(true);
    setCurrentStep("loading");
  }, []);

  const restartChecksAfterUpdate = useCallback(() => {
    setAutoStartChecks(true);
    notifyOnboardingEarlyCheckShouldReset();
  }, [notifyOnboardingEarlyCheckShouldReset]);

  // Handles current step and toggling onboarding early check logics
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

    if (allowedError && !(allowedError instanceof LockedDeviceError)) {
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

  useChangeLanguagePrompt({
    device: currentStep === "early-security-check" && device ? device : undefined,
  });

  const onLostDevice = useCallback(() => {
    setTroubleshootingDrawerOpen(true);
  }, []);

  const isEarlySecurityChecks = currentStep === "early-security-check" && lastSeenDevice;

  const handleClose = useCallback(() => {
    const exit = () => history.push("/onboarding/select-device");
    if (isEarlySecurityChecks) {
      const props: ExitChecksDrawerProps = {
        onClose: () => setDrawer(),
        onClickExit: () => {
          exit();
          setDrawer();
        },
      };
      setDrawer(ExitChecksDrawer, props, { forceDisableFocusTrap: true });
    } else {
      exit();
    }
  }, [history, isEarlySecurityChecks]);

  const handleTroubleshootingDrawerClose = useCallback(() => {
    history.push("/onboarding/select-device");
  }, [history]);

  let stepContent = (
    <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
      <InfiniteLoader />
    </Flex>
  );

  if (currentStep !== "companion" && (fatalError || allowedError) !== null) {
    stepContent = (
      <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
        {renderError({
          t,
          device,
          error: fatalError || allowedError,
          onRetry: isPollingOn ? undefined : notifyOnboardingEarlyCheckShouldReset,
        })}
      </Flex>
    );
  } else if (currentStep === "early-security-check" && lastSeenDevice) {
    stepContent = (
      <EarlySecurityChecks
        device={lastSeenDevice}
        onComplete={notifyOnboardingEarlyCheckEnded}
        restartChecksAfterUpdate={restartChecksAfterUpdate}
        optimisticGenuineCheck={autoStartChecks}
      />
    );
  } else if (currentStep === "companion" && lastSeenDevice) {
    stepContent = (
      <SyncOnboardingCompanion
        device={lastSeenDevice}
        notifySyncOnboardingShouldReset={notifyOnboardingEarlyCheckShouldReset}
        onLostDevice={onLostDevice}
      />
    );
  }

  return (
    <Flex width="100%" height="100%" flexDirection="column" justifyContent="flex-start">
      <TroubleshootingDrawer
        lastKnownDeviceId={deviceModelId}
        isOpen={isTroubleshootingDrawerOpen}
        onClose={handleTroubleshootingDrawerClose}
      />
      {stepContent}
      <Header onClose={handleClose} />
    </Flex>
  );
};

export default SyncOnboardingScreen;
