import { useMemo } from "react";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { getEnv } from "@shared/env";
import { useTranslation } from "~/context/Locale";
import type { ScreenName } from "~/const";
import type { CardLoginOauthConfig, PayCardAuthCallback } from "@features/flow-pay-card-auth";
import type { PayTabNavigatorParamList } from "LLM/features/PayTab/types";
import type { FeatureTourProps } from "@features/flow-pay-card-feature-tour";
import type { BalanceLabels } from "@features/flow-pay-card-balance";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { usePayCardBalance } from "LLM/features/PayTab/hooks/usePayCardBalance";
import { usePayTabActionTiles } from "LLM/features/PayTab/hooks/usePayTabActionTiles";
import { usePayTabDepositOptions } from "LLM/features/PayTab/hooks/usePayTabDepositOptions";
import { usePayStablecoins } from "LLM/features/PayTab/hooks/usePayStablecoins";
import { track } from "~/analytics";

export function usePayTabViewModel() {
  const { top } = useNavigationBarHeights();
  const { t } = useTranslation();
  const { params } = useRoute<RouteProp<PayTabNavigatorParamList, ScreenName.PayTab>>();

  const balance = usePayCardBalance();
  const { defaultStablecoins } = usePayStablecoins();
  const deposit = usePayTabDepositOptions(
    balance.onTrackEvent,
    defaultStablecoins.map(stablecoin => stablecoin.id),
  );
  const actionTiles = usePayTabActionTiles(balance.onTrackEvent, deposit.open);

  const balanceLabels: BalanceLabels = useMemo(
    () => ({
      emptyTitle: t("payTab.balance.emptyTitle"),
      emptyDescription: t("payTab.balance.emptyDescription"),
      allStablecoins: t("payTab.balance.filter.allStablecoins"),
      filterDialogTitle: t("payTab.balance.filter.dialogTitle"),
      filterDialogDescription: t("payTab.balance.filter.dialogDescription"),
      filterDialogBanner: t("payTab.balance.filter.dialogBanner"),
      confirm: t("payTab.balance.filter.confirm"),
    }),
    [t],
  );

  // Baanx uses the same value for the client key header and the OAuth `client_id`.
  const oauthConfig: CardLoginOauthConfig = useMemo(
    () => ({
      clientId: getEnv("CARD_BAANX_CLIENT_KEY"),
      redirectUri: getEnv("CARD_OAUTH_REDIRECT_URI"),
    }),
    [],
  );

  // The OAuth redirect, when the deep link brought one. Both halves must be there to mean anything.
  const callback: PayCardAuthCallback | null = useMemo(
    () => (params?.code && params?.state ? { code: params.code, state: params.state } : null),
    [params?.code, params?.state],
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

  return {
    top,
    oauthConfig,
    callback,
    featureTour,
    balance,
    balanceLabels,
    actionTiles,
    depositOptions: deposit.depositOptions,
  };
}
