import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  buildHostedUrl,
  buildTopUpPath,
  buildWithdrawalPath,
  buildAccessBaanxPath,
  openHostedUrlInSecureBrowser,
  MANAGE_PIN_PATH,
  openHostedPageSafely,
  type CardAssetPathBuilder,
  type OpenCardHostedPage,
} from "@features/flow-pay-card-auth";
import { readCardUsEnv } from "@features/platform-card";
import useEnv from "@features/platform-env";
import { useFeature } from "@features/platform-feature-flags";
import { useContactsFeature } from "@features/platform-contacts";
import type { CardAssetRow, CardAssetsProps } from "@features/flow-pay-card-assets";
import type { CardSettingsActions } from "@features/flow-pay-card-details";
import { NavigatorName, ScreenName } from "~/const";
import { CL_CARD_APP_ID, CL_CARD_APP_NAME } from "LLM/features/Card";
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
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
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

  // Adapts the secure-browser opener to the same OpenCardHostedPage shape desktop's
  // useCardHostedPageOpeners already exposes, so both platforms share openHostedPageSafely below
  // instead of each hand-rolling its own try/catch.
  const openHostedPage: OpenCardHostedPage = useCallback(
    async path => {
      await openHostedUrlInSecureBrowser(buildHostedUrl(hostedUiUrl, path), PAY_TAB_DEEP_LINK);
    },
    [hostedUiUrl],
  );

  const openAssetPage = useCallback(
    async (buildPath: CardAssetPathBuilder, currency?: string) => {
      try {
        const isUsCardHolder = await readCardUsEnv(usAppId);

        await openHostedPage(buildPath(isUsCardHolder ? usAppId : null, currency));
      } catch (error) {
        console.warn("[card] the hosted asset page did not open", error);
      }
    },
    [openHostedPage, usAppId],
  );

  const isLegacyTopUp = !!useFeature("lwmPayTab")?.params?.legacyTopUp;

  // The legacy live app has its own top-up flow and its own login. It opens as every other live
  // app does, in the Discover webview, and never in the secure browser. It takes no currency, so
  // the fallback opens it at its root from every top-up entry point.
  const openTopUp = useCallback(
    async (currency?: string) => {
      if (isLegacyTopUp) {
        navigation.navigate(NavigatorName.Base, {
          screen: ScreenName.PlatformApp,
          params: { platform: CL_CARD_APP_ID, name: CL_CARD_APP_NAME },
        });
        return;
      }

      await openAssetPage(buildTopUpPath, currency);
    },
    [isLegacyTopUp, navigation, openAssetPage],
  );

  const onTopUp = useCallback(() => openTopUp(), [openTopUp]);

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
      onTopUp: asset => void openTopUp(asset.currency),
      onWithdraw: asset => void openAssetPage(buildWithdrawalPath, asset.currency),
    }),
    [payCardAssets, onShowAssetHistory, openAssetPage, openTopUp],
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
