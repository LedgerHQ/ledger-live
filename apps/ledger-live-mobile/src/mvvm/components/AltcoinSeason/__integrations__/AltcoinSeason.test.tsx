import React from "react";
import { render, screen } from "@tests/test-renderer";
import { server } from "@tests/server";
import { http, HttpResponse } from "msw";
import { AltcoinSeason } from "../index";

const API_ENDPOINT = "https://proxycmc.api.live.ledger.com/v3/altcoin-season-index/latest";

const createMockResponse = (value: number) => ({
  data: {
    altcoin_index: value,
    altcoin_marketcap: 1_200_000_000_000,
  },
  status: {
    timestamp: "2026-01-14T12:00:00Z",
    error_code: 0,
    error_message: null,
    elapsed: 10,
    credit_count: 1,
    notice: null,
  },
});

describe("AltcoinSeason Integration", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it.each([
    { value: 49, label: "Bitcoin" },
    { value: 50, label: "Altcoin" },
    { value: 70, label: "Altcoin" },
  ])("should render $label when value is $value", async ({ value, label }) => {
    server.use(http.get(API_ENDPOINT, () => HttpResponse.json(createMockResponse(value))));

    render(<AltcoinSeason width={276} />);

    expect(await screen.findByText("Season")).toBeVisible();
    expect(await screen.findByText(label)).toBeVisible();
  });

  it("should open definition drawer when card is pressed", async () => {
    server.use(http.get(API_ENDPOINT, () => HttpResponse.json(createMockResponse(70))));

    const { user } = render(<AltcoinSeason width={276} />);

    const card = await screen.findByText("Altcoin");
    await user.press(card);

    expect(screen.getByText("Altcoin index")).toBeVisible();
    expect(
      screen.getByText(
        /The Altcoin index shows how Bitcoin is performing compared to alternative cryptocurrencies./i,
      ),
    ).toBeVisible();
  });
});
