import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/useStartPostOnboardingCallback";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useCallback } from "react";
import { getStoreValue } from "~/store";
import {
  LedgerRecoverSubscriptionStateEnum,
  LedgerRecoverSubscriptionStateInProgressEnum,
} from "~/types/recoverSubscriptionState";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const checkCanShow = async ( protectId : string) => {
  const recoverSubscriptionState: LedgerRecoverSubscriptionStateEnum | undefined =
    await getStoreValue("SUBSCRIPTION_STATE", protectId);

  return (
    recoverSubscriptionState !== undefined &&
    (recoverSubscriptionState in LedgerRecoverSubscriptionStateInProgressEnum ||
      recoverSubscriptionState === LedgerRecoverSubscriptionStateEnum.BACKUP_DONE)
  );
},

/**
 * Returns a callback to open the post onboarding screen
 * */
export function useOpenPostOnboardingCallback() {
  const startPostOnboarding = useStartPostOnboardingCallback();
  const recoverServices = useFeature("protectServicesMobile");
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";

  return useCallback(
    async (deviceModelId: DeviceModelId) => {
      const canShowRecover = await checkCanShow(protectId)
      startPostOnboarding({
        deviceModelId: deviceModelId,
        resetNavigationStack: false,
        canShowRecover
      });
    },
    [startPostOnboarding, protectId],
  );
}
