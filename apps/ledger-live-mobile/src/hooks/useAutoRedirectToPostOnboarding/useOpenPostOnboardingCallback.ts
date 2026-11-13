import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/useStartPostOnboardingCallback";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useCallback } from "react";
import { getStoreValue } from "~/store";
import {
  LedgerRecoverSubscriptionStateEnum,
  LedgerRecoverSubscriptionStateInProgressEnum,
} from "~/types/recoverSubscriptionState";
import { useFeature } from "@features/platform-feature-flags";

const checkCanShow = async (protectId: string) => {
  try {
    const recoverSubscriptionState: LedgerRecoverSubscriptionStateEnum | undefined =
      await getStoreValue("SUBSCRIPTION_STATE", protectId);

    return (
      recoverSubscriptionState !== undefined &&
      (recoverSubscriptionState in LedgerRecoverSubscriptionStateInProgressEnum ||
        recoverSubscriptionState === LedgerRecoverSubscriptionStateEnum.BACKUP_DONE)
    );
  } catch {
    return false;
  }
};

/**
 * Returns a callback to open the post onboarding screen, resolving to whether it navigated
 * */
export function useOpenPostOnboardingCallback() {
  const startPostOnboarding = useStartPostOnboardingCallback();
  const recoverServices = useFeature("protectServicesMobile");
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";

  return useCallback(
    async (deviceModelId: DeviceModelId): Promise<boolean> => {
      const canShowRecover = await checkCanShow(protectId);
      let hasNavigated = true;
      startPostOnboarding({
        deviceModelId: deviceModelId,
        resetNavigationStack: false,
        canShowRecover,
        fallbackIfNoAction: () => {
          hasNavigated = false;
        },
      });
      return hasNavigated;
    },
    [startPostOnboarding, protectId],
  );
}
