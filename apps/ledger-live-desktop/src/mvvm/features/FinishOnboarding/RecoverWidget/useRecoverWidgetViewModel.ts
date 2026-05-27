import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useFeature } from "@features/platform-feature-flags";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useRecoverBannerState } from "~/renderer/hooks/useRecoverBannerState";
import { track } from "~/renderer/analytics/segment";
import { shouldShowRecoverPortfolioWidget } from "./recoverPortfolioWidgetVisibility";

const TRACK = {
  button: "Post onboarding recover widget",
  flow: "post-onboarding",
} as const;

export type RecoverWidgetViewProps = {
  readonly shouldDisplay: boolean;
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
  const {
    data: { subscriptionState, displayBanner },
  } = useRecoverBannerState(protectId);

  const bannerNotificationEnabled =
    recoverServices?.params?.bannerSubscriptionNotification ?? false;

  const shouldDisplay = useMemo(
    () =>
      bannerNotificationEnabled &&
      shouldShowRecoverPortfolioWidget(subscriptionState) &&
      !!upsellPath &&
      displayBanner,
    [bannerNotificationEnabled, subscriptionState, displayBanner, upsellPath],
  );

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
      shouldDisplay,
      titleKey: RECOVER_WIDGET_TITLE_I18N_KEY,
      descriptionKey: RECOVER_WIDGET_DESCRIPTION_I18N_KEY,
      onOpenRecover,
    }),
    [shouldDisplay, onOpenRecover],
  );
}
