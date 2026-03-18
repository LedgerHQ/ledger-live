import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { PortfolioScreen as Portfolio } from "../screens/Portfolio";
import ReadOnlyPortfolio from "../screens/ReadOnly";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import { State } from "~/reducers/types";
import { Account } from "@ledgerhq/types-live";

type TestStackParamList = WalletTabNavigatorStackParamList;

const Stack = createNativeStackNavigator<TestStackParamList>();

export const PortfolioTest = () => (
  <Stack.Navigator initialRouteName={ScreenName.Portfolio}>
    <Stack.Screen name={ScreenName.Portfolio} component={Portfolio} />
  </Stack.Navigator>
);

export const ReadOnlyPortfolioTest = () => (
  <Stack.Navigator initialRouteName={ScreenName.Portfolio}>
    <Stack.Screen name={ScreenName.Portfolio} component={ReadOnlyPortfolio} />
  </Stack.Navigator>
);

export const btcCurrency = getCryptoCurrencyById("bitcoin");
export const ethCurrency = getCryptoCurrencyById("ethereum");

const mockAccount = {
  ...genAccount("perpsAccount", { currency: btcCurrency }),
  index: 0,
};

export const overrideInitialStateWithFeatureFlag = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    overriddenFeatureFlags: {
      lwmWallet40: { enabled: true },
    },
  },
});

export const overrideInitialStateWithGraphReworkEnabled = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    overriddenFeatureFlags: {
      lwmWallet40: { enabled: true, params: { graphRework: true, quickActionCtas: true } },
    },
  },
});

export const overrideInitialStateWithGraphReworkAndReadOnly = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    readOnlyModeEnabled: true,
    overriddenFeatureFlags: {
      lwmWallet40: { enabled: true, params: { graphRework: true, quickActionCtas: true } },
    },
  },
});

export const overrideInitialStateWithPerpsEntryPoint =
  (enabled: boolean) =>
  (state: State): State => ({
    ...state,
    accounts: {
      active: [mockAccount],
    },
    settings: {
      ...state.settings,
      overriddenFeatureFlags: {
        ...state.settings.overriddenFeatureFlags,
        lwmWallet40: { enabled: true },
        ptxPerpsLiveAppMobile: { enabled },
      },
    },
  });

export const overrideInitialStateWithAssetSection =
  (assetSection: boolean, accounts: Account[] = [mockAccount]) =>
  (state: State): State => ({
    ...state,
    accounts: {
      active: accounts,
    },
    settings: {
      ...state.settings,
      overriddenFeatureFlags: {
        ...state.settings.overriddenFeatureFlags,
        lwmWallet40: { enabled: true, params: { assetSection } },
      },
    },
  });

export const overrideInitialStateWithNoAccountsAndAssetSection =
  (assetSection: boolean) =>
  (state: State): State =>
    overrideInitialStateWithAssetSection(assetSection, [])(state);
