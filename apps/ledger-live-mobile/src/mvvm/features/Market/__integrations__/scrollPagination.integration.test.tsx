/* eslint-disable i18next/no-literal-string */
import * as React from "react";
import { screen, waitFor, fireEvent, renderWithReactQuery } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import marketsMock from "@mocks/api/market/markets.json";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";
import { ScreenName } from "~/const";
import MarketList from "../screens/MarketList";

// Only the list screen is exercised: skip `MarketPages`, whose detail/currency screens add ~1s of imports.
const Stack = createNativeStackNavigator<MarketNavigatorStackParamList>();

function MarketPages() {
  return (
    <Stack.Navigator initialRouteName={ScreenName.MarketList}>
      <Stack.Screen name={ScreenName.MarketList} component={MarketList} />
    </Stack.Navigator>
  );
}

describe("Market List Pagination Integration Test", () => {
  it("Should append the second page to the existing list when onEndReached is triggered", async () => {
    renderWithReactQuery(<MarketPages />);

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("Ethereum (ETH)")).toBeOnTheScreen();

    expect(screen.queryByText("Cardano (ADA)")).not.toBeOnTheScreen();
    expect(screen.queryByText("Shiba Inu (SHIB)")).not.toBeOnTheScreen();

    const marketList = await screen.findByTestId("market-list");

    fireEvent(marketList, "onEndReached");

    await waitFor(() => {
      expect(screen.getByText("Cardano (ADA)")).toBeOnTheScreen();
      expect(screen.getByText("Shiba Inu (SHIB)")).toBeOnTheScreen();
    });

    expect(screen.getByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(screen.getByText("Ethereum (ETH)")).toBeOnTheScreen();
    expect(screen.getByText("Cardano (ADA)")).toBeOnTheScreen();
    expect(screen.getByText("Shiba Inu (SHIB)")).toBeOnTheScreen();
    expect(screen.getByText("Solana (SOL)")).toBeOnTheScreen();
  });

  it("Should handle rapid scrolling without duplicating items", async () => {
    renderWithReactQuery(<MarketPages />);

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();

    const marketList = await screen.findByTestId("market-list");

    fireEvent(marketList, "onEndReached");
    fireEvent(marketList, "onEndReached");
    fireEvent(marketList, "onEndReached");

    await waitFor(() => {
      expect(screen.getByText("Cardano (ADA)")).toBeOnTheScreen();
    });

    const bitcoinElements = screen.getAllByText("Bitcoin (BTC)");
    const ethereumElements = screen.getAllByText("Ethereum (ETH)");
    const cardanoElements = screen.getAllByText("Cardano (ADA)");
    const shibaInuElements = screen.getAllByText("Shiba Inu (SHIB)");

    expect(bitcoinElements).toHaveLength(1);
    expect(ethereumElements).toHaveLength(1);
    expect(cardanoElements).toHaveLength(1);
    expect(shibaInuElements).toHaveLength(1);
  });

  it("Should not display the same item twice if it is returned in two different pages", async () => {
    const modifiedMarketsMock = [...marketsMock];
    modifiedMarketsMock[10] = { ...modifiedMarketsMock[9] };

    server.use(
      http.get("https://countervalues.live.ledger.com/v3/markets", ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        const page = parseInt(searchParams.get("page") || "0");
        const pageSize = 10;
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = modifiedMarketsMock.slice(startIndex, endIndex);

        return HttpResponse.json(paginatedData);
      }),
    );

    renderWithReactQuery(<MarketPages />);

    await waitFor(() => {
      expect(screen.getByText("Bitcoin (BTC)")).toBeOnTheScreen();
    });

    const marketList = await screen.findByTestId("market-list");
    fireEvent(marketList, "onEndReached");

    await waitFor(() => {
      expect(screen.getByText("Shiba Inu (SHIB)")).toBeOnTheScreen();
    });

    expect(screen.getAllByText("Bitcoin (BTC)")).toHaveLength(1);
    expect(screen.getAllByText("Ethereum (ETH)")).toHaveLength(1);
    expect(screen.getAllByText("Dogecoin (DOGE)")).toHaveLength(1);
    expect(screen.getAllByText("Shiba Inu (SHIB)")).toHaveLength(1);
  });
});
