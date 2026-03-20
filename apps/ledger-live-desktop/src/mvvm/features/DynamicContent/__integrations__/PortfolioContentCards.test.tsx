import React from "react";

import { act, render, screen } from "tests/testSetup";
import PortfolioContentCards from "../components/PortfolioContentCards";

// Mocked functions
import { ClassicCard, logCardDismissal, logContentCardClick } from "@braze/web-sdk";
import { track } from "~/renderer/analytics/segment";

jest.mock("@braze/web-sdk", () => {
  class ClassicCard {
    id: string;
    extras: Record<string, string>;
    url?: string;

    constructor(id: string, extras: Record<string, string>) {
      this.id = id;
      this.extras = extras;
    }
  }

  return {
    ClassicCard,
    logCardDismissal: jest.fn(),
    logContentCardClick: jest.fn(),
  };
});

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
}));

const brazeExtrasById: Record<string, { canvas_name: string; canvas_step_name: string }> = {
  "0": {
    canvas_name: "Portfolio Canvas",
    canvas_step_name: "Portfolio Step",
  },
  "1": {
    canvas_name: "Portfolio Canvas 2",
    canvas_step_name: "Portfolio Step 2",
  },
};

const Cards = [
  {
    id: "0",
    title: "Foo",
    description: "Lorem ipsum dolor sit amet.",
    cta: "Click me",
    tag: "New",
    path: "ledger-live://deep-link",
    location: "Portfolio",
  },
  {
    id: "1",
    title: "Bar",
    description: "Consectetur adipiscing elit.",
    path: "ledger-live://deep-link",
    location: "Portfolio",
  },
];

const desktopCards = Cards.map(asBrazeCard);

describe("PortfolioContentCards", () => {
  test("render slides", async () => {
    render(<PortfolioContentCards />, {
      initialState: {
        dynamicContent: { desktopCards, portfolioCards: Cards },
        settings: { shareAnalytics: true, sharePersonalizedRecommandations: true },
      },
    });

    // I'm not sure how to properly test logContentCardImpressions and track("contentcard_impression")
    // because IntersectionObserver is not available in JSDOM and mocking it would defeat the purpose IMO.

    const title0 = await screen.findByText("Foo");
    const description0 = screen.getByText("Lorem ipsum dolor sit amet.");
    const cta0 = screen.getByText("Click me");
    const tag0 = screen.getByText("New");
    const title1 = screen.getByText("Bar");
    const description1 = screen.getByText("Consectetur adipiscing elit.");

    // Due to the styling not being applied in the test all slides are visible from the start.
    expect(title0).toBeVisible();
    expect(description0).toBeVisible();
    expect(cta0).toBeVisible();
    expect(tag0).toBeVisible();
    expect(title1).toBeVisible();
    expect(description1).toBeVisible();

    // Test next and prev buttons
    expect(track).not.toHaveBeenCalledWith("contentcard_slide", {
      button: "prev",
      page: "Portfolio",
      type: "portfolio_carousel",
    });
    expect(track).not.toHaveBeenCalledWith("contentcard_slide", {
      button: "next",
      page: "Portfolio",
      type: "portfolio_carousel",
    });

    act(() => screen.getByTestId("carousel-arrow-next").click());
    expect(track).toHaveBeenCalledWith("contentcards_slide", {
      button: "next",
      page: "Portfolio",
      type: "portfolio_carousel",
    });
    act(() => screen.getByTestId("carousel-arrow-prev").click());
    expect(track).toHaveBeenCalledWith("contentcards_slide", {
      button: "prev",
      page: "Portfolio",
      type: "portfolio_carousel",
    });

    // Test dismiss button
    expect(logCardDismissal).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalledWith("contentcard_dismissed", expect.any(Object));
    act(() => screen.getAllByTestId("portfolio-card-close-button")[1].click());
    expect(logCardDismissal).toHaveBeenCalledWith(desktopCards[1]);
    expect(track).toHaveBeenCalledWith("contentcard_dismissed", {
      canvas_name: "Portfolio Canvas 2",
      canvas_step_name: "Portfolio Step 2",
      card: "1",
      page: "Portfolio",
      type: "portfolio_carousel",
      location: "Portfolio",
    });
    expect(title1).not.toBeInTheDocument();
    expect(description1).not.toBeInTheDocument();

    // Test click button
    expect(logContentCardClick).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalledWith("contentcard_clicked", expect.any(Object));
    act(() => cta0.click());
    expect(logContentCardClick).toHaveBeenCalledTimes(1);
    expect(logContentCardClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: Cards[0].id,
        extras: brazeExtrasById[Cards[0].id],
        url: Cards[0].id,
      }),
    );
    expect(track).toHaveBeenCalledWith("contentcard_clicked", {
      canvas_name: "Portfolio Canvas",
      canvas_step_name: "Portfolio Step",
      contentcard: "Foo",
      link: "ledger-live://deep-link",
      campaign: "0",
      page: "Portfolio",
      type: "portfolio_carousel",
      location: "Portfolio",
    });
  });
});

function asBrazeCard({ id }: (typeof Cards)[number]) {
  return Object.assign(Object.create(ClassicCard.prototype), {
    id,
    extras: brazeExtrasById[id],
  });
}
