import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { FeatureTourProps } from "@features/flow-pay-feature-tour";
import { track } from "~/renderer/analytics/segment";

export function usePayTabFeatureTour(): FeatureTourProps {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("payTab.featureTour.title"),
      description: t("payTab.featureTour.description"),
      ctaLabel: t("payTab.featureTour.cta"),
      rows: [
        {
          icon: "Globe",
          title: t("payTab.featureTour.rows.global.title"),
          description: t("payTab.featureTour.rows.global.description"),
        },
        {
          icon: "Chart5",
          title: t("payTab.featureTour.rows.volatility.title"),
          description: t("payTab.featureTour.rows.volatility.description"),
        },
        {
          icon: "CreditCard",
          title: t("payTab.featureTour.rows.card.title"),
          description: t("payTab.featureTour.rows.card.description"),
        },
      ],
      onTrackScreen: (page: string) => track(page),
      onTrackEvent: (event: string, params: Record<string, unknown>) => track(event, params),
    }),
    [t],
  );
}
