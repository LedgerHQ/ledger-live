import * as React from "react";
import { renderWithReactQuery, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import MarketNavigator from "../Navigator";
import MarketWalletTabNavigator from "../WalletTabNavigator";
import { MARKET_SCREEN_TEST_IDS } from "../screens/MarketScreen/testIds";

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

const NavigatorWrapper = () => (
  <Stack.Navigator initialRouteName={ScreenName.MarketList}>
    {MarketNavigator({ Stack })}
  </Stack.Navigator>
);

const enableAssetDiscoverability = withFlagOverrides({
  lwmWallet40: { enabled: true, params: { assetDiscoverability: true } },
});

describe("Market screen navigator switch", () => {
  it("should render MarketList when asset discoverability is off", async () => {
    renderWithReactQuery(<NavigatorWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId("market-list")).toBeVisible();
    });
    expect(screen.queryByTestId(MARKET_SCREEN_TEST_IDS.screen)).toBeNull();
  });

  it("should render the new MarketScreen with its placeholder blocks when asset discoverability is on", async () => {
    renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: enableAssetDiscoverability,
    });

    await waitFor(() => {
      expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.screen)).toBeVisible();
    });
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.searchBar)).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.highlights)).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.list)).toBeVisible();
    expect(screen.getAllByTestId(MARKET_SCREEN_TEST_IDS.highlightCard).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("market-list")).toBeNull();
  });

  it("should render the new MarketScreen from the wallet tab navigator when asset discoverability is on", async () => {
    renderWithReactQuery(<MarketWalletTabNavigator />, {
      overrideInitialState: enableAssetDiscoverability,
    });

    await waitFor(() => {
      expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.screen)).toBeVisible();
    });
    expect(screen.queryByTestId("market-list")).toBeNull();
  });
});
