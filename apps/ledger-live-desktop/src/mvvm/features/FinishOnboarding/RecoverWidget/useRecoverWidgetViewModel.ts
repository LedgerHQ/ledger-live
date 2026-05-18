import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useFeature } from "@features/platform-feature-flags";
import { isRecoverDisplayed } from "@ledgerhq/live-common/featureFlags/index";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { getStoreValue } from "~/renderer/store";
import { track } from "~/renderer/analytics/segment";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { shouldShowRecoverPortfolioWidget } from "./recoverPortfolioWidgetVisibility";

const TRACK = {
  button: "Post onboarding recover widget",
  flow: "post-onboarding",
} as const;

export type RecoverWidgetViewProps = {
  readonly isVisible: boolean;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly onOpenRecover: () => void;
};

export const RECOVER_WIDGET_TITLE_I18N_KEY = "postOnboarding.dialog.actions.recover.title";
export const RECOVER_WIDGET_DESCRIPTION_I18N_KEY =
  "postOnboarding.dialog.actions.recover.description";

export function useRecoverWidgetViewModel(): RecoverWidgetViewProps {
  const navigate = useNavigate();
  const recoverServices = useFeature("protectServicesDesktop");
  const upsellPath = useUpsellPath(recoverServices);
  const { deviceModelId } = usePostOnboardingHubState();

  const protectId = recoverServices?.params?.protectId ?? "protect-prod";
  const [subscriptionState, setSubscriptionState] = useState<LedgerRecoverSubscriptionStateEnum | undefined>(
    () => {
      try {
        return getStoreValue<LedgerRecoverSubscriptionStateEnum>("SUBSCRIPTION_STATE", protectId);
      } catch {
        return undefined;
      }
    },
  );

  useEffect(() => {
    try {
      setSubscriptionState(
        getStoreValue<LedgerRecoverSubscriptionStateEnum>("SUBSCRIPTION_STATE", protectId),
      );
    } catch {
      setSubscriptionState(undefined);
    }
  }, [protectId]);

  const isRecoverOfferAvailable = isRecoverDisplayed(recoverServices, deviceModelId ?? undefined);

  const isVisible = useMemo(() => {
    if (!isRecoverOfferAvailable) {
      return false;
    }
    if (!shouldShowRecoverPortfolioWidget(subscriptionState)) {
      return false;
    }
    if (!upsellPath) {
      return false;
    }
    return true;
  }, [isRecoverOfferAvailable, subscriptionState, upsellPath]);

  const onOpenRecover = useCallback(() => {
    if (!upsellPath) {
      return;
    }
    track("button_clicked", {
      deviceModelId,
      ...TRACK,
    });
    navigate(upsellPath);
  }, [deviceModelId, navigate, upsellPath]);

  return useMemo(
    () => ({
      isVisible,
      titleKey: RECOVER_WIDGET_TITLE_I18N_KEY,
      descriptionKey: RECOVER_WIDGET_DESCRIPTION_I18N_KEY,
      onOpenRecover,
    }),
    [isVisible, onOpenRecover],
  );
}
