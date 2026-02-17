import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { getDeviceModel } from "@ledgerhq/devices";
import { SeedOriginType, SeedPhraseType } from "@ledgerhq/types-live";
import {
  OnboardingStep as DeviceOnboardingStep,
  fromSeedPhraseTypeToNbOfSeedWords,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
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
import useCompanionSteps, {
  READY_REDIRECT_DELAY_MS,
  Step,
  StepKey,
} from "./hooks/useCompanionSteps";
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
  parentRef: React.MutableRefObject<HTMLDivElement | null>;

  /**
   * Set state to control header
   */
  setCompanionStep: (currentStep: "first-step" | "second-step") => void;
};

/**
 * Component rendering the synchronous onboarding companion
 */
const useSyncOnboardingCompanionViewModel = ({
  device,
  onLostDevice,
  notifySyncOnboardingShouldReset,
  parentRef,
  setCompanionStep,
}: SyncOnboardingCompanionProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isSyncIncr1Enabled = useFeature("lldSyncOnboardingIncr1")?.enabled || false;
  const servicesConfig = useFeature("protectServicesDesktop");
  const recoverRestoreStaxPath = useCustomPath(servicesConfig, "restore", "lld-onboarding-24");

  const [stepKey, setStepKey] = useState<StepKey>(StepKey.Paired);
  const [shouldRestoreApps, setShouldRestoreApps] = useState<boolean>(false);
  const lastCompanionStepKey = useRef<StepKey>();
  const [seedPathStatus, setSeedPathStatus] = useState<SeedPathStatus>("choice_new_or_restore");
  const [isNewSeed, setIsNewSeed] = useState<boolean>(false);

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

  const [isPollingOn, setIsPollingOn] = useState<boolean>(true);

  const [desyncOverlayDelay, setDesyncOverlayDelay] = useState<number>(DESYNC_OVERLAY_DELAY_MS);
  const [isDesyncOverlayOpen, setIsDesyncOverlayOpen] = useState<boolean>(false);
  const [desyncTimeout, setDesyncTimeout] = useState<number>(DESYNC_TIMEOUT_MS);

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

  const analyticsSeedConfiguration = useRef<SeedOriginType>();

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
    seedConfiguration: analyticsSeedConfiguration.current,
  });

  const [steps, setSteps] = useState<Step[]>(companionSteps.defaultSteps);

  const handleDeviceReady = useCallback(() => {
    navigate("/onboarding/sync/completion", {
      state: {
        seedConfiguration: analyticsSeedConfiguration.current,
      },
    });
  }, [navigate]);

  const handleDesyncTimerRunsOut = useCallback(() => {
    setIsDesyncOverlayOpen(false);
    onLostDevice();
    setIsPollingOn(false);
  }, [onLostDevice]);

  useEffect(() => {
    if (stepKey > StepKey.Seed) {
      setCompanionStep("second-step");
    } else {
      setCompanionStep("first-step");
    }
  }, [stepKey, setCompanionStep]);

  useEffect(() => {
    if (!deviceOnboardingState) return;
    if (deviceInitiallyOnboarded.current === undefined)
      deviceInitiallyOnboarded.current = deviceOnboardingState.isOnboarded;
    if (
      !deviceOnboardingState.isOnboarded && // onboarding state flags can only be trusted for a non-onboarded/non-seeded device
      deviceOnboardingState.seedPhraseType
    )
      analyticsSeedPhraseType.current = deviceOnboardingState.seedPhraseType;
  }, [deviceOnboardingState]);

  const analyticsSeedingTracked = useRef(false);
  /**
   * Analytics: track complete seeding of device
   * We use useLayoutEffect to ensure the event is sent before the following
   * step gets rendered and its corresponding analytics event gets dispatched
   */
  useLayoutEffect(() => {
    if (
      deviceInitiallyOnboarded.current === false && // can't just use ! operator because value can be undefined
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
          seedPhraseType: analyticsSeedPhraseType.current
            ? fromSeedPhraseTypeToAnalyticsPropertyString.get(analyticsSeedPhraseType.current)
            : undefined,
          seedConfiguration: analyticsSeedConfiguration.current,
        },
        true,
        true,
      );

      analyticsSeedingTracked.current = true;
    }
    lastCompanionStepKey.current = stepKey;
  }, [deviceOnboardingState?.isOnboarded, productName, seedPathStatus, stepKey]);

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

  const seededDeviceHandled = useRef(false);

  useEffect(() => {
    // When the device is seeded, there are 2 cases before triggering the application install step:
    // - the user came to the sync onboarding with an non-seeded device and did a full onboarding: onboarding flag `Ready`
    // - the user came to the sync onboarding with an already seeded device: onboarding flag `WelcomeScreen1`
    if (
      deviceOnboardingState?.isOnboarded &&
      !seededDeviceHandled.current &&
      [DeviceOnboardingStep.Ready, DeviceOnboardingStep.WelcomeScreen1].includes(
        deviceOnboardingState.currentOnboardingStep,
      )
    ) {
      let nextStepKey = StepKey.Apps;
      if (isSyncIncr1Enabled) {
        nextStepKey = companionSteps.hasSyncStep ? StepKey.Sync : StepKey.Success;
      }
      setStepKey(nextStepKey);
      seededDeviceHandled.current = true;
      return;
    }

    // case DeviceOnboardingStep.SafetyWarning not handled so the previous step (new seed, restore, recover) is kept
    switch (deviceOnboardingState?.currentOnboardingStep) {
      // Those cases could happen if the device restarted
      case DeviceOnboardingStep.WelcomeScreen1:
      case DeviceOnboardingStep.WelcomeScreen2:
      case DeviceOnboardingStep.WelcomeScreen3:
      case DeviceOnboardingStep.WelcomeScreen4:
      case DeviceOnboardingStep.WelcomeScreenReminder:
      case DeviceOnboardingStep.OnboardingEarlyCheck:
        notifySyncOnboardingShouldReset();
        break;

      case DeviceOnboardingStep.ChooseName:
        setStepKey(StepKey.Paired);
        break;
      case DeviceOnboardingStep.SetupChoice:
        setStepKey(StepKey.Seed);
        setSeedPathStatus("choice_new_or_restore");
        break;
      case DeviceOnboardingStep.NewDevice:
      case DeviceOnboardingStep.NewDeviceConfirming:
        setShouldRestoreApps(false);
        setStepKey(StepKey.Seed);
        setSeedPathStatus("new_seed");
        setIsNewSeed(true);
        analyticsSeedConfiguration.current = "new_seed";
        break;
      case DeviceOnboardingStep.SetupChoiceRestore:
        setStepKey(StepKey.Seed);
        setSeedPathStatus("choice_restore_direct_or_recover");
        break;
      case DeviceOnboardingStep.RestoreSeed:
        setShouldRestoreApps(true);
        setStepKey(StepKey.Seed);
        setSeedPathStatus("restore_seed");
        setIsNewSeed(false);
        analyticsSeedConfiguration.current = "restore_seed";
        break;
      case DeviceOnboardingStep.RecoverRestore:
        setShouldRestoreApps(true);
        setStepKey(StepKey.Seed);
        setSeedPathStatus("recover_seed");
        setIsNewSeed(false);
        analyticsSeedConfiguration.current = "recover_seed";
        break;
      case DeviceOnboardingStep.BackupCharon:
        setStepKey(StepKey.Seed);
        setSeedPathStatus("backup_charon");
        break;
      case DeviceOnboardingStep.RestoreCharon:
        setStepKey(StepKey.Seed);
        setSeedPathStatus("restore_charon");
        setIsNewSeed(false);
        analyticsSeedConfiguration.current = "restore_charon";
        break;
      case DeviceOnboardingStep.Pin:
        setStepKey(StepKey.Pin);
        break;
      default:
        break;
    }
  }, [
    deviceOnboardingState,
    notifySyncOnboardingShouldReset,
    isSyncIncr1Enabled,
    companionSteps.hasSyncStep,
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
        setDesyncOverlayDelay(LONG_DESYNC_OVERLAY_DELAY_MS);
        setDesyncTimeout(LONG_DESYNC_TIMEOUT_MS);
      }
    }
  }, [deviceOnboardingState]);

  useEffect(() => {
    const properties = {
      flow: analyticsFlowName,
      seedConfiguration: analyticsSeedConfiguration.current,
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
  }, [stepKey, productName, isSyncIncr1Enabled]);

  useEffect(() => {
    if (stepKey >= StepKey.Sync) {
      setIsPollingOn(false);
    }

    if (stepKey === StepKey.Ready) {
      // Only app install route will go to this step
      if (isSyncIncr1Enabled) {
        setTimeout(() => setStepKey(StepKey.Exit), READY_REDIRECT_DELAY_MS);
      } else {
        setStepKey(StepKey.Exit);
      }
    }

    if (stepKey === StepKey.Exit) {
      if (isSyncIncr1Enabled) {
        handleDeviceReady();
      } else {
        setTimeout(handleDeviceReady, READY_REDIRECT_DELAY_MS);
      }
    }

    setSteps(
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
    );
  }, [stepKey, companionSteps.defaultSteps, handleDeviceReady, productName, isSyncIncr1Enabled]);

  // Fatal error from the polling is not recoverable automatically
  useEffect(() => {
    if (!fatalError) {
      return;
    }
    onLostDevice();
    setIsPollingOn(false);
  }, [fatalError, onLostDevice]);

  useEffect(() => {
    let desyncTimer: NodeJS.Timeout | null = null;

    if (allowedError && !(allowedError instanceof LockedDeviceError)) {
      setIsDesyncOverlayOpen(true);
      desyncTimer = setTimeout(handleDesyncTimerRunsOut, desyncTimeout);
    } else {
      // desyncTimer is cleared in the useEffect cleanup function
      setIsDesyncOverlayOpen(false);
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

      navigate(`${pathname}${search ? `?${search}` : ""}`, {
        state: { fromOnboarding: true },
      });
    }
  }, [dispatch, navigate, recoverRestoreStaxPath, seedPathStatus]);

  useEffect(() => {
    if (stepKey === StepKey.Success) {
      parentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else if ([StepKey.Seed, StepKey.Sync].includes(stepKey)) {
      parentRef.current?.scrollTo({ top: 700, behavior: "smooth" });
    }
  }, [seedPathStatus, stepKey, parentRef]);

  useEffect(() => {
    if (stepKey === StepKey.Success) {
      const timer = setTimeout(() => {
        setStepKey(StepKey.Apps);
      }, 2000);

      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [stepKey]);

  return {
    isDesyncOverlayOpen,
    desyncOverlayDelay,
    productName,
    isSyncIncr1Enabled,
    deviceName,
    steps,
    stepKey,
    companionSteps,
    analyticsSeedConfiguration,
    isNewSeed,
  };
};

export default useSyncOnboardingCompanionViewModel;
