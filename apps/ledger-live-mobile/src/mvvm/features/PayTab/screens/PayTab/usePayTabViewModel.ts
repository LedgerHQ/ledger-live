import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import Config from "react-native-config";
import { useTranslation } from "~/context/Locale";
import type { CardLoginOauthConfig, OpenHostedLogin } from "@features/flow-pay-card-auth";
import type { FeatureTourProps } from "@features/flow-pay-card-feature-tour";
import type { BalanceLabels } from "@features/flow-pay-card-balance";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { usePayCardBalance } from "LLM/features/PayTab/hooks/usePayCardBalance";
import { usePayTabActionTiles } from "LLM/features/PayTab/hooks/usePayTabActionTiles";
import { usePayTabDepositOptions } from "LLM/features/PayTab/hooks/usePayTabDepositOptions";
import { usePayStablecoins } from "LLM/features/PayTab/hooks/usePayStablecoins";
import { track } from "~/analytics";

/**
 * The deep link the Pay tab already registers (see `DeeplinksProvider`), and the exact URI Baanx has
 * to have whitelisted — it must match the one sent to the token exchange, character for character.
 */
const PAY_CARD_OAUTH_REDIRECT_URI = "ledgerlive://paytab";

export function usePayTabViewModel() {
  const { top } = useNavigationBarHeights();
  const { t } = useTranslation();

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

  const openHostedLogin: OpenHostedLogin = useCallback(
    (loginUrl: string) => Linking.openURL(loginUrl),
    [],
  );

  // Baanx uses the same value for the client key header and the OAuth `client_id`, and it comes from
  // the same place the store reads it: `Config` directly, because what copies it into the env system
  // resolves asynchronously and this value is captured once.
  const oauth: CardLoginOauthConfig = useMemo(
    () => ({
      clientId: Config.CARD_BAANX_CLIENT_KEY ?? "",
      redirectUri: PAY_CARD_OAUTH_REDIRECT_URI,
    }),
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

  return {
    top,
    openHostedLogin,
    oauth,
    featureTour,
    balance,
    balanceLabels,
    actionTiles,
    depositOptions: deposit.depositOptions,
  };
}
