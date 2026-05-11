import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { isRecoverDisplayed, useFeature } from "@ledgerhq/live-common/featureFlags/index";
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
  readonly isVisible: boolean;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly onOpenRecover: () => void;
};

/** View-model output; includes portfolio-only gating so parents read `useRecoverBannerState` once (here). */
export type RecoverWidgetViewModelResult = RecoverWidgetViewProps & {
  /** Same as rendering `RecoverWidget` in the Wallet40 portfolio row: offer visible and banner not dismissed. */
  readonly shouldDisplayRecoverInPortfolioBannerRow: boolean;
};

export const RECOVER_WIDGET_TITLE_I18N_KEY = "postOnboarding.dialog.actions.recover.title";
export const RECOVER_WIDGET_DESCRIPTION_I18N_KEY =
  "postOnboarding.dialog.actions.recover.description";

export function useRecoverWidgetViewModel(): RecoverWidgetViewModelResult {
  const navigate = useNavigate();
  const recoverServices = useFeature("protectServicesDesktop");
  const upsellPath = useUpsellPath(recoverServices);
  const { deviceModelId } = usePostOnboardingHubState();

  const protectId = recoverServices?.params?.protectId ?? "protect-prod";
  const {
    data: { subscriptionState, displayBanner },
  } = useRecoverBannerState(protectId);

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

  const shouldDisplayRecoverInPortfolioBannerRow = useMemo(
    () => isVisible && displayBanner,
    [displayBanner, isVisible],
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
      isVisible,
      shouldDisplayRecoverInPortfolioBannerRow,
      titleKey: RECOVER_WIDGET_TITLE_I18N_KEY,
      descriptionKey: RECOVER_WIDGET_DESCRIPTION_I18N_KEY,
      onOpenRecover,
    }),
    [isVisible, onOpenRecover, shouldDisplayRecoverInPortfolioBannerRow],
  );
}
