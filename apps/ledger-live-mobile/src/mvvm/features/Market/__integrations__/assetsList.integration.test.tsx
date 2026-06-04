import * as React from "react";
import { renderWithReactQuery, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import MarketNavigator from "../Navigator";
import { MARKET_SCREEN_TEST_IDS } from "../screens/MarketScreen/testIds";

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

const NavigatorWrapper = () => (
  <Stack.Navigator initialRouteName={ScreenName.MarketList}>{MarketNavigator({ Stack })}</Stack.Navigator>
);

const enableAssetDiscoverability = withFlagOverrides({
  lwmWallet40: { enabled: true, params: { assetDiscoverability: true } },
});

describe("MarketScreen assets list (Block 3)", () => {
  it("renders the Assets subheader and the market rows from the API", async () => {
    renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: enableAssetDiscoverability,
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible();
      },
      { timeout: 5000 },
    );

    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsSubHeader)).toBeVisible();
    expect(screen.getByTestId("marketItem-ethereum")).toBeVisible();
    // price + change columns are rendered for each row
    expect(screen.getByTestId("marketItem-bitcoin-price")).toBeVisible();
  });
});
