import React from "react";
import { renderWithReactQuery, screen, waitFor } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import { MOCK_MARKET_PERFORMERS } from "@ledgerhq/live-common/market/utils/fixtures";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import MarketNavigator from "../Navigator";
import MarketWalletTabNavigator from "../WalletTabNavigator";

const COUNTERVALUES_API = "https://countervalues.live.ledger.com";

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

const NavigatorWrapper = () => (
  <Stack.Navigator initialRouteName={ScreenName.MarketList}>
    {MarketNavigator({ Stack })}
  </Stack.Navigator>
);

describe("Market Navigators", () => {
  beforeEach(() => {
    server.use(
      http.get(`${COUNTERVALUES_API}/v3/markets`, () => HttpResponse.json(MOCK_MARKET_PERFORMERS)),
    );
  });

  describe("MarketNavigator", () => {
    it("should render MarketList as initial screen", async () => {
      renderWithReactQuery(<NavigatorWrapper />);

      await waitFor(() => {
        expect(screen.getByTestId("market-list")).toBeOnTheScreen();
      });
    });
  });

  describe("MarketWalletTabNavigator", () => {
    it("should render MarketList as initial screen", async () => {
      renderWithReactQuery(<MarketWalletTabNavigator />);

      await waitFor(() => {
        expect(screen.getByTestId("market-list")).toBeOnTheScreen();
      });
    });
  });
});
