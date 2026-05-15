import { DeviceModelId } from "@ledgerhq/types-devices";
import { useCallback } from "react";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/useStartPostOnboardingCallback";
import { isRecoverDisplayed, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { hasStartedLedgerRecoverFlowForPostOnboarding } from "LLD/features/FinishOnboarding/RecoverWidget/recoverPortfolioWidgetVisibility";
import { getStoreValue } from "~/renderer/store";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

const hasRecoverInProgressState = (protectId: string): boolean => {
  try {
    const recoverSubscriptionState = getStoreValue<LedgerRecoverSubscriptionStateEnum>(
      "SUBSCRIPTION_STATE",
      protectId,
    );

    return hasStartedLedgerRecoverFlowForPostOnboarding(recoverSubscriptionState);
  } catch {
    return false;
  }
};

export function useOpenPostOnboardingCallback() {
  const handleStartPostOnboarding = useStartPostOnboardingCallback();
  const recoverServices = useFeature("protectServicesDesktop");
  const upsellPath = useUpsellPath(recoverServices);
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";

  return useCallback(
    ({
      deviceModelId,
      fallbackRedirection,
    }: {
      deviceModelId: DeviceModelId;
      fallbackRedirection: () => void;
    }) => {
      const canShowRecover =
        isRecoverDisplayed(recoverServices, deviceModelId) &&
        !!upsellPath &&
        hasRecoverInProgressState(protectId);
      setImmediate(() => {
        handleStartPostOnboarding({
          deviceModelId,
          fallbackIfNoAction: fallbackRedirection,
          canShowRecover,
        });
      });
    },
    [handleStartPostOnboarding, protectId, recoverServices, upsellPath],
  );
}
