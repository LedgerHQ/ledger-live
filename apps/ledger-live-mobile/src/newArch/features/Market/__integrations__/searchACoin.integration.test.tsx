/* eslint-disable i18next/no-literal-string */
import * as React from "react";
import { screen, waitForElementToBeRemoved } from "@testing-library/react-native";
import MarketNavigator, { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";
import MarketDataProviderWrapper from "../components/MarketDataProviderWrapper";
import WalletTabNavigatorScrollManager from "~/components/WalletTab/WalletTabNavigatorScrollManager";
import { render } from "@tests/test-renderer";
import { createStackNavigator } from "@react-navigation/stack";
import { ScreenName } from "~/const";
import MarketList from "../screens/MarketList/MarketListCont";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

const Stack = createStackNavigator<BaseNavigatorStackParamList>();
const StackWalletTab = createStackNavigator<MarketNavigatorStackParamList>();

function MarketPages() {
  return (
    <MarketDataProviderWrapper>
      <WalletTabNavigatorScrollManager>
        <StackWalletTab.Navigator initialRouteName={ScreenName.MarketList}>
          <StackWalletTab.Screen name={ScreenName.MarketList} component={MarketList} />
          {MarketNavigator({ Stack })}
        </StackWalletTab.Navigator>
      </WalletTabNavigatorScrollManager>
    </MarketDataProviderWrapper>
  );
}

describe("Market integration test", () => {
  it("Should search for a coin and navigate to detail page", async () => {
    const { user } = render(<MarketPages />, {
      featureFlags: { ptxEarn: { enabled: true }, llmMarketNewArch: { enabled: true } },
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
