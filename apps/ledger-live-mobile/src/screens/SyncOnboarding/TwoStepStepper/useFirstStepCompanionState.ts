import { OnboardingState } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useEffect, useRef } from "react";
import { FirstStepCompanionStepKey } from "./useCompanionSteps";
import { OnboardingStep as DeviceOnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { SeedPathStatus } from "./FirstStepSyncOnboarding";
import { SeedOriginType } from "@ledgerhq/types-live";

interface UseFirstStepCompanionStateProps {
  deviceOnboardingState: OnboardingState | null;
  setCompanionStep: (key: FirstStepCompanionStepKey) => void;
  /**
   * Called by the companion component to force a reset of the entire sync onboarding because the device is not in a correct state anymore
   */
  notifyEarlySecurityCheckShouldReset: () => void;
  setSeedPathStatus: (status: SeedPathStatus) => void;
  analyticsSeedConfiguration: React.MutableRefObject<SeedOriginType | undefined>;
}

const useFirstStepCompanionState = ({
  deviceOnboardingState,
  setCompanionStep,
  notifyEarlySecurityCheckShouldReset,
  setSeedPathStatus,
  analyticsSeedConfiguration,
}: UseFirstStepCompanionStateProps) => {
  const seededDeviceHandled = useRef(false);

  useEffect(() => {
    // When the device is seeded, there are 2 cases before triggering the applications install step:
    // - the user came to the sync onboarding with an non-seeded device and did a full onboarding: onboarding flag `Ready`
    // - the user came to the sync onboarding with an already seeded device: onboarding flag `WelcomeScreen1`
    if (
      deviceOnboardingState?.isOnboarded &&
      !seededDeviceHandled.current &&
      [DeviceOnboardingStep.Ready, DeviceOnboardingStep.WelcomeScreen1].includes(
        deviceOnboardingState.currentOnboardingStep,
      )
    ) {
      setCompanionStep(FirstStepCompanionStepKey.Ready);
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
        notifyEarlySecurityCheckShouldReset();
        break;

      case DeviceOnboardingStep.ChooseName:
        setCompanionStep(FirstStepCompanionStepKey.EarlySecurityCheckCompleted);
        break;
      case DeviceOnboardingStep.Pin:
        setCompanionStep(FirstStepCompanionStepKey.Pin);
        break;
      case DeviceOnboardingStep.SetupChoice:
        setCompanionStep(FirstStepCompanionStepKey.Seed);
        setSeedPathStatus("choice_new_or_restore");
        break;
      case DeviceOnboardingStep.NewDevice:
      case DeviceOnboardingStep.NewDeviceConfirming:
        setCompanionStep(FirstStepCompanionStepKey.Seed);
        setSeedPathStatus("new_seed");
        analyticsSeedConfiguration.current = "new_seed";
        break;
      case DeviceOnboardingStep.SetupChoiceRestore:
        setCompanionStep(FirstStepCompanionStepKey.Seed);
        setSeedPathStatus("choice_restore_direct_or_recover");
        break;
      case DeviceOnboardingStep.RestoreSeed:
        setCompanionStep(FirstStepCompanionStepKey.Seed);
        setSeedPathStatus("restore_seed");
        analyticsSeedConfiguration.current = "restore_seed";
        break;
      case DeviceOnboardingStep.RecoverRestore:
        setCompanionStep(FirstStepCompanionStepKey.Seed);
        setSeedPathStatus("recover_seed");
        analyticsSeedConfiguration.current = "recover_seed";
        break;
      case DeviceOnboardingStep.RestoreCharon:
        setCompanionStep(FirstStepCompanionStepKey.Seed);
        setSeedPathStatus("restore_charon");
        analyticsSeedConfiguration.current = "restore_charon";
        break;
      case DeviceOnboardingStep.BackupCharon:
        setCompanionStep(FirstStepCompanionStepKey.Seed);
        setSeedPathStatus("backup_charon");
        break;
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceOnboardingState, notifyEarlySecurityCheckShouldReset]);
};

export default useFirstStepCompanionState;
