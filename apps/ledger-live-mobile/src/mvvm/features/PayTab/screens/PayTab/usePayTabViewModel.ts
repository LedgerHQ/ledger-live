import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import useEnv from "@features/platform-env";
import { useContactsFeature } from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";
import type { ScreenName } from "~/const";
import type { CardProps } from "@features/flow-pay-card";
import type { PayTabNavigatorParamList } from "LLM/features/PayTab/types";
import type { FeatureTourProps } from "@features/flow-pay-feature-tour";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { usePayCardBalance } from "LLM/features/PayTab/hooks/usePayCardBalance";
import { usePayCardWalletCounterValue } from "LLM/features/PayTab/hooks/usePayCardWalletCounterValue";
import { usePayTabActionTiles } from "LLM/features/PayTab/hooks/usePayTabActionTiles";
import { usePayTabContacts } from "LLM/features/PayTab/hooks/usePayTabContacts";
import { usePayTabDepositOptions } from "LLM/features/PayTab/hooks/usePayTabDepositOptions";
import { usePayTabRequestReceive } from "LLM/features/PayTab/hooks/usePayTabRequestReceive";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector, localeSelector } from "~/reducers/settings";
import { track } from "~/analytics";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";

export function usePayTabViewModel() {
  const { top, bottom } = useNavigationBarHeights();
  const { t } = useTranslation();
  const { params } = useRoute<RouteProp<PayTabNavigatorParamList, ScreenName.PayTab>>();
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const unit = counterValueCurrency.units[0];

  const balance = usePayCardBalance();
  const resolveCardWalletCounterValue = usePayCardWalletCounterValue();
  const deposit = usePayTabDepositOptions(balance.onTrackEvent);
  const request = usePayTabRequestReceive();
  const actionTiles = usePayTabActionTiles(balance.onTrackEvent, deposit.open, request.open);
  const contacts = usePayTabContacts();
  const { isEnabled: isContactsEnabled } = useContactsFeature("mobile");

  const formatCountervalue: CardProps["formatCountervalue"] = useCallback(
    (value: number) =>
      formatCurrencyUnitFragment(unit, new BigNumber(value), { locale, showCode: true }),
    [unit, locale],
  );

  // Read with `useEnv`, and not with `getEnv`: a tester sets these in the debug settings, and the
  // login must take the new values without a restart of the app.
  const apiUrl = useEnv("CARD_API_URL");
  const clientId = useEnv("CARD_BAANX_CLIENT_KEY");
  const redirectUri = useEnv("CARD_OAUTH_REDIRECT_URI");

  // Baanx uses the same value for the client key header and the OAuth `client_id`.
  const oauthConfig: CardProps["oauthConfig"] = useMemo(
    () => ({
      apiUrl,
      clientId,
      redirectUri,
      deepLink: PAY_TAB_DEEP_LINK,
    }),
    [apiUrl, clientId, redirectUri],
  );

  // The OAuth redirect, when the deep link brought one. The code is the whole of it: PKCE ties it to
  // the verifier on disk, so nothing else has to be echoed back.
  const callback: CardProps["callback"] = useMemo(
    () => (params?.code ? { code: params.code } : null),
    [params?.code],
  );

  const featureTour: FeatureTourProps = useMemo(
    () => ({
      onTrackScreen: (page: string) => track(page),
      onTrackEvent: (event: string, params: Record<string, unknown>) => track(event, params),
    }),
    [],
  );

  return {
    top,
    bottom,
    cardTitle: t("payTab.card.title"),
    cardBalanceLabel: t("payTab.card.balanceLabel"),
    formatCountervalue,
    resolveCardWalletCounterValue,
    oauthConfig,
    callback,
    featureTour,
    balance,
    actionTiles,
    contacts,
    isContactsEnabled,
    depositOptions: deposit.depositOptions,
    bankTransferIntro: deposit.bankTransferIntro,
  };
}
