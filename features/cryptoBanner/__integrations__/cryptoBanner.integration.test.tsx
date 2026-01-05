import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { CryptoBanner } from "../components/CryptoBanner";
import { cryptoBannerApi } from "../data-layer/api/cryptoBanner.api";
import { cryptoBannerReducer } from "../data-layer/entities/cryptoBanner/cryptoBannerSlice";

const mockTopCryptosResponse = {
  cryptoAssets: {
    bitcoin: { id: "bitcoin", ticker: "BTC", name: "Bitcoin" },
    ethereum: { id: "ethereum", ticker: "ETH", name: "Ethereum" },
    solana: { id: "solana", ticker: "SOL", name: "Solana" },
    cardano: { id: "cardano", ticker: "ADA", name: "Cardano" },
    polkadot: { id: "polkadot", ticker: "DOT", name: "Polkadot" },
  },
  markets: {
    bitcoin: { price: 45000, priceChangePercentage24h: 2.5, marketCapRank: 1 },
    ethereum: { price: 3000, priceChangePercentage24h: -1.2, marketCapRank: 2 },
    solana: { price: 100, priceChangePercentage24h: 5.3, marketCapRank: 3 },
    cardano: { price: 0.5, priceChangePercentage24h: -0.8, marketCapRank: 4 },
    polkadot: { price: 7.5, priceChangePercentage24h: 1.5, marketCapRank: 5 },
  },
  currenciesOrder: {
    metaCurrencyIds: ["bitcoin", "ethereum", "solana", "cardano", "polkadot"],
  },
};

const server = setupServer(
  rest.get("https://dada.api.ledger.com/v1/assets", (req, res, ctx) => {
    return res(ctx.json(mockTopCryptosResponse));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createTestStore = () => {
  return configureStore({
    reducer: {
      cryptoBanner: cryptoBannerReducer,
      [cryptoBannerApi.reducerPath]: cryptoBannerApi.reducer,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(cryptoBannerApi.middleware),
  });
};

describe("CryptoBanner Integration", () => {
  it("should fetch and display top 5 cryptocurrencies", async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <CryptoBanner product="lld" version="1.0.0" />
      </Provider>,
    );

    expect(screen.getByText(/Loading market data/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("BTC")).toBeInTheDocument();
    });

    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.getByText("SOL")).toBeInTheDocument();
    expect(screen.getByText("ADA")).toBeInTheDocument();
    expect(screen.getByText("DOT")).toBeInTheDocument();
  });

  it("should display prices and percentage changes", async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <CryptoBanner product="lld" version="1.0.0" />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText("$45,000.00")).toBeInTheDocument();
    });

    expect(screen.getByText("+2.50%")).toBeInTheDocument();
    expect(screen.getByText("-1.20%")).toBeInTheDocument();
  });

  it("should handle API errors gracefully", async () => {
    server.use(
      rest.get("https://dada.api.ledger.com/v1/assets", (req, res, ctx) => {
        return res(ctx.status(500));
      }),
    );

    const store = createTestStore();

    render(
      <Provider store={store}>
        <CryptoBanner product="lld" version="1.0.0" />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Unable to load market data/i)).toBeInTheDocument();
    });
  });
});
