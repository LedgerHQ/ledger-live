/* eslint-disable i18next/no-literal-string */
import * as React from "react";
import Navigator from "../Navigator";
import { screen, waitForElementToBeRemoved } from "@testing-library/react-native";
//import MarketList from "../screens/MarketList/MarketListCont";
import MarketDataProviderWrapper from "../components/MarketDataProviderWrapper";
import WalletTabNavigatorScrollManager from "~/components/WalletTab/WalletTabNavigatorScrollManager";
import { render } from "@tests/test-renderer";

describe("Market integration test", () => {
  it("Should search for a coin", async () => {
    const { user } = render(
      <MarketDataProviderWrapper>
        <WalletTabNavigatorScrollManager>
          <Navigator />
        </WalletTabNavigatorScrollManager>
      </MarketDataProviderWrapper>,
    );

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("Ethereum (ETH)")).toBeOnTheScreen();

    const searchInput = await screen.findByTestId("search-box");
    await user.type(searchInput, "BTC");

    await waitForElementToBeRemoved(() => screen.queryByText("Ethereum (ETH)"));

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
  });
});
