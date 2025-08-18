/* eslint-disable i18next/no-literal-string */
import * as React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import marketsMock from "@mocks/api/market/markets.json";
import { MarketPages } from "./shared";

describe("Market List Pagination Integration Test", () => {
  it("Should load and display second page data when onEndReached is triggered", async () => {
    render(<MarketPages />);

    await waitFor(
      () => {
        expect(screen.getByText("Bitcoin (BTC)")).toBeOnTheScreen();
      },
      { timeout: 5000 },
    );

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("Ethereum (ETH)")).toBeOnTheScreen();

    expect(screen.queryByText("Cardano (ADA)")).not.toBeOnTheScreen();
    expect(screen.queryByText("Shiba Inu (SHIB)")).not.toBeOnTheScreen();

    const marketList = await screen.findByTestId("market-list");

    fireEvent(marketList, "onEndReached");

    await waitFor(
      () => {
        expect(screen.getByText("Cardano (ADA)")).toBeOnTheScreen();
        expect(screen.getByText("Shiba Inu (SHIB)")).toBeOnTheScreen();
      },
      { timeout: 5000 },
    );

    expect(screen.getByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(screen.getByText("Ethereum (ETH)")).toBeOnTheScreen();
    expect(screen.getByText("Cardano (ADA)")).toBeOnTheScreen();
    expect(screen.getByText("Shiba Inu (SHIB)")).toBeOnTheScreen();
  });

  it("Should maintain the correct order of items across pages", async () => {
    render(<MarketPages />);

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();

    const marketList = await screen.findByTestId("market-list");
    fireEvent(marketList, "onEndReached");

    await waitFor(() => {
      expect(screen.getByText("Cardano (ADA)")).toBeOnTheScreen();
    });

    expect(screen.getByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(screen.getByText("Ethereum (ETH)")).toBeOnTheScreen();
    expect(screen.getByText("Cardano (ADA)")).toBeOnTheScreen();
    expect(screen.getByText("Shiba Inu (SHIB)")).toBeOnTheScreen();
  });

  it("Should handle rapid scrolling without duplicating items", async () => {
    render(<MarketPages />);

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

  it("Should correctly append new items to the existing list", async () => {
    render(<MarketPages />);

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("Ethereum (ETH)")).toBeOnTheScreen();

    const marketList = await screen.findByTestId("market-list");
    fireEvent(marketList, "onEndReached");

    await waitFor(() => {
      expect(screen.getByText("Cardano (ADA)")).toBeOnTheScreen();
    });

    expect(screen.getByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(screen.getByText("Ethereum (ETH)")).toBeOnTheScreen();
    expect(screen.getByText("Cardano (ADA)")).toBeOnTheScreen();
    expect(screen.getByText("Solana (SOL)")).toBeOnTheScreen();
  });

  it("Should not display the same item twice if it is returned in two different pages", async () => {
    const modifiedMarketsMock = [...marketsMock];
    modifiedMarketsMock[10] = { ...modifiedMarketsMock[9] };

    server.use(
      http.get("https://countervalues.live.ledger.com/v3/markets", ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        console.log("Market handler :", request.url, parseInt(searchParams.get("page") || "0"));

        const page = parseInt(searchParams.get("page") || "0");
        const pageSize = 10;
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = modifiedMarketsMock.slice(startIndex, endIndex);

        return HttpResponse.json(paginatedData);
      }),
    );

    render(<MarketPages />);

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
