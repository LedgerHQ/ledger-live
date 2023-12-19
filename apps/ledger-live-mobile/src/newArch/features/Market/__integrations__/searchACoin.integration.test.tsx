/* eslint-disable i18next/no-literal-string */
import * as React from "react";
import { screen, waitForElementToBeRemoved } from "@testing-library/react-native";
import MarketCurrencySelect from "../screens/MarketCurrencySelect/MarketCurrencySelectCont";
import MarketDetail from "../screens/MarketDetail/MarketDetailCont";
import MarketList from "../screens/MarketList/MarketListCont";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { MarketNavigatorStackParamList } from "~/components/RootNavigator/types/MarketNavigator";
import MarketDataProviderWrapper from "../components/MarketDataProviderWrapper";
import { createStackNavigator } from "@react-navigation/stack";
import { ScreenName } from "~/const";
import WalletTabNavigatorScrollManager from "~/components/WalletTab/WalletTabNavigatorScrollManager";
import { render } from "@tests/test-renderer";

const Stack = createStackNavigator<BaseNavigatorStackParamList & MarketNavigatorStackParamList>();

function MarketPages() {
  return (
    <MarketDataProviderWrapper>
      <WalletTabNavigatorScrollManager>
        <Stack.Navigator initialRouteName={ScreenName.MarketList}>
          <Stack.Screen name={ScreenName.MarketList} component={MarketList} />
          <Stack.Screen
            name={ScreenName.MarketCurrencySelect}
            component={MarketCurrencySelect}
            options={{
              title: "Currency",
              headerLeft: () => null,
            }}
          />
          <Stack.Screen
            name={ScreenName.MarketDetail}
            component={MarketDetail}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </WalletTabNavigatorScrollManager>
    </MarketDataProviderWrapper>
  );
}

describe("Market integration test", () => {
  it("Should search for a coin and navigate to detail page", async () => {
    const { user } = render(<MarketPages />, {
      featureFlags: { ptxEarn: { enabled: true } },
    });

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("Ethereum (ETH)")).toBeOnTheScreen();

    const searchInput = await screen.findByTestId("search-box");
    await user.type(searchInput, "BTC");

    await waitForElementToBeRemoved(() => screen.queryByText("Ethereum (ETH)"));

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();

    await user.press(screen.getByText("Bitcoin (BTC)"));

    expect(await screen.findByText("Price Statistics")).toBeOnTheScreen();
  });
});
