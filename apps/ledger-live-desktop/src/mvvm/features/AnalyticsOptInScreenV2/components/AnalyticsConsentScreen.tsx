import React from "react";
import { useTranslation } from "react-i18next";
import { Logos } from "@ledgerhq/react-ui";
import { Button, Link } from "@ledgerhq/lumen-ui-react";
import { ArrowLeft, SettingsAlt2 } from "@ledgerhq/lumen-ui-react/symbols";
import Track from "~/renderer/analytics/Track";
import useTheme from "~/renderer/hooks/useTheme";
import analyticsConsentIllustrationDark from "LLD/features/AnalyticsOptInScreenV2/assets/analyticsConsentIllustrationDark.webp";
import analyticsConsentIllustrationLight from "LLD/features/AnalyticsOptInScreenV2/assets/analyticsConsentIllustrationLight.webp";
import {
  ANALYTICS_OPT_IN_SCREEN_PAGES,
  type AnalyticsOptInScreenTheme,
} from "LLD/features/AnalyticsOptInScreenV2/types";

const ANALYTICS_CONSENT_ILLUSTRATION: Record<AnalyticsOptInScreenTheme, string> = {
  dark: analyticsConsentIllustrationDark,
  light: analyticsConsentIllustrationLight,
};

export type AnalyticsConsentScreenProps = Readonly<{
  theme: AnalyticsOptInScreenTheme;
  shouldWeTrack: boolean;
  onAcceptAll: () => void;
  onRefuseAll: () => void;
  onPrevious: () => void;
  onOpenPreferences: () => void;
  onOpenTrackingPolicy: () => void;
}>;

export function AnalyticsConsentScreen({
  theme,
  shouldWeTrack,
  onAcceptAll,
  onRefuseAll,
  onPrevious,
  onOpenPreferences,
  onOpenTrackingPolicy,
}: AnalyticsConsentScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const page = ANALYTICS_OPT_IN_SCREEN_PAGES.main;
  const logoColor = theme === "dark" ? colors.neutral.c100 : colors.neutral.c00;
  const footerGradientClassName =
    theme === "dark"
      ? "bg-gradient-to-t from-black/80 from-[42.5%] to-transparent"
      : "bg-gradient-to-t from-canvas/80 to-transparent";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Track onMount mandatory={shouldWeTrack} event={page} page={page} />
      <header className="relative flex shrink-0 items-center justify-between px-24 py-40">
        <Button size="sm" appearance="no-background" onClick={onPrevious} icon={ArrowLeft}>
          {t("analyticsOptInScreen.main.ctaPrevious")}
        </Button>
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
          <Logos.LedgerLiveRegular color={logoColor} height={24} />
        </div>
        <Button
          size="sm"
          appearance="no-background"
          onClick={onOpenPreferences}
          icon={SettingsAlt2}
        >
          {t("analyticsOptInScreen.main.setPreferencesLink")}
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden px-40 text-center">
        <div className="flex w-full max-w-[645px] shrink-0 flex-col items-center gap-24">
          <h2 className="heading-2-semi-bold w-full text-base">
            {t("analyticsOptInScreen.main.title")}
          </h2>
          <p className="body-2 text-muted max-w-[479px]">
            {t("analyticsOptInScreen.main.description")}
          </p>
        </div>
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <img
            aria-hidden
            alt=""
            src={ANALYTICS_CONSENT_ILLUSTRATION[theme]}
            className="pointer-events-none max-h-full w-full max-w-[709px] object-contain"
          />
        </div>
      </div>
      <div
        className={`flex shrink-0 flex-col items-center gap-32 px-40 pb-40 ${footerGradientClassName}`}
      >
        <div className="flex gap-16">
          <Button
            appearance="transparent"
            size="md"
            className="min-w-[248px]"
            onClick={onRefuseAll}
          >
            {t("analyticsOptInScreen.main.ctaRefuseAll")}
          </Button>
          <Button appearance="base" size="md" className="min-w-[248px]" onClick={onAcceptAll}>
            {t("analyticsOptInScreen.main.ctaAcceptAll")}
          </Button>
        </div>
        <p className="body-4 text-grey text-center">
          <span>{t("analyticsOptInScreen.footer.lead")} </span>
          <Link
            onClick={e => {
              e.preventDefault();
              onOpenTrackingPolicy();
            }}
            href="#"
            appearance="inherit"
            size="inherit"
            underline
            className="cursor-pointer"
          >
            {t("analyticsOptInScreen.footer.trackingPolicyLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
