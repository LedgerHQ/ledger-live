import { useCallback, useMemo } from "react";
import { StackActions, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation";
import {
  useFeatureFlagsToolProps,
  usePayCardToolProps,
  useEnvDevToolProps,
  useMockAccountsToolProps,
} from "@devtools/bindings";
import type { DevToolsConfig } from "@devtools/shell";
import type { Account } from "@ledgerhq/types-live";
import { openHostedLoginInSecureBrowser } from "@features/flow-pay-card-auth";
import { useCurrenciesByIds } from "@features/platform-currencies";
import { BAANX_LEDGER_CURRENCY_IDS } from "@domain/entity-card-asset-mapping";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import { navigateToPayTab } from "LLM/features/PayTab/utils/navigateToPayTab";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";
import { useDispatch, useStore } from "~/context/hooks";
import { replaceAccounts } from "~/actions/accounts";
import { exportSelector } from "~/reducers/accounts";
import { saveAccounts } from "~/db";
import { reboot } from "~/actions/appstate";
import { useDevToolsRelay } from "./useDevToolsRelay";

type BaseNavigation = NativeStackNavigationProp<
  BaseNavigatorStackParamList,
  keyof BaseNavigatorStackParamList,
  typeof BASE_NAVIGATOR_ID
>;

export function useDevToolsScreenViewModel() {
  const navigation = useNavigation<BaseNavigation>();
  const tabNavigation = navigation.getParent(BASE_NAVIGATOR_ID) ?? navigation;
  const dispatch = useDispatch();
  const store = useStore();
  const featureFlagsProps = useFeatureFlagsToolProps();

  const onNavigateToPortfolio = useCallback(() => {
    tabNavigation.dispatch(
      StackActions.replace(NavigatorName.Main, {
        screen: NavigatorName.Portfolio,
        params: { screen: ScreenName.Portfolio },
      }),
    );
  }, [tabNavigation]);

  const onNavigateToPayTab = useCallback(() => navigateToPayTab(tabNavigation), [tabNavigation]);
  const onNavigateToPaySuccess = useCallback(() => {
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.DebugPayContactSuccess,
    });
  }, [navigation]);
  const onNavigateToSendSuccess = useCallback(() => {
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.DebugSendSuccess,
    });
  }, [navigation]);

  const openSecureBrowser = useCallback(async (url: string) => {
    const result = await openHostedLoginInSecureBrowser(url, PAY_TAB_DEEP_LINK);
    return result.type === "success" ? `redirected to ${result.url}` : "dismissed";
  }, []);

  const currencies = useCurrenciesByIds(BAANX_LEDGER_CURRENCY_IDS);

  const boundPayCard = usePayCardToolProps({
    platform: "native",
    openPayTab: onNavigateToPayTab,
    openSecureBrowser,
    currencies,
  });

  const payCardToolProps = useMemo(
    () => ({
      ...boundPayCard,
      onNavigateToPortfolio,
      onNavigateToPayTab,
      onNavigateToPaySuccess,
      onNavigateToSendSuccess,
    }),
    [
      boundPayCard,
      onNavigateToPortfolio,
      onNavigateToPayTab,
      onNavigateToPaySuccess,
      onNavigateToSendSuccess,
    ],
  );
  const envToolProps = useEnvDevToolProps();

  const onApplyAccounts = useCallback(
    async (accounts: Account[]) => {
      dispatch(replaceAccounts(accounts));
      await saveAccounts(await exportSelector(store.getState()));
      dispatch(reboot());
    },
    [dispatch, store],
  );

  const onClearAccounts = useCallback(async () => {
    dispatch(replaceAccounts([]));
    await saveAccounts(await exportSelector(store.getState()));
    dispatch(reboot());
  }, [dispatch, store]);

  const mockAccountsToolProps = useMockAccountsToolProps({
    onApplyAccounts,
    onClearAccounts,
  });

  const { theme } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { wire, wireState } = useDevToolsRelay();

  const config: DevToolsConfig = useMemo(
    () => [
      { id: "feature-flags", config: featureFlagsProps },
      { id: "env", config: envToolProps },
      { id: "pay-card", config: payCardToolProps },
      { id: "mock-accounts", config: mockAccountsToolProps },
    ],
    [featureFlagsProps, envToolProps, payCardToolProps, mockAccountsToolProps],
  );

  const screenOptions: NativeStackNavigationOptions = useMemo(() => {
    const navConfig = getStackNavigationConfigV4(theme);
    return {
      ...navConfig,
      contentStyle: [navConfig.contentStyle, { paddingBottom: bottom }],
    };
  }, [theme, bottom]);

  return {
    config,
    screenOptions,
    transport: wire.transport,
    hubUrl: wireState.hubUrl,
    setHubUrl: wire.setHubUrl,
    role: wireState.role,
  };
}
