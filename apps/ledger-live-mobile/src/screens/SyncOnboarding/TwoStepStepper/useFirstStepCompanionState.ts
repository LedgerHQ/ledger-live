import {
  OnboardingState,
  OnboardingStep as DeviceOnboardingStep,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useEffect, useRef } from "react";
import { FirstStepCompanionStepKey, SeedPathStatus } from "./types";
import { SeedOriginType } from "@ledgerhq/types-live";

interface UseFirstStepCompanionStateProps {
  deviceOnboardingState: OnboardingState | null;
  activeStep: FirstStepCompanionStepKey;
  setCompanionStep: (key: FirstStepCompanionStepKey) => void;
  /**
   * Called by the companion component to force a reset of the entire sync onboarding because the device is not in a correct state anymore
   */
  notifyEarlySecurityCheckShouldReset: () => void;
  setSeedPathStatus: (status: SeedPathStatus) => void;
  analyticsSeedConfiguration: React.MutableRefObject<SeedOriginType | undefined>;
  hasSyncStep: boolean;
}

const useFirstStepCompanionState = ({
  deviceOnboardingState,
  setCompanionStep,
  notifyEarlySecurityCheckShouldReset,
  setSeedPathStatus,
  analyticsSeedConfiguration,
  activeStep,
  hasSyncStep,
}: UseFirstStepCompanionStateProps) => {
  const seededDeviceHandled = useRef(false);

  useEffect(() => {
    let timer: null | NodeJS.Timeout = null;
    const delayedStepUpdate = (step: FirstStepCompanionStepKey) => {
      timer = setTimeout(() => setCompanionStep(step), 400);
    };

    if (
      activeStep !== FirstStepCompanionStepKey.EarlySecurityCheckCompleted &&
      deviceOnboardingState?.currentOnboardingStep === DeviceOnboardingStep.ChooseName
    ) {
      delayedStepUpdate(FirstStepCompanionStepKey.EarlySecurityCheckCompleted);
    } else if (
      activeStep === FirstStepCompanionStepKey.EarlySecurityCheckCompleted &&
      deviceOnboardingState?.currentOnboardingStep !== DeviceOnboardingStep.ChooseName
    ) {
      delayedStepUpdate(FirstStepCompanionStepKey.Pin);
    } else if (
      activeStep === FirstStepCompanionStepKey.Pin &&
      deviceOnboardingState?.currentOnboardingStep !== DeviceOnboardingStep.Pin
    ) {
      delayedStepUpdate(FirstStepCompanionStepKey.Seed);
      // When the device is seeded, there are 2 cases before triggering the applications install step:
      // - the user came to the sync onboarding with an non-seeded device and did a full onboarding: onboarding flag `Ready`
      // - the user came to the sync onboarding with an already seeded device: onboarding flag `WelcomeScreen1`
    } else if (
      activeStep === FirstStepCompanionStepKey.Seed &&
      deviceOnboardingState?.isOnboarded &&
      !seededDeviceHandled.current &&
      [DeviceOnboardingStep.Ready, DeviceOnboardingStep.WelcomeScreen1].includes(
        deviceOnboardingState.currentOnboardingStep,
      )
    ) {
      setCompanionStep(
        hasSyncStep ? FirstStepCompanionStepKey.Sync : FirstStepCompanionStepKey.Ready,
      );
      seededDeviceHandled.current = true;
      return;
    }

    // case DeviceOnboardingStep.SafetyWarning not handled so the previous step (new seed, restore, recover) is kept
    switch (deviceOnboardingState?.currentOnboardingStep) {
      // TODO: validate if this is still is required
      // Those cases could happen if the device restarted
      // case DeviceOnboardingStep.WelcomeScreen1:
      // case DeviceOnboardingStep.WelcomeScreen2:
      // case DeviceOnboardingStep.WelcomeScreen3:
      // case DeviceOnboardingStep.WelcomeScreen4:
      // case DeviceOnboardingStep.WelcomeScreenReminder:
      // case DeviceOnboardingStep.OnboardingEarlyCheck:
      //   if (activeStep === FirstStepCompanionStepKey.EarlySecurityCheckCompleted)
      //     notifyEarlySecurityCheckShouldReset();
      //   break;
      case DeviceOnboardingStep.SetupChoice:
        setSeedPathStatus("choice_new_or_restore");
        break;
      case DeviceOnboardingStep.NewDevice:
      case DeviceOnboardingStep.NewDeviceConfirming:
        setSeedPathStatus("new_seed");
        analyticsSeedConfiguration.current = "new_seed";
        break;
      case DeviceOnboardingStep.SetupChoiceRestore:
        setSeedPathStatus("choice_restore_direct_or_recover");
        break;
      case DeviceOnboardingStep.RestoreSeed:
        setSeedPathStatus("restore_seed");
        analyticsSeedConfiguration.current = "restore_seed";
        break;
      case DeviceOnboardingStep.RecoverRestore:
        setSeedPathStatus("recover_seed");
        analyticsSeedConfiguration.current = "recover_seed";
        break;
      case DeviceOnboardingStep.RestoreCharon:
        setSeedPathStatus("restore_charon");
        analyticsSeedConfiguration.current = "restore_charon";
        break;
      case DeviceOnboardingStep.BackupCharon:
        setSeedPathStatus("backup_charon");
        break;
      default:
        break;
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceOnboardingState, notifyEarlySecurityCheckShouldReset, activeStep]);
};

export default useFirstStepCompanionState;
