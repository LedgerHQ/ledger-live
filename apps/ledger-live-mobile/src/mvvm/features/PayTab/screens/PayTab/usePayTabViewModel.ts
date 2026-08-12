import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { useTranslation } from "~/context/Locale";
import type { OpenHostedLogin } from "@features/flow-pay-card-auth";
import type { FeatureTourProps } from "@features/flow-pay-card-feature-tour";
import type { PayCardBalanceLabels } from "@features/flow-pay-card-balance";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { usePayCardBalance } from "LLM/features/PayTab/hooks/usePayCardBalance";
import { track } from "~/analytics";

export function usePayTabViewModel() {
  const { top } = useNavigationBarHeights();
  const { t } = useTranslation();

  const balance = usePayCardBalance();

  const balanceLabels: PayCardBalanceLabels = useMemo(
    () => ({
      emptyTitle: t("payTab.balance.emptyTitle"),
      emptyDescription: t("payTab.balance.emptyDescription"),
    }),
    [t],
  );

  const openHostedLogin: OpenHostedLogin = useCallback(
    (loginUrl: string) => Linking.openURL(loginUrl),
    [],
  );

  const featureTour: FeatureTourProps = useMemo(
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

  return { top, openHostedLogin, featureTour, balance, balanceLabels };
}
