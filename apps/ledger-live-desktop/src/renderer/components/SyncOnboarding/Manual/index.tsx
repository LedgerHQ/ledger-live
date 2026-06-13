import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import { useSelector } from "LLD/hooks/redux";
import { Result } from "@ledgerhq/live-common/hw/actions/manager";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { useToggleOnboardingEarlyCheck } from "@ledgerhq/live-common/deviceSDK/hooks/useToggleOnboardingEarlyChecks";
import type { ToggleOnboardingEarlyCheckActionState } from "@ledgerhq/live-common/deviceSDK/actions/toggleOnboardingEarlyCheck";
import {
  OnboardingStep,
  type OnboardingState,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { stringToDeviceModelId } from "@ledgerhq/devices/helpers";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Header from "./Header";
import SyncOnboardingCompanion from "LLD/features/Onboarding/screens/SyncOnboardingCompanion";
import EarlySecurityChecks from "./EarlySecurityChecks";
import { setDrawer } from "~/renderer/drawers/Provider";
import ExitChecksDrawer from "./EarlySecurityChecks/ExitChecksDrawer";
import { renderError } from "../../DeviceAction/rendering";
import { useTranslation } from "react-i18next";
import { useChangeLanguagePrompt } from "./EarlySecurityChecks/useChangeLanguagePrompt";
import DeviceAction from "../../DeviceAction";
import TroubleshootingDrawer from "./TroubleshootingDrawer";
import LockedDeviceDrawer from "./LockedDeviceDrawer";
import { LockedDeviceError, UnexpectedBootloader } from "@ledgerhq/errors";
import { FinalFirmware } from "@ledgerhq/types-live";
import { useConnectManagerAction } from "~/renderer/hooks/useConnectAppAction";

const POLLING_PERIOD_MS = 1000;
const DESYNC_TIMEOUT_MS = 20000;

type CurrentStep = "loading" | "early-security-check" | "companion";
type ToggleOnboardingEarlyCheckType = null | "enter" | "exit";

export type SyncOnboardingScreenProps = {
  /**
   * A device model used to render the animation and text.
   * Needed because the device object can be null if disconnected.
   *
   * Should be DeviceModelId. react-router 5 seems to only handle [K in keyof Params]?: string props
   */
  deviceModelId: string;
};

type SyncOnboardingScreenState = {
  currentStep: CurrentStep;
  isPollingOn: boolean;
  toggleOnboardingEarlyCheckType: ToggleOnboardingEarlyCheckType;
  deviceDetectedOnboarded: boolean;
  mustRecoverIfBootloader: boolean;
  isBootloader: boolean;
  isTroubleshootingDrawerOpen: boolean;
  lastSeenDevice: Device | null;
};

type SyncOnboardingTransition = Partial<SyncOnboardingScreenState>;

type SyncOnboardingScreenAction =
  | {
      type: "pollingSnapshot";
      device: Device | null;
      onboardingState: OnboardingState | null;
      fatalError: Error | null;
      shouldApplyOnboardingState: boolean;
      shouldApplyFatalError: boolean;
    }
  | { type: "applyTransition"; transition: SyncOnboardingTransition | null }
  | { type: "earlySecurityCheckEnded" }
  | { type: "resetChecks" }
  | { type: "openTroubleshootingDrawer" }
  | { type: "setBootloader"; isBootloader: boolean };

const WELCOME_ONBOARDING_STEPS = new Set<OnboardingStep>([
  OnboardingStep.WelcomeScreen1,
  OnboardingStep.WelcomeScreen2,
  OnboardingStep.WelcomeScreen3,
  OnboardingStep.WelcomeScreen4,
  OnboardingStep.WelcomeScreenReminder,
]);

const createInitialSyncOnboardingState = (device: Device | null): SyncOnboardingScreenState => ({
  currentStep: "loading",
  isPollingOn: true,
  toggleOnboardingEarlyCheckType: null,
  deviceDetectedOnboarded: false,
  mustRecoverIfBootloader: true,
  isBootloader: false,
  isTroubleshootingDrawerOpen: false,
  lastSeenDevice: device,
});

const getTransitionFromOnboardingState = (
  onboardingState: OnboardingState | null,
): SyncOnboardingTransition | null => {
  if (!onboardingState) {
    return null;
  }

  const { currentOnboardingStep, isOnboarded } = onboardingState;

  if (!isOnboarded && WELCOME_ONBOARDING_STEPS.has(currentOnboardingStep)) {
    return {
      isPollingOn: false,
      toggleOnboardingEarlyCheckType: "enter",
    };
  }

  if (!isOnboarded && currentOnboardingStep === OnboardingStep.OnboardingEarlyCheck) {
    return {
      isPollingOn: false,
      // Reset the toggle hook result before showing ESC.
      toggleOnboardingEarlyCheckType: null,
      currentStep: "early-security-check",
      mustRecoverIfBootloader: false,
    };
  }

  if (isOnboarded) {
    // Force ESC so the genuine check runs, without sending the toggle APDU.
    return {
      isPollingOn: false,
      toggleOnboardingEarlyCheckType: null,
      deviceDetectedOnboarded: true,
      currentStep: "early-security-check",
      mustRecoverIfBootloader: false,
    };
  }

  return {
    isPollingOn: false,
    currentStep: "companion",
  };
};

const getTransitionFromToggleResult = (
  toggleState: ToggleOnboardingEarlyCheckActionState,
  toggleType: ToggleOnboardingEarlyCheckType,
): SyncOnboardingTransition | null => {
  if (toggleState.toggleStatus === "none") {
    return null;
  }

  if (toggleState.toggleStatus === "failure") {
    // Older firmware may not support toggling ESC; companion is the safe fallback.
    return {
      toggleOnboardingEarlyCheckType: null,
      currentStep: "companion",
    };
  }

  if (toggleType !== null && toggleState.toggleStatus === "success") {
    // Restart polling without forcing loading, to avoid a UI flash.
    return {
      toggleOnboardingEarlyCheckType: null,
      isPollingOn: true,
    };
  }

  return null;
};

const getTransitionFromFatalError = (fatalError: Error | null): SyncOnboardingTransition | null => {
  if (fatalError instanceof UnexpectedBootloader) {
    return {
      isBootloader: true,
    };
  }

  if (fatalError) {
    return {
      isPollingOn: false,
      isTroubleshootingDrawerOpen: true,
    };
  }

  return null;
};

const syncOnboardingScreenReducer = (
  state: SyncOnboardingScreenState,
  action: SyncOnboardingScreenAction,
): SyncOnboardingScreenState => {
  switch (action.type) {
    case "pollingSnapshot": {
      let nextState =
        action.device && state.lastSeenDevice !== action.device
          ? { ...state, lastSeenDevice: action.device }
          : state;

      if (action.shouldApplyOnboardingState) {
        const transition = getTransitionFromOnboardingState(action.onboardingState);
        nextState = transition ? { ...nextState, ...transition } : nextState;
      }

      if (action.shouldApplyFatalError) {
        const transition = getTransitionFromFatalError(action.fatalError);
        nextState = transition ? { ...nextState, ...transition } : nextState;
      }

      return nextState;
    }

    case "applyTransition":
      return action.transition ? { ...state, ...action.transition } : state;

    case "earlySecurityCheckEnded":
      if (state.deviceDetectedOnboarded) {
        // The device was never put into ESC mode via toggle, so there is nothing to exit.
        return {
          ...state,
          currentStep: "companion",
        };
      }

      return {
        ...state,
        toggleOnboardingEarlyCheckType: "exit",
      };

    case "resetChecks":
      return {
        ...state,
        isPollingOn: true,
        currentStep: "loading",
        mustRecoverIfBootloader: true,
      };

    case "openTroubleshootingDrawer":
      return {
        ...state,
        isTroubleshootingDrawerOpen: true,
      };

    case "setBootloader":
      return {
        ...state,
        isBootloader: action.isBootloader,
      };
  }
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
  const action = useConnectManagerAction();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement | null>(null);
  const device = useSelector(getCurrentDevice);
  const deviceModelId = stringToDeviceModelId(strDeviceModelId, DeviceModelId.stax);

  const [syncOnboardingScreenState, dispatchSyncOnboardingScreenAction] = useReducer(
    syncOnboardingScreenReducer,
    device ?? null,
    createInitialSyncOnboardingState,
  );
  const {
    currentStep,
    isPollingOn,
    toggleOnboardingEarlyCheckType,
    mustRecoverIfBootloader,
    isBootloader,
    isTroubleshootingDrawerOpen,
    lastSeenDevice,
  } = syncOnboardingScreenState;
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
    deviceName: lastSeenDevice?.deviceName ?? null,
    toggleType: toggleOnboardingEarlyCheckType,
  });

  const previousOnboardingStateRef = useRef(onboardingState);
  const previousFatalErrorRef = useRef(fatalError);

  // Called when the ESC is complete
  const notifyOnboardingEarlyCheckEnded = useCallback(() => {
    dispatchSyncOnboardingScreenAction({ type: "earlySecurityCheckEnded" });
  }, []);

  // Called when the companion component thinks the device is not in a correct state anymore
  const notifyOnboardingEarlyCheckShouldReset = useCallback(() => {
    dispatchSyncOnboardingScreenAction({ type: "resetChecks" });
    resetPollingStates();
  }, [resetPollingStates]);

  const restartChecksAfterUpdate = useCallback(() => {
    setIsInitialRunOfSecurityChecks(false);
    notifyOnboardingEarlyCheckShouldReset();
  }, [notifyOnboardingEarlyCheckShouldReset]);

  useEffect(() => {
    if (lockedDevice) {
      setDrawer(
        LockedDeviceDrawer,
        {
          deviceModelId,
        },
        {
          forceDisableFocusTrap: true,
          preventBackdropClick: true,
        },
      );
    } else if (isTroubleshootingDrawerOpen) {
      setDrawer(
        TroubleshootingDrawer,
        {
          lastKnownDeviceId: deviceModelId,
          onClose: () => {
            navigate("/onboarding/select-device");
            setDrawer();
          },
        },
        {
          forceDisableFocusTrap: true,
          onRequestClose: () => {
            navigate("/onboarding/select-device");
          },
        },
      );
    }
    return () => setDrawer();
  }, [deviceModelId, navigate, isTroubleshootingDrawerOpen, lockedDevice]);

  // Keep the latest non-null device because the current device can become null on disconnect/reconnect.
  useEffect(() => {
    dispatchSyncOnboardingScreenAction({
      type: "pollingSnapshot",
      device: device ?? null,
      onboardingState,
      fatalError,
      shouldApplyOnboardingState: previousOnboardingStateRef.current !== onboardingState,
      shouldApplyFatalError: previousFatalErrorRef.current !== fatalError,
    });
    previousOnboardingStateRef.current = onboardingState;
    previousFatalErrorRef.current = fatalError;
  }, [device, fatalError, onboardingState]);

  // An allowed error during polling (which makes the polling retry) only triggers an error message after a timeout
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (allowedError && !(allowedError instanceof LockedDeviceError)) {
      timeout = setTimeout(() => {
        dispatchSyncOnboardingScreenAction({
          type: "applyTransition",
          transition: {
            isPollingOn: false,
            isTroubleshootingDrawerOpen: true,
          },
        });
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
    dispatchSyncOnboardingScreenAction({
      type: "applyTransition",
      transition: getTransitionFromToggleResult(
        toggleOnboardingEarlyCheckState,
        toggleOnboardingEarlyCheckType,
      ),
    });
  }, [toggleOnboardingEarlyCheckState, toggleOnboardingEarlyCheckType]);

  useChangeLanguagePrompt({
    device: currentStep === "early-security-check" && device ? device : undefined,
  });

  const onLostDevice = useCallback(() => {
    dispatchSyncOnboardingScreenAction({ type: "openTroubleshootingDrawer" });
  }, []);

  const isEarlySecurityChecks = currentStep === "early-security-check" && lastSeenDevice;

  const handleClose = useCallback(() => {
    const exit = () => navigate("/onboarding/select-device");
    if (isEarlySecurityChecks) {
      setDrawer(
        ExitChecksDrawer,
        {
          onClose: () => setDrawer(),
          onClickExit: () => {
            exit();
            setDrawer();
          },
          deviceModelId,
        },
        { forceDisableFocusTrap: true },
      );
    } else {
      exit();
    }
  }, [deviceModelId, navigate, isEarlySecurityChecks]);

  const [contentScroll, setContentScroll] = useState(0);

  const onContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { currentTarget } = e;
    if (currentTarget instanceof HTMLDivElement) {
      const scrollTop = currentTarget.scrollTop;
      setContentScroll(scrollTop);
    }
  };

  const renderCompanionHeader = useCallback(
    (companionStep: "first-step" | "second-step") => (
      <Header
        device={lastSeenDevice}
        onClose={handleClose}
        displayTitle={currentStep === "companion" && lastSeenDevice && contentScroll > 30}
        companionStep={companionStep}
      />
    ),
    [contentScroll, currentStep, handleClose, lastSeenDevice],
  );

  let stepContent = (
    <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
      <InfiniteLoader />
    </Flex>
  );

  const error = fatalError || allowedError;
  if (currentStep !== "companion" && error !== null) {
    stepContent = (
      <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
        {renderError({
          t,
          device,
          error,
          onRetry: isPollingOn ? undefined : notifyOnboardingEarlyCheckShouldReset,
        })}
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
        parentRef={ref}
        renderHeader={renderCompanionHeader}
      />
    );
  }

  const onDeviceActionResult = useCallback(({ deviceInfo: { isBootloader } }: Result) => {
    dispatchSyncOnboardingScreenAction({ type: "setBootloader", isBootloader });
  }, []);

  return (
    <Flex
      ref={ref}
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
      ) : currentStep === "companion" && lastSeenDevice ? (
        stepContent
      ) : (
        <>
          <Header
            device={lastSeenDevice}
            onClose={handleClose}
            displayTitle={currentStep === "companion" && lastSeenDevice && contentScroll > 30}
            companionStep="first-step"
          />
          {stepContent}
        </>
      )}
    </Flex>
  );
};

export default SyncOnboardingScreen;
