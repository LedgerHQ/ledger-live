import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { isRecoverDisplayed, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { getStoreValue } from "~/renderer/store";
import { track } from "~/renderer/analytics/segment";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

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
  const { postOnboardingInProgress, deviceModelId } = usePostOnboardingHubState();

  const protectId = recoverServices?.params?.protectId ?? "protect-prod";
  const [subscriptionState, setSubscriptionState] = useState<
    LedgerRecoverSubscriptionStateEnum | undefined | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const value = await getStoreValue("SUBSCRIPTION_STATE", protectId);
        if (!cancelled) {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          setSubscriptionState(value as LedgerRecoverSubscriptionStateEnum);
        }
      } catch {
        if (!cancelled) {
          setSubscriptionState(undefined);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [protectId]);

  const isRecoverOfferAvailable = isRecoverDisplayed(recoverServices, deviceModelId ?? undefined);

  const isVisible = useMemo(() => {
    if (subscriptionState === null) {
      return false;
    }
    if (!postOnboardingInProgress) {
      return false;
    }
    if (!isRecoverOfferAvailable) {
      return false;
    }
    if (subscriptionState === LedgerRecoverSubscriptionStateEnum.BACKUP_DONE) {
      return false;
    }
    if (!upsellPath) {
      return false;
    }
    return true;
  }, [isRecoverOfferAvailable, postOnboardingInProgress, subscriptionState, upsellPath]);

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
