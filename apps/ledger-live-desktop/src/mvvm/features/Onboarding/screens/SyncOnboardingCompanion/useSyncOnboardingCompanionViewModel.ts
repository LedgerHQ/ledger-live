import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { useNavigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { getDeviceModel } from "@ledgerhq/devices";
import { SeedOriginType, SeedPhraseType } from "@ledgerhq/types-live";
import {
  type OnboardingState,
  OnboardingStep as DeviceOnboardingStep,
  fromSeedPhraseTypeToNbOfSeedWords,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useFeature } from "@features/platform-feature-flags";
import { useCustomPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";

import { SeedPathStatus } from "./types";
import { getOnboardingStatePolling } from "@ledgerhq/live-common/hw/getOnboardingStatePolling";
import { isAllowedOnboardingStatePollingErrorDmk } from "@ledgerhq/live-dmk-desktop";
import { trackPage } from "~/renderer/analytics/segment";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { setDrawer } from "~/renderer/drawers/Provider";
import LockedDeviceDrawer from "~/renderer/components/SyncOnboarding/Manual/LockedDeviceDrawer";
import { LockedDeviceError } from "@ledgerhq/errors";
import { useRecoverRestoreOnboarding } from "~/renderer/hooks/useRecoverRestoreOnboarding";
import { useTrackOnboardingFlow } from "~/renderer/analytics/hooks/useTrackOnboardingFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import useCompanionSteps, { READY_REDIRECT_DELAY_MS, StepKey } from "./hooks/useCompanionSteps";
import { analyticsFlowName } from "./utils/constants/analytics";

const POLLING_PERIOD_MS = 1000;

const DESYNC_TIMEOUT_MS = 60000;
const LONG_DESYNC_TIMEOUT_MS = 120000;

const DESYNC_OVERLAY_DELAY_MS = 1000;
const LONG_DESYNC_OVERLAY_DELAY_MS = 60000;

const fromSeedPhraseTypeToAnalyticsPropertyString = new Map<SeedPhraseType, string>([
  [SeedPhraseType.TwentyFour, "TwentyFour"],
  [SeedPhraseType.Eighteen, "Eighteen"],
  [SeedPhraseType.Twelve, "Twelve"],
]);

type CompanionTransition = {
  stepKey?: StepKey;
  shouldRestoreApps?: boolean;
  seedPathStatus?: SeedPathStatus;
  isNewSeed?: boolean;
  seedConfiguration?: SeedOriginType;
  shouldNotifyReset?: boolean;
  shouldMarkSeededDeviceHandled?: boolean;
};

type CompanionState = {
  stepKey: StepKey;
  shouldRestoreApps: boolean;
  seedPathStatus: SeedPathStatus;
  isNewSeed: boolean;
  deviceInitiallyOnboarded: boolean | undefined;
  seedPhraseType: SeedPhraseType | undefined;
  seedConfiguration: SeedOriginType | undefined;
  seededDeviceHandled: boolean;
  isPollingOn: boolean;
  desyncOverlayDelay: number;
  isDesyncOverlayOpen: boolean;
  desyncTimeout: number;
};

type CompanionAction =
  | {
      type: "DEVICE_ONBOARDING_STATE_CHANGED";
      deviceOnboardingState: OnboardingState;
      transition: CompanionTransition | null;
      shouldExtendDesyncTiming: boolean;
    }
  | { type: "GO_TO_STEP"; stepKey: StepKey }
  | { type: "COMPLETE_SUCCESS_STEP" }
  | { type: "STOP_POLLING" }
  | { type: "START_DESYNC_WARNING" }
  | { type: "CLEAR_DESYNC_WARNING" };

const initialCompanionState: CompanionState = {
  stepKey: StepKey.Paired,
  shouldRestoreApps: false,
  seedPathStatus: "choice_new_or_restore",
  isNewSeed: false,
  deviceInitiallyOnboarded: undefined,
  seedPhraseType: undefined,
  seedConfiguration: undefined,
  seededDeviceHandled: false,
  isPollingOn: true,
  desyncOverlayDelay: DESYNC_OVERLAY_DELAY_MS,
  isDesyncOverlayOpen: false,
  desyncTimeout: DESYNC_TIMEOUT_MS,
};

function getCompanionHeaderStep(stepKey: StepKey): "first-step" | "second-step" {
  return stepKey > StepKey.Seed ? "second-step" : "first-step";
}

function companionReducer(state: CompanionState, action: CompanionAction): CompanionState {
  switch (action.type) {
    case "DEVICE_ONBOARDING_STATE_CHANGED": {
      const { deviceOnboardingState, shouldExtendDesyncTiming, transition } = action;
      const nextDeviceInitiallyOnboarded =
        state.deviceInitiallyOnboarded ?? deviceOnboardingState.isOnboarded;
      const nextSeedPhraseType =
        !deviceOnboardingState.isOnboarded && deviceOnboardingState.seedPhraseType
          ? deviceOnboardingState.seedPhraseType
          : state.seedPhraseType;
      const nextSeedConfiguration = transition?.seedConfiguration ?? state.seedConfiguration;
      const nextDesyncOverlayDelay = shouldExtendDesyncTiming
        ? LONG_DESYNC_OVERLAY_DELAY_MS
        : state.desyncOverlayDelay;
      const nextDesyncTimeout = shouldExtendDesyncTiming
        ? LONG_DESYNC_TIMEOUT_MS
        : state.desyncTimeout;
      const nextStepKey = transition?.stepKey ?? state.stepKey;
      const nextShouldRestoreApps = transition?.shouldRestoreApps ?? state.shouldRestoreApps;
      const nextSeedPathStatus = transition?.seedPathStatus ?? state.seedPathStatus;
      const nextIsNewSeed = transition?.isNewSeed ?? state.isNewSeed;
      const nextSeededDeviceHandled =
        state.seededDeviceHandled || transition?.shouldMarkSeededDeviceHandled === true;

      if (
        nextDeviceInitiallyOnboarded === state.deviceInitiallyOnboarded &&
        nextSeedPhraseType === state.seedPhraseType &&
        nextSeedConfiguration === state.seedConfiguration &&
        nextDesyncOverlayDelay === state.desyncOverlayDelay &&
        nextDesyncTimeout === state.desyncTimeout &&
        nextStepKey === state.stepKey &&
        nextShouldRestoreApps === state.shouldRestoreApps &&
        nextSeedPathStatus === state.seedPathStatus &&
        nextIsNewSeed === state.isNewSeed &&
        nextSeededDeviceHandled === state.seededDeviceHandled
      ) {
        return state;
      }

      return {
        ...state,
        stepKey: nextStepKey,
        shouldRestoreApps: nextShouldRestoreApps,
        seedPathStatus: nextSeedPathStatus,
        isNewSeed: nextIsNewSeed,
        deviceInitiallyOnboarded: nextDeviceInitiallyOnboarded,
        seedPhraseType: nextSeedPhraseType,
        seedConfiguration: nextSeedConfiguration,
        seededDeviceHandled: nextSeededDeviceHandled,
        desyncOverlayDelay: nextDesyncOverlayDelay,
        desyncTimeout: nextDesyncTimeout,
      };
    }
    case "GO_TO_STEP":
      return { ...state, stepKey: action.stepKey };
    case "COMPLETE_SUCCESS_STEP":
      return { ...state, stepKey: StepKey.Apps };
    case "STOP_POLLING":
      return { ...state, isPollingOn: false };
    case "START_DESYNC_WARNING":
      return { ...state, isDesyncOverlayOpen: true };
    case "CLEAR_DESYNC_WARNING":
      return { ...state, isDesyncOverlayOpen: false };
    default:
      return state;
  }
}

function getCompanionTransitionFromOnboardingState({
  deviceOnboardingState,
  isSyncIncr1Enabled,
  hasSyncStep,
  seededDeviceAlreadyHandled,
}: {
  deviceOnboardingState?: OnboardingState | null;
  isSyncIncr1Enabled: boolean;
  hasSyncStep: boolean;
  seededDeviceAlreadyHandled: boolean;
}): CompanionTransition | null {
  if (
    deviceOnboardingState?.isOnboarded &&
    !seededDeviceAlreadyHandled &&
    [DeviceOnboardingStep.Ready, DeviceOnboardingStep.WelcomeScreen1].includes(
      deviceOnboardingState.currentOnboardingStep,
    )
  ) {
    return {
      stepKey: isSyncIncr1Enabled ? (hasSyncStep ? StepKey.Sync : StepKey.Success) : StepKey.Apps,
      shouldMarkSeededDeviceHandled: true,
    };
  }

  switch (deviceOnboardingState?.currentOnboardingStep) {
    // Those cases could happen if the device restarted
    case DeviceOnboardingStep.WelcomeScreen1:
    case DeviceOnboardingStep.WelcomeScreen2:
    case DeviceOnboardingStep.WelcomeScreen3:
    case DeviceOnboardingStep.WelcomeScreen4:
    case DeviceOnboardingStep.WelcomeScreenReminder:
    case DeviceOnboardingStep.OnboardingEarlyCheck:
      return { shouldNotifyReset: true };

    case DeviceOnboardingStep.ChooseName:
      return { stepKey: StepKey.Paired };
    case DeviceOnboardingStep.SetupChoice:
      return { stepKey: StepKey.Seed, seedPathStatus: "choice_new_or_restore" };
    case DeviceOnboardingStep.NewDevice:
    case DeviceOnboardingStep.NewDeviceConfirming:
      return {
        shouldRestoreApps: false,
        stepKey: StepKey.Seed,
        seedPathStatus: "new_seed",
        isNewSeed: true,
        seedConfiguration: "new_seed",
      };
    case DeviceOnboardingStep.SetupChoiceRestore:
      return { stepKey: StepKey.Seed, seedPathStatus: "choice_restore_direct_or_recover" };
    case DeviceOnboardingStep.RestoreSeed:
      return {
        shouldRestoreApps: true,
        stepKey: StepKey.Seed,
        seedPathStatus: "restore_seed",
        isNewSeed: false,
        seedConfiguration: "restore_seed",
      };
    case DeviceOnboardingStep.RecoverRestore:
      return {
        shouldRestoreApps: true,
        stepKey: StepKey.Seed,
        seedPathStatus: "recover_seed",
        isNewSeed: false,
        seedConfiguration: "recover_seed",
      };
    case DeviceOnboardingStep.BackupCharon:
      return { stepKey: StepKey.Seed, seedPathStatus: "backup_charon" };
    case DeviceOnboardingStep.RestoreCharon:
      return {
        stepKey: StepKey.Seed,
        seedPathStatus: "restore_charon",
        isNewSeed: false,
        seedConfiguration: "restore_charon",
      };
    case DeviceOnboardingStep.Pin:
      return { stepKey: StepKey.Pin };
    default:
      return null;
  }
}

function shouldExtendDesyncTimingForSeedGeneration(
  deviceOnboardingState: OnboardingState,
): boolean {
  if (
    !deviceOnboardingState.seedPhraseType ||
    ![DeviceOnboardingStep.NewDeviceConfirming, DeviceOnboardingStep.RestoreSeed].includes(
      deviceOnboardingState.currentOnboardingStep,
    )
  ) {
    return false;
  }

  const nbOfSeedWords = fromSeedPhraseTypeToNbOfSeedWords.get(deviceOnboardingState.seedPhraseType);

  return !!nbOfSeedWords && deviceOnboardingState.currentSeedWordIndex >= nbOfSeedWords - 2;
}

export type SyncOnboardingCompanionProps = {
  /**
   * A `Device` object
   */
  device: Device;

  /**
   * Called when the polling from the companion component has definitely lost/is desync with the device
   */
  onLostDevice: () => void;

  /**
   * Called when the companion component thinks the device is not in a correct state anymore
   */
  notifySyncOnboardingShouldReset: () => void;

  /**
   * The ref of parent container so we can scroll components into view
   */
  parentRef: RefObject<HTMLDivElement | null>;
};

/**
 * Component rendering the synchronous onboarding companion
 */
const useSyncOnboardingCompanionViewModel = ({
  device,
  onLostDevice,
  notifySyncOnboardingShouldReset,
  parentRef,
}: SyncOnboardingCompanionProps) => {
  const navigate = useNavigate();
  const isSyncIncr1Enabled = useFeature("lldSyncOnboardingIncr1")?.enabled || false;
  const servicesConfig = useFeature("protectServicesDesktop");
  const recoverRestoreStaxPath = useCustomPath(servicesConfig, "restore", "lld-onboarding-24");

  const [state, companionDispatch] = useReducer(companionReducer, initialCompanionState);
  const {
    stepKey,
    shouldRestoreApps,
    seedPathStatus,
    isNewSeed,
    isPollingOn,
    desyncOverlayDelay,
    isDesyncOverlayOpen,
    desyncTimeout,
    deviceInitiallyOnboarded,
    seedPhraseType,
    seedConfiguration,
    seededDeviceHandled,
  } = state;
  const lastCompanionStepKey = useRef<StepKey>(undefined);
  const setStepKey = useCallback((nextStepKey: StepKey) => {
    companionDispatch({ type: "GO_TO_STEP", stepKey: nextStepKey });
  }, []);

  useTrackOnboardingFlow({
    location: HOOKS_TRACKING_LOCATIONS.onboardingFlow,
    device: device,
    isTrackingEnabled: useSelector(trackingEnabledSelector),
    seedPathStatus: seedPathStatus,
  });

  const productName = device
    ? getDeviceModel(device.modelId).productName || device.modelId
    : "Ledger Device";
  const deviceName = device?.deviceName || productName;

  const {
    onboardingState: deviceOnboardingState,
    allowedError,
    fatalError,
    lockedDevice,
  } = useOnboardingStatePolling({
    getOnboardingStatePolling,
    device: device || null,
    pollingPeriodMs: POLLING_PERIOD_MS,
    stopPolling: !isPollingOn,
    allowedErrorChecks: [isAllowedOnboardingStatePollingErrorDmk],
  });

  const companionSteps = useCompanionSteps({
    device,
    setStepKey,
    shouldRestoreApps,
    deviceName,
    seedPathStatus,
    productName,
    charonStatus: deviceOnboardingState?.charonStatus,
    charonSupported: deviceOnboardingState?.charonSupported,
    isTwoStep: isSyncIncr1Enabled,
    seedConfiguration,
  });

  const steps = useMemo(
    () =>
      companionSteps.defaultSteps.map(step => {
        let stepStatus = step.status;

        if (stepStatus !== "completed") {
          stepStatus =
            step.key > stepKey ? "inactive" : step.key < stepKey ? "completed" : "active";
        }
        const title = (stepStatus === "completed" && step.titleCompleted) || step.title;

        return {
          ...step,
          title,
          status: stepStatus,
        };
      }),
    [companionSteps.defaultSteps, stepKey],
  );

  const handleDeviceReady = useCallback(() => {
    navigate("/onboarding/sync/completion", {
      state: {
        seedConfiguration,
      },
    });
  }, [navigate, seedConfiguration]);

  const handleDesyncTimerRunsOut = useCallback(() => {
    companionDispatch({ type: "CLEAR_DESYNC_WARNING" });
    onLostDevice();
    companionDispatch({ type: "STOP_POLLING" });
  }, [onLostDevice]);

  const analyticsSeedingTracked = useRef(false);
  /**
   * Analytics: track complete seeding of device
   * We use useLayoutEffect to ensure the event is sent before the following
   * step gets rendered and its corresponding analytics event gets dispatched
   */
  useLayoutEffect(() => {
    if (
      deviceInitiallyOnboarded === false && // can't just use ! operator because value can be undefined
      lastCompanionStepKey.current !== undefined &&
      lastCompanionStepKey.current <= StepKey.Seed &&
      stepKey === StepKey.Seed &&
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
      trackPage(
        `Set up ${productName}: Step 3 Seed Success`,
        undefined,
        {
          seedPhraseType: seedPhraseType
            ? fromSeedPhraseTypeToAnalyticsPropertyString.get(seedPhraseType)
            : undefined,
          seedConfiguration,
        },
        true,
        true,
      );

      analyticsSeedingTracked.current = true;
    }
    lastCompanionStepKey.current = stepKey;
  }, [
    deviceInitiallyOnboarded,
    deviceOnboardingState?.isOnboarded,
    productName,
    seedConfiguration,
    seedPathStatus,
    seedPhraseType,
    stepKey,
  ]);

  useEffect(() => {
    if (lockedDevice) {
      setDrawer(
        LockedDeviceDrawer,
        {
          deviceModelId: device.modelId,
        },
        {
          forceDisableFocusTrap: true,
          preventBackdropClick: true,
        },
      );
    }
    return () => setDrawer();
  }, [device.modelId, navigate, lockedDevice]);

  const lastProcessedDeviceOnboardingState = useRef<OnboardingState | null>(null);

  useEffect(() => {
    if (
      !deviceOnboardingState ||
      lastProcessedDeviceOnboardingState.current === deviceOnboardingState
    ) {
      return;
    }
    lastProcessedDeviceOnboardingState.current = deviceOnboardingState;

    // When the device is seeded, there are 2 cases before triggering the application install step:
    // - the user came to the sync onboarding with an non-seeded device and did a full onboarding: onboarding flag `Ready`
    // - the user came to the sync onboarding with an already seeded device: onboarding flag `WelcomeScreen1`
    // case DeviceOnboardingStep.SafetyWarning not handled so the previous step (new seed, restore, recover) is kept
    const transition = getCompanionTransitionFromOnboardingState({
      deviceOnboardingState,
      isSyncIncr1Enabled,
      hasSyncStep: companionSteps.hasSyncStep,
      seededDeviceAlreadyHandled: seededDeviceHandled,
    });

    if (transition?.shouldNotifyReset) {
      notifySyncOnboardingShouldReset();
    }

    companionDispatch({
      type: "DEVICE_ONBOARDING_STATE_CHANGED",
      deviceOnboardingState,
      transition,
      shouldExtendDesyncTiming: shouldExtendDesyncTimingForSeedGeneration(deviceOnboardingState),
    });
  }, [
    deviceOnboardingState,
    notifySyncOnboardingShouldReset,
    isSyncIncr1Enabled,
    companionSteps.hasSyncStep,
    seededDeviceHandled,
  ]);

  useEffect(() => {
    const properties = {
      flow: analyticsFlowName,
      seedConfiguration,
    };

    if (isSyncIncr1Enabled ? stepKey === StepKey.Success : stepKey === StepKey.Exit) {
      trackPage(
        `Set up ${productName}: Final Step ${productName} is ready`,
        undefined,
        properties,
        true,
        true,
      );
    } else if (isSyncIncr1Enabled && stepKey === StepKey.Apps) {
      trackPage(`Set up ${productName}: Secure your crypto`, undefined, properties, true, true);
    }
  }, [stepKey, productName, isSyncIncr1Enabled, seedConfiguration]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (stepKey >= StepKey.Sync) {
      companionDispatch({ type: "STOP_POLLING" });
    }

    if (stepKey === StepKey.Success) {
      timer = setTimeout(() => {
        companionDispatch({ type: "COMPLETE_SUCCESS_STEP" });
      }, 2000);
    } else if (stepKey === StepKey.Ready) {
      // Only app install route will go to this step.
      if (isSyncIncr1Enabled) {
        timer = setTimeout(() => setStepKey(StepKey.Exit), READY_REDIRECT_DELAY_MS);
      } else {
        setStepKey(StepKey.Exit);
      }
    } else if (stepKey === StepKey.Exit) {
      if (isSyncIncr1Enabled) {
        handleDeviceReady();
      } else {
        timer = setTimeout(handleDeviceReady, READY_REDIRECT_DELAY_MS);
      }
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [stepKey, handleDeviceReady, isSyncIncr1Enabled, setStepKey]);

  // Fatal error from the polling is not recoverable automatically
  useEffect(() => {
    if (!fatalError) {
      return;
    }
    onLostDevice();
    companionDispatch({ type: "STOP_POLLING" });
  }, [fatalError, onLostDevice]);

  useEffect(() => {
    let desyncTimer: NodeJS.Timeout | null = null;

    if (allowedError && !(allowedError instanceof LockedDeviceError)) {
      companionDispatch({ type: "START_DESYNC_WARNING" });
      desyncTimer = setTimeout(handleDesyncTimerRunsOut, desyncTimeout);
    } else {
      // desyncTimer is cleared in the useEffect cleanup function
      companionDispatch({ type: "CLEAR_DESYNC_WARNING" });
    }

    return () => {
      if (desyncTimer) {
        clearTimeout(desyncTimer);
      }
    };
  }, [device, allowedError, handleDesyncTimerRunsOut, desyncTimeout]);

  useRecoverRestoreOnboarding(seedPathStatus);

  useEffect(() => {
    if (seedPathStatus === "recover_seed" && recoverRestoreStaxPath) {
      const [pathname, search] = recoverRestoreStaxPath.split("?");

      const fullPath = search ? `${pathname}?${search}` : pathname;
      navigate(fullPath, {
        state: { fromOnboarding: true },
      });
    }
  }, [navigate, recoverRestoreStaxPath, seedPathStatus]);

  useEffect(() => {
    if (stepKey === StepKey.Success) {
      parentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else if ([StepKey.Seed, StepKey.Sync].includes(stepKey)) {
      parentRef.current?.scrollTo({ top: 700, behavior: "smooth" });
    }
  }, [seedPathStatus, stepKey, parentRef]);

  return {
    isDesyncOverlayOpen,
    desyncOverlayDelay,
    productName,
    isSyncIncr1Enabled,
    deviceName,
    steps,
    stepKey,
    companionHeaderStep: getCompanionHeaderStep(stepKey),
    companionSteps,
    seedConfiguration,
    isNewSeed,
  };
};

export default useSyncOnboardingCompanionViewModel;
