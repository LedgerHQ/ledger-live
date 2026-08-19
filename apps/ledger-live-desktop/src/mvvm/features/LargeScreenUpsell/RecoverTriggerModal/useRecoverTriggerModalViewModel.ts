import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useFeature } from "@features/platform-feature-flags";
import {
  LARGE_SCREEN_UPSELL_UTM,
  buildLargeScreenUpsellCtaLink,
} from "@features/flow-large-screen-upsell";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { useSelector } from "LLD/hooks/redux";
import { openURL } from "~/renderer/linking";
import { sharePersonalizedRecommendationsSelector } from "~/renderer/reducers/settings";
import {
  trackRecoverTriggerCtaClicked,
  trackRecoverTriggerDeeplinkClicked,
  trackRecoverTriggerDismissClicked,
  trackRecoverTriggerModalViewed,
  type RecoverTriggerDismissButton,
  type RecoverTriggerSharedAnalyticsProps,
} from "./analytics";

const DEFAULT_UPGRADE_LINK =
  FEATURE_FLAGS_DEFAULTS.largeScreenUpsell.params?.opted_in.link ??
  "https://shop.ledger.com/pages/ledger-nano-upgrade-program";

const SHARED_ANALYTICS_PROPS = {
  deviceModel: "lns",
  offerType: "none",
  platform: "lwd",
} as const;

export type RecoverTriggerModalViewProps = Readonly<{
  title: string;
  description: string;
  ctaLabel: string;
  dismissLabel: string;
  onDismiss: (button: RecoverTriggerDismissButton) => void;
  onCtaPress: () => void;
}>;

export function useRecoverTriggerModalViewModel(): RecoverTriggerModalViewProps {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const personalRecoOptIn = useSelector(sharePersonalizedRecommendationsSelector);
  const largeScreenUpsell = useFeature("largeScreenUpsell");

  const sharedProps = useMemo<RecoverTriggerSharedAnalyticsProps>(
    () => ({
      ...SHARED_ANALYTICS_PROPS,
      personalRecoOptIn,
    }),
    [personalRecoOptIn],
  );

  const ctaLink = useMemo(() => {
    const variant = personalRecoOptIn ? "opted_in" : "opted_out";
    const configuredLink =
      largeScreenUpsell?.params?.[variant].link?.trim() ||
      largeScreenUpsell?.params?.opted_in.link?.trim() ||
      DEFAULT_UPGRADE_LINK;

    return buildLargeScreenUpsellCtaLink(
      configuredLink,
      "desktop",
      LARGE_SCREEN_UPSELL_UTM.content.recover_trigger,
    );
  }, [largeScreenUpsell?.params, personalRecoOptIn]);

  useEffect(() => {
    trackRecoverTriggerModalViewed(sharedProps);
  }, [sharedProps]);

  const hasHandledInteractionRef = useRef(false);

  const leaveRecover = useCallback(() => {
    const from =
      location.key === "default"
        ? undefined
        : (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    const fromPath =
      from?.pathname && !from.pathname.startsWith("/recover")
        ? `${from.pathname}${from.search ?? ""}`
        : undefined;

    navigate(fromPath ?? "/", { replace: true });
  }, [location.key, location.state, navigate]);

  const onDismiss = useCallback(
    (button: RecoverTriggerDismissButton) => {
      if (!hasHandledInteractionRef.current) {
        hasHandledInteractionRef.current = true;
        trackRecoverTriggerDismissClicked(button, sharedProps);
      }
      leaveRecover();
    },
    [leaveRecover, sharedProps],
  );

  const onCtaPress = useCallback(() => {
    if (!hasHandledInteractionRef.current) {
      hasHandledInteractionRef.current = true;
      trackRecoverTriggerCtaClicked(sharedProps);
      trackRecoverTriggerDeeplinkClicked(sharedProps);
      if (ctaLink) {
        openURL(ctaLink);
      }
    }
    leaveRecover();
  }, [ctaLink, leaveRecover, sharedProps]);

  return {
    title: t("largeScreenUpsellModal.recoverTrigger.title"),
    description: t("largeScreenUpsellModal.recoverTrigger.subtitle"),
    ctaLabel: t("largeScreenUpsellModal.recoverTrigger.cta"),
    dismissLabel: t("largeScreenUpsellModal.recoverTrigger.dismiss"),
    onDismiss,
    onCtaPress,
  };
}
