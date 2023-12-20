import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";
import { Result, createAction } from "@ledgerhq/live-common/hw/actions/manager";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { useToggleOnboardingEarlyCheck } from "@ledgerhq/live-common/deviceSDK/hooks/useToggleOnboardingEarlyChecks";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { stringToDeviceModelId } from "@ledgerhq/devices/helpers";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Header from "./Header";
import { RecoverState } from "~/renderer/screens/recover/Player";
import SyncOnboardingCompanion from "./SyncOnboardingCompanion";
import EarlySecurityChecks from "./EarlySecurityChecks";
import { setDrawer } from "~/renderer/drawers/Provider";
import connectManager from "@ledgerhq/live-common/hw/connectManager";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { getEnv } from "@ledgerhq/live-env";
import ExitChecksDrawer, {
  Props as ExitChecksDrawerProps,
} from "./EarlySecurityChecks/ExitChecksDrawer";
import { DeviceActionErrorComponent } from "../../DeviceAction/rendering";
import { useTranslation } from "react-i18next";
import { useChangeLanguagePrompt } from "./EarlySecurityChecks/useChangeLanguagePrompt";
import DeviceAction from "../../DeviceAction";
import TroubleshootingDrawer, {
  Props as TroubleshootingDrawerProps,
} from "./TroubleshootingDrawer";
import LockedDeviceDrawer, { Props as LockedDeviceDrawerProps } from "./LockedDeviceDrawer";
import { LockedDeviceError, UnexpectedBootloader } from "@ledgerhq/errors";
import { FinalFirmware } from "@ledgerhq/types-live";

const POLLING_PERIOD_MS = 1000;
const DESYNC_TIMEOUT_MS = 20000;

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectManager);

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

  const [mustRecoverIfBootloader, setMustRecoverIfBootloader] = useState(true);
  const [isBootloader, setIsBootloader] = useState(false);
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
  const [fwUpdateInterrupted, setFwUpdateInterrupted] = useState<FinalFirmware | null>(null);

  /* The early security checks are run again after a firmware update. */
  const [isInitialRunOfSecurityChecks, setIsInitialRunOfSecurityChecks] = useState(true);

  const {
    onboardingState,
    allowedError,
    fatalError,
    lockedDevice,
    resetStates: resetPollingStates,
  } = useOnboardingStatePolling({
    device: lastSeenDevice,
    pollingPeriodMs: POLLING_PERIOD_MS,
    stopPolling: !isPollingOn || isBootloader,
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
    resetPollingStates();
    setMustRecoverIfBootloader(true);
  }, [resetPollingStates]);

  const restartChecksAfterUpdate = useCallback(() => {
    setIsInitialRunOfSecurityChecks(false);
    notifyOnboardingEarlyCheckShouldReset();
  }, [notifyOnboardingEarlyCheckShouldReset]);

  useEffect(() => {
    if (lockedDevice) {
      const props: LockedDeviceDrawerProps = {
        deviceModelId,
      };
      setDrawer(LockedDeviceDrawer, props, {
        forceDisableFocusTrap: true,
        preventBackdropClick: true,
      });
    } else if (isTroubleshootingDrawerOpen) {
      const props: TroubleshootingDrawerProps = {
        lastKnownDeviceId: deviceModelId,
        onClose: () => {
          history.push("/onboarding/select-device");
          setDrawer();
        },
      };
      setDrawer(TroubleshootingDrawer, props, { forceDisableFocusTrap: true });
    }
    return () => setDrawer();
  }, [deviceModelId, history, isTroubleshootingDrawerOpen, lockedDevice]);

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
      setMustRecoverIfBootloader(false);
    } else {
      setIsPollingOn(false);
      setCurrentStep("companion");
    }
  }, [onboardingState]);

  // A fatal error during polling triggers directly an error message
  useEffect(() => {
    if ((fatalError as unknown) instanceof UnexpectedBootloader) {
      setIsBootloader(true);
    } else if (fatalError) {
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

  const [contentScroll, setContentScroll] = useState(0);

  const onContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { currentTarget } = e;
    if (currentTarget instanceof HTMLDivElement) {
      const scrollTop = currentTarget.scrollTop;
      setContentScroll(scrollTop);
    }
  };

  let stepContent = (
    <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
      <InfiniteLoader />
    </Flex>
  );

  const error = fatalError || allowedError;
  if (currentStep !== "companion" && error !== null) {
    stepContent = (
      <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
        <DeviceActionErrorComponent
          device={device}
          error={error}
          onRetry={isPollingOn ? undefined : notifyOnboardingEarlyCheckShouldReset}
        />
      </Flex>
    );
  } else if (currentStep === "early-security-check" && lastSeenDevice) {
    stepContent = (
      <EarlySecurityChecks
        device={lastSeenDevice}
        isDeviceConnected={!!device}
        onComplete={notifyOnboardingEarlyCheckEnded}
        restartChecksAfterUpdate={restartChecksAfterUpdate}
        isInitialRunOfSecurityChecks={isInitialRunOfSecurityChecks}
        setFwUpdateInterrupted={setFwUpdateInterrupted}
        fwUpdateInterrupted={fwUpdateInterrupted}
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

  const onDeviceActionResult = useCallback(({ deviceInfo: { isBootloader } }: Result) => {
    setIsBootloader(isBootloader);
  }, []);

  return (
    <Flex
      width="100%"
      height="100%"
      overflow="scroll"
      flexDirection="column"
      justifyContent="flex-start"
      onScroll={onContentScroll}
    >
      {isBootloader && mustRecoverIfBootloader ? (
        /**
         * In case a firmware update gets interrupted and the device is in
         * Bootloader mode, we display this device action which will prompt the
         * user to finish the update.
         * */
        <DeviceAction onResult={onDeviceActionResult} action={action} request={null} />
      ) : (
        <>
          <Header
            device={lastSeenDevice}
            onClose={handleClose}
            displayTitle={currentStep === "companion" && lastSeenDevice && contentScroll > 30}
          />
          {stepContent}
        </>
      )}
    </Flex>
  );
};

export default SyncOnboardingScreen;
