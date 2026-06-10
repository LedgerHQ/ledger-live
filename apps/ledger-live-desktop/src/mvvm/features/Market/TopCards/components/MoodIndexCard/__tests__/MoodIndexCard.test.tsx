import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { server, http, HttpResponse } from "tests/server";
import { MoodIndexCard } from "..";

const FEAR_AND_GREED_URL = "https://proxycmc.api.live.ledger.com/v3/fear-and-greed/latest";

describe("MoodIndexCard", () => {
  it("shows a loading placeholder before the query resolves, then the card", async () => {
    render(<MoodIndexCard />);

    expect(screen.getByTestId("market-top-card-2")).toBeVisible();

    expect(await screen.findByTestId("mood-index-card")).toBeVisible();
  });

  it("renders the mood index title and the sentiment classification", async () => {
    render(<MoodIndexCard />);

    expect(await screen.findByText("Mood index")).toBeVisible();
    expect(screen.getByText("Greed")).toBeVisible();
  });

  it("opens the definition dialog when the card is clicked", async () => {
    const { user } = render(<MoodIndexCard />);

    const card = await screen.findByTestId("mood-index-card");
    await user.click(card);

    expect(await screen.findByTestId("fear-and-greed-dialog-content")).toBeVisible();
  });

  it("renders an error card on a scoped query error so the row stays intact", async () => {
    server.use(http.get(FEAR_AND_GREED_URL, () => new HttpResponse(null, { status: 500 })));

    render(<MoodIndexCard />);

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeVisible();
      expect(screen.queryByTestId("skeleton")).toBeNull();
    });
    expect(screen.queryByTestId("mood-index-card")).toBeNull();
  });
});
