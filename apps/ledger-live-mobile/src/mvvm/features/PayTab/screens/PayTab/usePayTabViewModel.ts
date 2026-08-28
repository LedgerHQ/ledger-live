import { useMemo } from "react";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { getEnv } from "@shared/env";
import { useTranslation } from "~/context/Locale";
import type { ScreenName } from "~/const";
import type { CardProps } from "@features/flow-pay-card";
import type { PayTabNavigatorParamList } from "LLM/features/PayTab/types";
import type { FeatureTourProps } from "@features/flow-pay-feature-tour";
import type { BalanceLabels } from "@features/flow-pay-balance";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { usePayCardBalance } from "LLM/features/PayTab/hooks/usePayCardBalance";
import { usePayTabActionTiles } from "LLM/features/PayTab/hooks/usePayTabActionTiles";
import { usePayTabContacts } from "LLM/features/PayTab/hooks/usePayTabContacts";
import { usePayTabDepositOptions } from "LLM/features/PayTab/hooks/usePayTabDepositOptions";
import { usePayTabRequestReceive } from "LLM/features/PayTab/hooks/usePayTabRequestReceive";
import { track } from "~/analytics";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";

export function usePayTabViewModel() {
  const { top } = useNavigationBarHeights();
  const { t } = useTranslation();
  const { params } = useRoute<RouteProp<PayTabNavigatorParamList, ScreenName.PayTab>>();

  const balance = usePayCardBalance();
  const deposit = usePayTabDepositOptions(balance.onTrackEvent);
  const request = usePayTabRequestReceive();
  const actionTiles = usePayTabActionTiles(balance.onTrackEvent, deposit.open, request.open);
  const contacts = usePayTabContacts();

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
  const oauthConfig: CardProps["oauthConfig"] = useMemo(
    () => ({
      apiUrl: getEnv("CARD_API_URL"),
      clientId: getEnv("CARD_BAANX_CLIENT_KEY"),
      redirectUri: getEnv("CARD_OAUTH_REDIRECT_URI"),
      deepLink: PAY_TAB_DEEP_LINK,
    }),
    [],
  );

  // The OAuth redirect, when the deep link brought one. The code is the whole of it: PKCE ties it to
  // the verifier on disk, so nothing else has to be echoed back.
  const callback: CardProps["callback"] = useMemo(
    () => (params?.code ? { code: params.code } : null),
    [params?.code],
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
    cardTitle: t("payTab.card.title"),
    oauthConfig,
    callback,
    featureTour,
    balance,
    balanceLabels,
    actionTiles,
    contacts,
    depositOptions: deposit.depositOptions,
  };
}
