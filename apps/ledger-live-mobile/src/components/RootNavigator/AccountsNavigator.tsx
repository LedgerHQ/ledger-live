import React, { useCallback, useMemo } from "react";
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSelector } from "~/context/hooks";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation/getStackNavigationConfigV4";
import type { AccountsNavigatorParamList } from "./types/AccountsNavigator";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import { useFeature } from "@features/platform-feature-flags";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import { track } from "~/analytics";
import {
  NavigationProp,
  NavigationState,
  type RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { TrackingEvent } from "LLM/features/Accounts/enums";
import AccountsListHeaderRight from "LLM/features/LedgerSyncEntryPoint/components/AccountsListHeaderRight";
import { useTranslation } from "~/context/Locale";
import type { LumenNavBarScreenOptions } from "LLM/components/Navigation";
import { lazyNamed, lazyScreen } from "./lazyScreen";

const Stack = createNativeStackNavigator<AccountsNavigatorParamList>();

type V4AccountsScreenOptions = NativeStackNavigationOptions & {
  lumenNavBar?: LumenNavBarScreenOptions;
};

type NavType = Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
  getState(): NavigationState | undefined;
};

type ParamsType = {
  params?: { specificAccounts?: object[] };
};

const isParamsType = (value: unknown): value is ParamsType =>
  typeof value === "object" &&
  value !== null &&
  Object.prototype.hasOwnProperty.call(value, "params");

function handleAccountsCryptoBackPress(
  nav: NavType,
  getState: () => NavigationState | undefined,
  routeName: string,
) {
  const maybeParams = getState()?.routes?.[1]?.params;
  const hasSpecificAccounts =
    isParamsType(maybeParams) && Boolean(maybeParams.params?.specificAccounts);
  const screenName = hasSpecificAccounts
    ? TrackingEvent.AccountListSummary
    : TrackingEvent.AccountsList;
  track("button_clicked", {
    button: "Back",
    page: screenName || routeName,
  });
  nav.goBack();
}

export default function AccountsNavigator() {
  const { colors } = useTheme();
  const { theme: lumenTheme } = useLumenTheme();
  const { t } = useTranslation();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);
  const stackNavConfigV4Expanded = useMemo(
    () => getStackNavigationConfigV4(lumenTheme, "expanded"),
    [lumenTheme],
  );
  const accountListUIFF = useFeature("llmAccountListUI");
  const route = useRoute();
  const navigation = useNavigation();

  const hasNoAccounts = useSelector(hasNoAccountsSelector);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector) && hasNoAccounts;

  const onPressBack = useCallback(
    (nav: NavType) => {
      handleAccountsCryptoBackPress(nav, () => navigation.getState(), route.name);
    },
    [navigation, route.name],
  );

  const cryptoAddressesScreenOptions = useMemo((): V4AccountsScreenOptions => {
    return {
      ...stackNavConfigV4Expanded,
      title: t("cryptoAddresses.title"),
    };
  }, [stackNavConfigV4Expanded, t]);

  const getCryptoScreenOptions = useCallback(
    ({
      route: cryptoRoute,
    }: {
      route: RouteProp<AccountsNavigatorParamList, ScreenName.Crypto>;
    }): V4AccountsScreenOptions => {
      const variant = cryptoRoute.params?.variant ?? "all";
      const titleByVariant: Record<typeof variant, string> = {
        stablecoin: t("crypto.stablecoinTitle"),
        stocks: t("crypto.stocksTitle"),
        crypto: t("crypto.title"),
        all: t("crypto.title"),
      };
      return {
        ...stackNavConfigV4Expanded,
        title: titleByVariant[variant],
      };
    },
    [stackNavConfigV4Expanded, t],
  );

  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.Accounts}
        getComponent={
          readOnlyModeEnabled
            ? lazyScreen(
                () =>
                  require("~/screens/Accounts/ReadOnly/ReadOnlyAccounts") as typeof import("~/screens/Accounts/ReadOnly/ReadOnlyAccounts"),
              )
            : lazyScreen(() => require("~/screens/Accounts") as typeof import("~/screens/Accounts"))
        }
        options={{
          ...stackNavConfig,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.Account}
        getComponent={
          readOnlyModeEnabled
            ? lazyScreen(
                () =>
                  require("~/screens/Account/ReadOnly/ReadOnlyAccount") as typeof import("~/screens/Account/ReadOnly/ReadOnlyAccount"),
              )
            : lazyScreen(() => require("~/screens/Account") as typeof import("~/screens/Account"))
        }
        options={{
          ...stackNavConfig,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.Assets}
        getComponent={
          readOnlyModeEnabled
            ? lazyScreen(
                () =>
                  require("~/screens/Portfolio/ReadOnlyAssets") as typeof import("~/screens/Portfolio/ReadOnlyAssets"),
              )
            : lazyScreen(() => require("~/screens/Assets") as typeof import("~/screens/Assets"))
        }
        options={{
          ...stackNavConfig,
          headerShown: false,
        }}
      />
      {accountListUIFF?.enabled && (
        <Stack.Screen
          name={ScreenName.AccountsList}
          getComponent={lazyScreen(
            () =>
              require("LLM/features/Accounts/screens/AccountsList") as typeof import("LLM/features/Accounts/screens/AccountsList"),
          )}
          options={{
            ...stackNavConfig,
            headerTitle: "",
            headerLeft: () => <NavigationHeaderBackButton onPress={onPressBack} />,
            headerRight: () => <AccountsListHeaderRight />,
          }}
        />
      )}
      <Stack.Screen
        name={ScreenName.CryptoAddresses}
        getComponent={lazyNamed(
          () =>
            (
              require("LLM/features/CryptoAddresses") as typeof import("LLM/features/CryptoAddresses")
            ).CryptoAddressesScreen,
        )}
        options={cryptoAddressesScreenOptions}
      />
      <Stack.Screen
        name={ScreenName.Crypto}
        getComponent={lazyNamed(
          () =>
            (require("LLM/features/Crypto") as typeof import("LLM/features/Crypto")).CryptoScreen,
        )}
        options={getCryptoScreenOptions}
      />
      <Stack.Screen
        name={ScreenName.Asset}
        getComponent={
          readOnlyModeEnabled
            ? lazyScreen(
                () =>
                  require("~/screens/WalletCentricAsset/ReadOnly") as typeof import("~/screens/WalletCentricAsset/ReadOnly"),
              )
            : lazyScreen(
                () =>
                  require("~/screens/WalletCentricAsset") as typeof import("~/screens/WalletCentricAsset"),
              )
        }
        options={{
          ...stackNavConfig,
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
