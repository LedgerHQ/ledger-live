import { useMemo } from "react";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useEnv from "@features/platform-env";
import { useContactsFeature } from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";
import type { ScreenName } from "~/const";
import type { CardProps } from "@features/flow-pay-card";
import type { PayTabNavigatorParamList } from "LLM/features/PayTab/types";
import type { FeatureTourProps } from "@features/flow-pay-feature-tour";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { usePayCardBalance } from "LLM/features/PayTab/hooks/usePayCardBalance";
import { usePayTabActionTiles } from "LLM/features/PayTab/hooks/usePayTabActionTiles";
import { usePayTabContacts } from "LLM/features/PayTab/hooks/usePayTabContacts";
import { usePayTabDepositOptions } from "LLM/features/PayTab/hooks/usePayTabDepositOptions";
import { usePayTabNewPayment } from "LLM/features/PayTab/hooks/usePayTabNewPayment";
import { usePayTabRequestReceive } from "LLM/features/PayTab/hooks/usePayTabRequestReceive";
import { track } from "~/analytics";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";

export function usePayTabViewModel() {
  const { top, bottom } = useNavigationBarHeights();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { params } = useRoute<RouteProp<PayTabNavigatorParamList, ScreenName.PayTab>>();

  const balance = usePayCardBalance();
  const deposit = usePayTabDepositOptions(balance.onTrackEvent);
  const request = usePayTabRequestReceive();
  const actionTiles = usePayTabActionTiles(balance.onTrackEvent, deposit.open, request.open);
  const payment = usePayTabNewPayment();
  const contacts = usePayTabContacts(payment.open);
  const { isEnabled: isContactsEnabled } = useContactsFeature("mobile");

  // Read with `useEnv`, and not with `getEnv`: a tester sets these in the debug settings, and the
  // login must take the new values without a restart of the app.
  const apiUrl = useEnv("CARD_BAANX_API_URL");
  const clientId = useEnv("CARD_BAANX_CLIENT_KEY");
  const hostedUiUrl = useEnv("CARD_BAANX_HOSTED_UI");
  const redirectUri = useEnv("CARD_OAUTH_REDIRECT_URI");

  // Baanx uses the same value for the client key header and the OAuth `client_id`.
  const oauthConfig: CardProps["login"]["oauthConfig"] = useMemo(
    () => ({
      apiUrl,
      clientId,
      hostedUiUrl,
      redirectUri,
      deepLink: PAY_TAB_DEEP_LINK,
    }),
    [apiUrl, clientId, hostedUiUrl, redirectUri],
  );

  // The OAuth redirect, when the deep link brought one. The code is the whole of it: PKCE ties it to
  // the verifier on disk, so nothing else has to be echoed back.
  const callback: CardProps["login"]["callback"] = useMemo(
    () => (params?.code ? { code: params.code } : null),
    [params?.code],
  );

  const login: CardProps["login"] = useMemo(
    () => ({ oauthConfig, callback, onTrackEvent: balance.onTrackEvent }),
    [oauthConfig, callback, balance.onTrackEvent],
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
    bottom: bottom + insets.bottom,
    cardTitle: t("payTab.card.title"),
    login,
    featureTour,
    balance,
    actionTiles,
    contacts,
    contactAddressPicker: payment.contactAddressPicker,
    isContactsEnabled,
    depositOptions: deposit.depositOptions,
    bankTransferIntro: deposit.bankTransferIntro,
  };
}
