import { useOnboardingFlow as useOnboardingFlowShared } from "@ledgerhq/live-common/hooks/useAccountOnboarding";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { OnboardingBridge, OnboardingConfig } from "../types";

// Desktop wrapper that adapts Device to deviceId for shared hook
export function useOnboardingFlow({
  creatableAccount,
  currency,
  device,
  onboardingBridge,
  onboardingConfig,
}: {
  creatableAccount: Account;
  currency: CryptoCurrency;
  device: Device;
  onboardingBridge: OnboardingBridge;
  onboardingConfig: OnboardingConfig;
}) {
  return useOnboardingFlowShared({
    creatableAccount,
    currency,
    deviceId: device.deviceId,
    onboardingBridge,
    onboardingConfig,
  });
}
