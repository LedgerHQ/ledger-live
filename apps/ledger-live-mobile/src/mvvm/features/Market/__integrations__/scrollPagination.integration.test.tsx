import * as React from "react";
import { screen, waitFor, fireEvent, renderWithReactQuery } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import marketsMock from "@mocks/api/market/markets.json";
import { MarketPages } from "./shared";

describe("Market List Pagination Integration Test", () => {
  it("Should load and display second page data when onEndReached is triggered", async () => {
    renderWithReactQuery(<MarketPages />);

    await waitFor(
      () => {
        expect(screen.getByText("Bitcoin (BTC)")).toBeOnTheScreen();
      },
      { timeout: 5000 },
    );

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("Ethereum (ETH)")).toBeOnTheScreen();

    expect(screen.queryByText("Litecoin (LTC)")).not.toBeOnTheScreen();
    expect(screen.queryByText("Optimism (OP)")).not.toBeOnTheScreen();

    const marketList = await screen.findByTestId("market-list");

    fireEvent(marketList, "onEndReached");

    await waitFor(
      () => {
        expect(screen.getByText("Litecoin (LTC)")).toBeOnTheScreen();
        expect(screen.getByText("Optimism (OP)")).toBeOnTheScreen();
      },
      { timeout: 5000 },
    );

    expect(screen.getByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(screen.getByText("Ethereum (ETH)")).toBeOnTheScreen();
    expect(screen.getByText("Litecoin (LTC)")).toBeOnTheScreen();
    expect(screen.getByText("Optimism (OP)")).toBeOnTheScreen();
  });

  it("Should maintain the correct order of items across pages", async () => {
    renderWithReactQuery(<MarketPages />);

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();

    const marketList = await screen.findByTestId("market-list");
    fireEvent(marketList, "onEndReached");

    await waitFor(() => {
      expect(screen.getByText("Litecoin (LTC)")).toBeOnTheScreen();
    });

    expect(screen.getByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(screen.getByText("Ethereum (ETH)")).toBeOnTheScreen();
    expect(screen.getByText("Litecoin (LTC)")).toBeOnTheScreen();
    expect(screen.getByText("Optimism (OP)")).toBeOnTheScreen();
  });

  it("Should handle rapid scrolling without duplicating items", async () => {
    renderWithReactQuery(<MarketPages />);

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();

    const marketList = await screen.findByTestId("market-list");

    fireEvent(marketList, "onEndReached");
    fireEvent(marketList, "onEndReached");
    fireEvent(marketList, "onEndReached");

    await waitFor(() => {
      expect(screen.getByText("Litecoin (LTC)")).toBeOnTheScreen();
    });

    expect(screen.getAllByText("Bitcoin (BTC)")).toHaveLength(1);
    expect(screen.getAllByText("Ethereum (ETH)")).toHaveLength(1);
    expect(screen.getAllByText("Litecoin (LTC)")).toHaveLength(1);
    expect(screen.getAllByText("Optimism (OP)")).toHaveLength(1);
  });

  it("Should correctly append new items to the existing list", async () => {
    renderWithReactQuery(<MarketPages />);

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("Ethereum (ETH)")).toBeOnTheScreen();

    const marketList = await screen.findByTestId("market-list");
    fireEvent(marketList, "onEndReached");

    await waitFor(() => {
      expect(screen.getByText("Litecoin (LTC)")).toBeOnTheScreen();
    });

    expect(screen.getByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(screen.getByText("Ethereum (ETH)")).toBeOnTheScreen();
    expect(screen.getByText("Litecoin (LTC)")).toBeOnTheScreen();
    expect(screen.getByText("Stellar (XLM)")).toBeOnTheScreen();
  });

  it("Should not display the same item twice if it is returned in two different pages", async () => {
    const modifiedMarketsMock = marketsMock.map(item => ({ ...item }));
    modifiedMarketsMock[20] = { ...modifiedMarketsMock[0] };

    server.use(
      http.get("https://countervalues.live.ledger.com/v3/markets", ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        const page = parseInt(searchParams.get("page") || "0");
        const pageSize = parseInt(searchParams.get("pageSize") || "20");
        const startIndex = page * pageSize;
        const paginatedData = modifiedMarketsMock.slice(startIndex, startIndex + pageSize);

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
      expect(screen.getByText("Optimism (OP)")).toBeOnTheScreen();
    });

    expect(screen.getAllByText("Bitcoin (BTC)")).toHaveLength(1);
    expect(screen.getAllByText("Ethereum (ETH)")).toHaveLength(1);
    expect(screen.getAllByText("Optimism (OP)")).toHaveLength(1);
  });
});
