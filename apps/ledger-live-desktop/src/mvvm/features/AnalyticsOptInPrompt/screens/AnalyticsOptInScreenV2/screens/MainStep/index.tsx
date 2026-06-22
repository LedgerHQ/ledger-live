import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Link } from "@ledgerhq/lumen-ui-react";
import Track from "~/renderer/analytics/Track";
import { ANALYTICS_OPT_IN_SCREEN_B_PAGES } from "../../types";
import { AnalyticsOptInScreenBConsentFooter } from "../../components/AnalyticsOptInScreenBConsentFooter";

export type AnalyticsOptInScreenBMainStepProps = Readonly<{
  shouldWeTrack: boolean;
  onAcceptAll: () => void;
  onRefuseAll: () => void;
  onOpenPreferences: () => void;
  onOpenTrackingPolicy: () => void;
}>;

export function AnalyticsOptInScreenBMainStep({
  shouldWeTrack,
  onAcceptAll,
  onRefuseAll,
  onOpenPreferences,
  onOpenTrackingPolicy,
}: AnalyticsOptInScreenBMainStepProps) {
  const { t } = useTranslation();
  const page = ANALYTICS_OPT_IN_SCREEN_B_PAGES.main;

  return (
    <div className="flex h-full flex-col">
      <Track onMount mandatory={shouldWeTrack} event={page} page={page} />
      <div className="flex flex-1 flex-col items-center justify-center px-40 pt-64 text-center">
        <h2 className="heading-2-semi-bold mb-24 text-base">
          {t("analyticsOptInScreenB.main.title")}
        </h2>
        <p className="body-2 text-muted mb-24 max-w-[479px]">
          {t("analyticsOptInScreenB.main.description")}
        </p>
        <p className="body-2 text-muted">
          <span>{t("analyticsOptInScreenB.main.setPreferencesPrefix")}</span>
          <Link
            onClick={event => {
              event.preventDefault();
              onOpenPreferences();
            }}
            href="#"
            appearance="accent"
            size="sm"
            underline={false}
            style={{ padding: 1 }}
          >
            {t("analyticsOptInScreenB.main.setPreferencesLink")}
          </Link>
        </p>
      </div>
      <div className="flex flex-col items-center gap-32 bg-gradient-to-t from-black/80 to-transparent px-40 py-40">
        <div className="flex gap-16">
          <Button appearance="gray" size="lg" className="min-w-[248px]" onClick={onRefuseAll}>
            {t("analyticsOptInScreenB.main.ctaRefuseAll")}
          </Button>
          <Button appearance="base" size="lg" className="min-w-[248px]" onClick={onAcceptAll}>
            {t("analyticsOptInScreenB.main.ctaAcceptAll")}
          </Button>
        </div>
        <AnalyticsOptInScreenBConsentFooter onOpenTrackingPolicy={onOpenTrackingPolicy} />
      </div>
    </div>
  );
}
