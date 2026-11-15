import { trackPage } from "@shared/analytics";
import * as React from "react";
import { renderWithReactQuery, screen, waitFor } from "@tests/test-renderer";
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

describe("Market screen navigator", () => {
  it("should render MarketScreen with its placeholder blocks", async () => {
    renderWithReactQuery(<NavigatorWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.screen)).toBeVisible();
    });
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.searchBar)).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.highlights)).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.list)).toBeVisible();
    expect(screen.getAllByTestId(MARKET_SCREEN_TEST_IDS.highlightCard).length).toBeGreaterThan(0);
  });

  it("emits the Page Market screen event with the category as a property", async () => {
    renderWithReactQuery(<NavigatorWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.screen)).toBeVisible();
    });

    await waitFor(() => {
      expect(trackPage).toHaveBeenCalledWith(
        {
          category: "Market",
          props: expect.objectContaining({
            category: "all",
            sortVolume: "desc",
            sortMarketCap: "desc",
            sortChange: "desc",
            timeframe: "1D",
          }),
        },
        { updateRoutes: true, refreshSource: true },
      );
    });
  });

  it("should render MarketScreen from the wallet tab navigator", async () => {
    renderWithReactQuery(<MarketWalletTabNavigator />);

    await waitFor(() => {
      expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.screen)).toBeVisible();
    });
  });
});
