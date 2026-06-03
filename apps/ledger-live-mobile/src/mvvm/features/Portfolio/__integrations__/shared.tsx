import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { PortfolioScreen as Portfolio } from "../screens/Portfolio";
import ReadOnlyPortfolio from "../screens/ReadOnly";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import { withFlagOverrides } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { Account } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import subDays from "date-fns/subDays";

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

export const overrideInitialStateWithFeatureFlag = withFlagOverrides({ lwmWallet40: { enabled: true } });

export const overrideInitialStateWithGraphReworkEnabled = withFlagOverrides({ lwmWallet40: { enabled: true, params: { graphRework: true, quickActionCtas: true } } });

export const overrideInitialStateWithGraphReworkAndReadOnly = withFlagOverrides(
  { lwmWallet40: { enabled: true, params: { graphRework: true, quickActionCtas: true } } },
  state => ({
    ...state,
    settings: {
      ...state.settings,
      readOnlyModeEnabled: true,
    },
  }),
);

export const overrideInitialStateWithPerpsEntryPoint =
  (enabled: boolean) =>
  (state: State): State =>
    withFlagOverrides(
      { lwmWallet40: { enabled: true }, ptxPerpsLiveAppMobile: { enabled } },
      s => ({
        ...s,
        accounts: {
          active: [mockAccount],
        },
      }),
    )(state);

export const overrideInitialStateWithPerpsAndAssetSection = withFlagOverrides(
  { lwmWallet40: { enabled: true, params: { assetSection: true } }, ptxPerpsLiveAppMobile: { enabled: true } },
  state => ({
    ...state,
    accounts: {
      active: [mockAccount],
    },
  }),
);

export const overrideInitialStateWithAssetSection =
  (assetSection: boolean, accounts: Account[] = [mockAccount]) =>
  (state: State): State =>
    withFlagOverrides(
      { lwmWallet40: { enabled: true, params: { assetSection } } },
      s => ({
        ...s,
        accounts: {
          active: accounts,
        },
      }),
    )(state);

export const overrideInitialStateWithNoAccountsAndAssetSection =
  (assetSection: boolean) =>
  (state: State): State =>
    overrideInitialStateWithAssetSection(assetSection, [])(state);

const onboardingWidgetBaseState = (state: State): State => ({
  ...state,
  postOnboarding: {
    ...state.postOnboarding,
    deviceModelId: DeviceModelId.nanoX,
    walletEntryPointEligibleForPortfolio: true,
  },
  settings: {
    ...state.settings,
    hasCompletedOnboarding: true,
    onboardingCompletionDate: subDays(new Date(), 2).toISOString(),
  },
});

export const overrideInitialStateWithOnboardingWidgetVisible = withFlagOverrides(
  {
    lwmWallet40: { enabled: true, params: { graphRework: true, quickActionCtas: true } },
    onboardingWidget: { enabled: true },
  },
  onboardingWidgetBaseState,
);

export const overrideInitialStateWithOnboardingWidgetVisibleAndReadOnly = withFlagOverrides(
  {
    lwmWallet40: { enabled: true, params: { graphRework: true, quickActionCtas: true } },
    onboardingWidget: { enabled: true },
  },
  state => ({
    ...onboardingWidgetBaseState(state),
    settings: {
      ...onboardingWidgetBaseState(state).settings,
      readOnlyModeEnabled: true,
    },
  }),
);
