import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { server, http, HttpResponse } from "tests/server";
import { AltSeasonIndexCard } from "..";

const ALTCOIN_SEASON_URL = "https://proxycmc.api.live.ledger.com/v3/altcoin-season-index/latest";

describe("AltSeasonIndexCard", () => {
  it("shows a loading placeholder before the query resolves, then the card", async () => {
    render(<AltSeasonIndexCard />);

    expect(screen.getByTestId("market-top-card-3")).toBeVisible();

    expect(await screen.findByTestId("alt-season-index-card")).toBeVisible();
  });

  it("renders the title and the altcoin level when the index is 50 or above", async () => {
    render(<AltSeasonIndexCard />);

    expect(await screen.findByText("Season")).toBeVisible();
    expect(screen.getByText("Altcoin")).toBeVisible();
  });

  it("renders the bitcoin level when the index is below 50", async () => {
    server.use(
      http.get(ALTCOIN_SEASON_URL, () =>
        HttpResponse.json({
          data: { altcoin_index: 20, altcoin_marketcap: 1_000_000_000_000 },
          status: {
            timestamp: "2024-01-01T00:00:00.000Z",
            error_code: 0,
            error_message: null,
            elapsed: 1,
            credit_count: 1,
            notice: null,
          },
        }),
      ),
    );

    render(<AltSeasonIndexCard />);

    expect(await screen.findByText("Bitcoin")).toBeVisible();
  });

  it("opens the definition dialog when the card is clicked", async () => {
    const { user } = render(<AltSeasonIndexCard />);

    const card = await screen.findByTestId("alt-season-index-card");
    await user.click(card);

    expect(await screen.findByTestId("alt-season-index-dialog-content")).toBeVisible();
  });

  it("renders an error card on a scoped query error so the row stays intact", async () => {
    server.use(http.get(ALTCOIN_SEASON_URL, () => new HttpResponse(null, { status: 500 })));

    render(<AltSeasonIndexCard />);

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeVisible();
      expect(screen.queryByTestId("skeleton")).toBeNull();
    });
    expect(screen.queryByTestId("alt-season-index-card")).toBeNull();
  });
});
