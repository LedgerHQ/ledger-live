import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { server, http, HttpResponse } from "tests/server";
import { GlobalMarketCapCard } from "..";

const GLOBAL_MARKET_URL = "https://countervalues.live.ledger.com/v3/markets/global";
const SPOT_SIMPLE_URL = "https://countervalues.live.ledger.com/v3/spot/simple";

describe("GlobalMarketCapCard", () => {
  it("shows a loading placeholder before the query resolves, then the card", async () => {
    render(<GlobalMarketCapCard />);

    expect(screen.getByTestId("market-top-card-1")).toBeVisible();

    expect(await screen.findByTestId("global-market-cap-card")).toBeVisible();
  });

  it("renders the title and the 24h change", async () => {
    render(<GlobalMarketCapCard />);

    expect(await screen.findByText("Total market cap")).toBeVisible();
    expect(screen.getByText("2.14%")).toBeVisible();
  });

  it("rescales the USD global market cap into a crypto countervalue", async () => {
    server.use(http.get(SPOT_SIMPLE_URL, () => HttpResponse.json({ USD: 0.00001 })));

    render(<GlobalMarketCapCard />, {
      initialState: {
        settings: { counterValue: "BTC" },
      },
    });

    expect(await screen.findByText("₿25M")).toBeVisible();
  });

  it("opens the definition dialog when the card is clicked", async () => {
    const { user } = render(<GlobalMarketCapCard />);

    const card = await screen.findByTestId("global-market-cap-card");
    await user.click(card);

    expect(await screen.findByTestId("global-market-cap-dialog-content")).toBeVisible();
    expect(
      screen.getByText(
        "Data is sourced from CoinMarketCap. Provided for informational purposes only.",
      ),
    ).toBeVisible();
  });

  it("renders an error card on a scoped query error so the row stays intact", async () => {
    server.use(http.get(GLOBAL_MARKET_URL, () => new HttpResponse(null, { status: 500 })));

    render(<GlobalMarketCapCard />);

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeVisible();
      expect(screen.queryByTestId("skeleton")).toBeNull();
    });
    expect(screen.queryByTestId("global-market-cap-card")).toBeNull();
  });
});
