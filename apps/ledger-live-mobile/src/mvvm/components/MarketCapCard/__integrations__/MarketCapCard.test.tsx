import React from "react";
import { render, screen, within } from "@tests/test-renderer";
import { server } from "@tests/server";
import { http, HttpResponse } from "msw";
import { MarketCapCard } from "../index";

const API_ENDPOINT = "https://countervalues.live.ledger.com/v3/markets/global";

// percentageChanges are ratios (0.1 => +10.00%).
const createMockResponse = (marketCap: number, dailyChangeRatio: number) => ({
  marketCap,
  percentageChanges: {
    "1d": dailyChangeRatio,
    "1w": 0,
    "1m": 0,
    "6m": 0,
    "1y": 0,
  },
});

describe("MarketCapCard Integration", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("should render total market cap and 24h variation", async () => {
    server.use(
      http.get(API_ENDPOINT, () => HttpResponse.json(createMockResponse(3_000_000_000_000, 0.1))),
    );

    render(<MarketCapCard width={276} />);

    const card = within(await screen.findByTestId("market-cap-card"));
    expect(card.getByText("Total market cap")).toBeVisible();
    expect(card.getByText(/3.*T/i)).toBeVisible();
    expect(card.getByText("10.00%")).toBeVisible();
  });

  it("should open definition drawer when card is pressed", async () => {
    server.use(
      http.get(API_ENDPOINT, () => HttpResponse.json(createMockResponse(3_000_000_000_000, 0.1))),
    );

    const { user } = render(<MarketCapCard width={276} />);

    await user.press(await screen.findByTestId("market-cap-card"));

    expect(
      screen.getByText(
        "The total market cap represents the market capitalization of all cryptocurrencies combined.",
      ),
    ).toBeVisible();
  });
});
