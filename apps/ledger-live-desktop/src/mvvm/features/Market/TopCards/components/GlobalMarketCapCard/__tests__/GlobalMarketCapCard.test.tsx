import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { server, http, HttpResponse } from "tests/server";
import { GlobalMarketCapCard } from "..";

const GLOBAL_MARKET_URL = "https://countervalues.live.ledger.com/v3/markets/global";

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

  it("opens the definition dialog when the card is clicked", async () => {
    const { user } = render(<GlobalMarketCapCard />);

    const card = await screen.findByTestId("global-market-cap-card");
    await user.click(card);

    expect(await screen.findByTestId("global-market-cap-dialog-content")).toBeVisible();
  });

  it("renders nothing on a scoped query error so the row stays intact", async () => {
    server.use(http.get(GLOBAL_MARKET_URL, () => new HttpResponse(null, { status: 500 })));

    const { container } = render(<GlobalMarketCapCard />);

    await waitFor(() => {
      expect(screen.queryByTestId("market-top-card-1")).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId("global-market-cap-card")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
