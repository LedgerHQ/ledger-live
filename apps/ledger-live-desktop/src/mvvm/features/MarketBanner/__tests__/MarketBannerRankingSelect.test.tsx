import React from "react";
import { render, screen } from "tests/testSetup";
import { MarketBannerRankingSelect } from "../components/MarketBannerRankingSelect";
import { MARKET_BANNER_RANKING_SELECT_TESTID } from "../utils/constants";

describe("MarketBannerRankingSelect", () => {
  it("shows the trending ranking by default", () => {
    render(<MarketBannerRankingSelect />);
    expect(screen.getByTestId(MARKET_BANNER_RANKING_SELECT_TESTID)).toHaveTextContent("Trending");
  });

  it("reflects the persisted ranking from the store", () => {
    render(<MarketBannerRankingSelect />, {
      initialState: { marketBanner: { ranking: "losers" } },
    });
    expect(screen.getByTestId(MARKET_BANNER_RANKING_SELECT_TESTID)).toHaveTextContent("Losers");
  });

  it("lists the four rankings when opened", async () => {
    const { user } = render(<MarketBannerRankingSelect />);
    await user.click(screen.getByTestId(MARKET_BANNER_RANKING_SELECT_TESTID));

    for (const label of ["Trending", "Gainers", "Losers", "Favorites"]) {
      expect(await screen.findByRole("option", { name: label })).toBeVisible();
    }
  });

  it("disables the Favorites option when there are no starred coins", async () => {
    const { user } = render(<MarketBannerRankingSelect />, {
      initialState: { settings: { starredMarketCoins: [] } },
    });
    await user.click(screen.getByTestId(MARKET_BANNER_RANKING_SELECT_TESTID));

    expect(await screen.findByRole("option", { name: "Favorites" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("enables the Favorites option when there is at least one starred coin", async () => {
    const { user } = render(<MarketBannerRankingSelect />, {
      initialState: { settings: { starredMarketCoins: ["bitcoin"] } },
    });
    await user.click(screen.getByTestId(MARKET_BANNER_RANKING_SELECT_TESTID));

    expect(await screen.findByRole("option", { name: "Favorites" })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
