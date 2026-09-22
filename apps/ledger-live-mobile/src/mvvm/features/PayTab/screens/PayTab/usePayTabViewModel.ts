import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  buildHostedUrl,
  buildTopUpPath,
  buildWithdrawalPath,
  buildAccessBaanxPath,
  buildManagePinPath,
  openHostedUrlInSecureBrowser,
  openHostedCardPathSafely,
  type CardAssetPathBuilder,
  type OpenCardHostedPage,
} from "@features/flow-pay-card-auth";
import useEnv from "@features/platform-env";
import { useContactsFeature } from "@features/platform-contacts";
import type { CardAssetRow, CardAssetsProps } from "@features/flow-pay-card-assets";
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

  const login: CardProps["login"] = useMemo(
    () => ({ oauthConfig, callback, onTrackEvent: balance.onTrackEvent, requestProtection }),
    [oauthConfig, callback, balance.onTrackEvent, requestProtection],
  );

  const onShowMore = useCallback(() => {
    navigateToCardHistory(navigation);
  }, [navigation]);

  const openHostedPage: OpenCardHostedPage = useCallback(
    async path => {
      await openHostedUrlInSecureBrowser(buildHostedUrl(hostedUiUrl, path), PAY_TAB_DEEP_LINK);
    },
    [hostedUiUrl],
  );

  const openHostedPath = useCallback(
    (buildPath: CardAssetPathBuilder, onError: (error: unknown) => void, currency?: string) =>
      openHostedCardPathSafely(openHostedPage, usAppId, buildPath, onError, currency),
    [openHostedPage, usAppId],
  );

  const openAssetPage = useCallback(
    (buildPath: CardAssetPathBuilder, currency?: string) =>
      openHostedPath(
        buildPath,
        error => console.warn("[card] the hosted asset page did not open", error),
        currency,
      ),
    [openHostedPath],
  );

  const onTopUp = useCallback(() => openAssetPage(buildTopUpPath), [openAssetPage]);

  const onManagePin = useCallback(
    () =>
      openHostedPath(buildManagePinPath, () => console.warn("[card] manage pin page did not open")),
    [openHostedPath],
  );

  const onAccessBaanx = useCallback(
    () =>
      openHostedPath(buildAccessBaanxPath, () => console.warn("[card] baanx page did not open")),
    [openHostedPath],
  );

  const onHelp = useCallback(() => {
    Linking.openURL(urls.cardHelpCenter);
  }, []);

  const cardSettingsActions: CardSettingsActions = useMemo(
    () => ({ onManagePin, onAccessBaanx, onHelp }),
    [onManagePin, onAccessBaanx, onHelp],
  );

  const onShowAssetHistory = useCallback(
    (asset: CardAssetRow) => {
      // Match desktop: the route carries only the provider asset code. History resolves the
      // current display name itself, so navigation cannot leave a stale name behind.
      navigateToCardHistory(navigation, asset.currency);
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

  const payCardAssets = usePayCardAssets();
  const cardAssets: CardAssetsProps = useMemo(
    () => ({
      ...payCardAssets,
      onShowHistory: onShowAssetHistory,
      onTopUp: asset => void openAssetPage(buildTopUpPath, asset.currency),
      onWithdraw: asset => void openAssetPage(buildWithdrawalPath, asset.currency),
    }),
    [payCardAssets, onShowAssetHistory, openAssetPage],
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
