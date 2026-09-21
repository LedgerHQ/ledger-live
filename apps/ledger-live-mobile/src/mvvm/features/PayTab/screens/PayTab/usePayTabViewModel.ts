import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  buildHostedUrl,
  buildTopUpPath,
  buildAccessBaanxPath,
  openHostedLoginInSecureBrowser,
  MANAGE_PIN_PATH,
  openHostedPageInSecureBrowser,
  openHostedPageSafely,
  type OpenCardHostedPage,
} from "@features/flow-pay-card-auth";
import { readCardUsEnv } from "@features/platform-card";
import useEnv from "@features/platform-env";
import { useContactsFeature } from "@features/platform-contacts";
import type { CardSettingsActions } from "@features/flow-pay-card-details";
import type { ScreenName } from "~/const";
import type { CardProps } from "@features/flow-pay-card";
import { urls } from "~/utils/urls";
import { usePayCardAssets } from "../../hooks/usePayCardAssets";
import { useCountervalueFormatter } from "../../hooks/useCountervalueFormatter";
import type { PayTabNavigatorParamList } from "LLM/features/PayTab/types";
import type { FeatureTourProps } from "@features/flow-pay-feature-tour";
import { navigateToCardHistory } from "LLM/features/OperationsHistory/utils/navigateToCardHistory";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { useAppProtectionPrompt } from "LLM/features/AppLock/AppProtectionPrompt";
import { usePayCardBalance } from "LLM/features/PayTab/hooks/usePayCardBalance";
import { usePayTabActionTiles } from "LLM/features/PayTab/hooks/usePayTabActionTiles";
import { usePayTabContacts } from "LLM/features/PayTab/hooks/usePayTabContacts";
import { usePayTabDepositOptions } from "LLM/features/PayTab/hooks/usePayTabDepositOptions";
import { usePayTabNewPayment } from "LLM/features/PayTab/hooks/usePayTabNewPayment";
import { usePayTabRequestReceive } from "LLM/features/PayTab/hooks/usePayTabRequestReceive";
import { track } from "~/analytics";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";
import type { CardAssetRow } from "@features/flow-pay-card-assets";

export function usePayTabViewModel() {
  const { top, bottom } = useNavigationBarHeights();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
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
  const usAppId = useEnv("CARD_BAANX_US_APP_ID");

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

  const { requestProtection } = useAppProtectionPrompt();

  // The OAuth redirect, when the deep link brought one. PKCE ties the code to the verifier on disk,
  // so nothing else has to be echoed back, but the app id names the provider tenant to route on.
  const callback: CardProps["login"]["callback"] = useMemo(
    () =>
      params?.code
        ? { code: params.code, ...(params.app_id ? { appId: params.app_id } : {}) }
        : null,
    [params?.code, params?.app_id],
  );

  const onTopUp = useCallback(async () => {
    try {
      const isUsCardHolder = await readCardUsEnv(usAppId);
      const topUpUrl = buildHostedUrl(hostedUiUrl, buildTopUpPath(isUsCardHolder ? usAppId : null));

      await openHostedLoginInSecureBrowser(topUpUrl, PAY_TAB_DEEP_LINK);
    } catch {
      console.warn("[card] the top up page did not open");
    }
  }, [hostedUiUrl, usAppId]);

  const login: CardProps["login"] = useMemo(
    () => ({ oauthConfig, callback, onTrackEvent: balance.onTrackEvent, requestProtection }),
    [oauthConfig, callback, balance.onTrackEvent, requestProtection],
  );

  const onShowMore = useCallback(() => {
    navigateToCardHistory(navigation);
  }, [navigation]);

  // Adapts the secure-browser opener to the same OpenCardHostedPage shape desktop's
  // useCardHostedPageOpeners already exposes, so both platforms share openHostedPageSafely below
  // instead of each hand-rolling its own try/catch.
  const openHostedPage: OpenCardHostedPage = useCallback(
    path => openHostedPageInSecureBrowser(buildHostedUrl(hostedUiUrl, path)),
    [hostedUiUrl],
  );

  const onManagePin = useCallback(
    () =>
      openHostedPageSafely(openHostedPage, MANAGE_PIN_PATH, () =>
        console.warn("[card] manage pin page did not open"),
      ),
    [openHostedPage],
  );

  const onAccessBaanx = useCallback(async () => {
    const isUsCardHolder = await readCardUsEnv(usAppId);

    await openHostedPageSafely(
      openHostedPage,
      buildAccessBaanxPath(isUsCardHolder ? usAppId : null),
      () => console.warn("[card] baanx page did not open"),
    );
  }, [openHostedPage, usAppId]);

  const onHelp = useCallback(() => {
    Linking.openURL(urls.cardHelpCenter);
  }, []);

  const cardSettingsActions: CardSettingsActions = useMemo(
    () => ({ onManagePin, onAccessBaanx, onHelp }),
    [onManagePin, onAccessBaanx, onHelp],
  );

  const onShowAssetHistory = useCallback(
    (asset: CardAssetRow) => {
      navigateToCardHistory(navigation, asset);
    },
    [navigation],
  );

  const featureTour: FeatureTourProps = useMemo(
    () => ({
      onTrackScreen: (page: string) => track(page),
      onTrackEvent: (event: string, params: Record<string, unknown>) => track(event, params),
    }),
    [],
  );

  const cardAssetsViewModel = usePayCardAssets();
  const cardAssets = useMemo(
    () => ({ ...cardAssetsViewModel, onShowHistory: onShowAssetHistory }),
    [cardAssetsViewModel, onShowAssetHistory],
  );

  // Without a countervalue formatter the flow shows the bare artwork instead of the card's balance.
  const formatCountervalue = useCountervalueFormatter();
  const cardFormatters: CardProps["formatters"] = useMemo(
    () => ({ countervalue: formatCountervalue }),
    [formatCountervalue],
  );

  return {
    top,
    bottom: bottom + insets.bottom,
    login,
    cardAssets,
    cardFormatters,
    onTopUp,
    featureTour,
    balance,
    actionTiles,
    contacts,
    contactAddressPicker: payment.contactAddressPicker,
    isContactsEnabled,
    depositOptions: deposit.depositOptions,
    bankTransferIntro: deposit.bankTransferIntro,
    onShowMore,
    cardSettingsActions,
  };
}
