import { useCallback, useMemo } from "react";
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
  buildManagePinPath,
  buildAddAssetPath,
  buildOrderCardPath,
  openHostedCardPathSafely,
  openHostedUrlInSecureBrowser,
  type CardAssetPathBuilder,
  type OpenCardHostedPage,
} from "@features/flow-pay-card-auth";
import useEnv from "@features/platform-env";
import { useFeature } from "@features/platform-feature-flags";
import { useContactsFeature } from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";
import type { CardAssetRow, CardAssetsProps } from "@features/flow-pay-card-assets";
import type { CardSettingsActions } from "@features/flow-pay-card-details";
import { NavigatorName, ScreenName } from "~/const";
import { CL_CARD_APP_ID } from "LLM/features/Card";
import type { CardProps } from "@features/flow-pay-card";
import { useCardHostedPageOpener } from "../../hooks/useCardHostedPageOpener";
import { usePayCardAssets } from "../../hooks/usePayCardAssets";
import { useCountervalueFormatter } from "../../hooks/useCountervalueFormatter";
import type { PayTabNavigatorParamList } from "LLM/features/PayTab/types";
import { navigateToCardHistory } from "LLM/features/OperationsHistory/utils/navigateToCardHistory";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { useAppProtectionPrompt } from "LLM/features/AppLock/AppProtectionPrompt";
import { usePayCardBalance } from "LLM/features/PayTab/hooks/usePayCardBalance";
import { usePayTabActionTiles } from "LLM/features/PayTab/hooks/usePayTabActionTiles";
import { usePayTabContacts } from "LLM/features/PayTab/hooks/usePayTabContacts";
import { usePayTabDepositOptions } from "LLM/features/PayTab/hooks/usePayTabDepositOptions";
import { usePayTabNewPayment } from "LLM/features/PayTab/hooks/usePayTabNewPayment";
import { usePayTabRequestReceive } from "LLM/features/PayTab/hooks/usePayTabRequestReceive";
import { usePayAnalyticsContext } from "@features/platform-pay-analytics";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";

export function usePayTabViewModel() {
  const analytics = usePayAnalyticsContext();
  const { t } = useTranslation();
  const { top, bottom } = useNavigationBarHeights();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { params } = useRoute<RouteProp<PayTabNavigatorParamList, ScreenName.PayTab>>();

  const balance = usePayCardBalance(analytics.trackEvent);
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
        ? {
            code: params.code,
            ...(params.app_id ? { appId: params.app_id } : {}),
          }
        : null,
    [params?.code, params?.app_id],
  );

  const openInSecureBrowser: OpenCardHostedPage = useCallback(
    async path => {
      await openHostedUrlInSecureBrowser(buildHostedUrl(hostedUiUrl, path), PAY_TAB_DEEP_LINK);
    },
    [hostedUiUrl],
  );

  const openInDiscover = useCardHostedPageOpener();

  const login: CardProps["login"] = useMemo(
    () => ({ oauthConfig, callback, requestProtection }),
    [oauthConfig, callback, requestProtection],
  );

  const onShowMore = useCallback(() => {
    navigateToCardHistory(navigation);
  }, [navigation]);

  const openHostedWith = useCallback(
    (
      openPage: OpenCardHostedPage,
      buildPath: CardAssetPathBuilder,
      failedToOpen: string,
      currency?: string,
    ) =>
      openHostedCardPathSafely(
        openPage,
        usAppId,
        buildPath,
        error => console.warn(`[card] ${failedToOpen}`, error),
        currency,
      ),
    [usAppId],
  );

  const openHosted = useCallback(
    (buildPath: CardAssetPathBuilder, failedToOpen: string, currency?: string) =>
      openHostedWith(openInSecureBrowser, buildPath, failedToOpen, currency),
    [openHostedWith, openInSecureBrowser],
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
          params: { platform: CL_CARD_APP_ID },
        });
        return;
      }

      await openHostedWith(
        openInDiscover,
        buildTopUpPath,
        "the hosted asset page did not open",
        currency,
      );
    },
    [isLegacyTopUp, navigation, openHostedWith, openInDiscover],
  );

  const onTopUp = useCallback(() => openTopUp(), [openTopUp]);

  const onChooseCardType = useCallback(
    () => openHosted(buildOrderCardPath, "order card page did not open"),
    [openHosted],
  );

  const onManagePin = useCallback(
    () => openHosted(buildManagePinPath, "manage pin page did not open"),
    [openHosted],
  );

  const onAccessBaanx = useCallback(
    () => openHosted(buildAccessBaanxPath, "baanx page did not open"),
    [openHosted],
  );

  const onAddAsset = useCallback(
    () => openHosted(buildAddAssetPath, "add asset page did not open"),
    [openHosted],
  );

  const cardSettingsActions: CardSettingsActions = useMemo(
    () => ({ onManagePin, onAccessBaanx }),
    [onManagePin, onAccessBaanx],
  );

  const onShowAssetHistory = useCallback(
    (asset: CardAssetRow) => {
      // Match desktop: the route carries only the provider asset code. History resolves the
      // current display name itself, so navigation cannot leave a stale name behind.
      navigateToCardHistory(navigation, asset.currency);
    },
    [navigation],
  );

  const payCardAssets = usePayCardAssets();
  const cardAssets: CardAssetsProps = useMemo(
    () => ({
      ...payCardAssets,
      onShowHistory: onShowAssetHistory,
      onTopUp: asset => void openTopUp(asset.currency),
      onWithdraw: asset =>
        void openHosted(buildWithdrawalPath, "the hosted asset page did not open", asset.currency),
      onAddAsset,
    }),
    [payCardAssets, onShowAssetHistory, openHosted, openTopUp, onAddAsset],
  );

  const formatCountervalue = useCountervalueFormatter();
  const card: CardProps = useMemo(
    () => ({
      login,
      assets: cardAssets,
      formatters: { countervalue: formatCountervalue },
      onTopUp,
      onChooseCardType,
      onShowMore,
      cardSettingsActions,
    }),
    [
      login,
      cardAssets,
      formatCountervalue,
      onTopUp,
      onChooseCardType,
      onShowMore,
      cardSettingsActions,
    ],
  );

  return {
    top,
    bottom: bottom + insets.bottom,
    card,
    balance,
    actionTiles,
    contacts,
    contactAddressPicker: payment.contactAddressPicker,
    isContactsEnabled,
    depositOptions: deposit.depositOptions,
    bankTransferIntro: deposit.bankTransferIntro,
    trackRecipientAddressSelection: isContactsEnabled && payment.contactAddressPicker.isOpen,
    disclaimer: t("payTab.disclaimer"),
  };
}
