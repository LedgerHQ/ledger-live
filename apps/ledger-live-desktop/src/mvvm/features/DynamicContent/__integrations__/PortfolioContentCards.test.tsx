import React from "react";

import { render, screen } from "tests/testSetup";
import PortfolioContentCards from "../components/PortfolioContentCards";
import { BottomCarouselContentCards } from "../components/BottomCarouselContentCards";
import { ClassicCard, logCardDismissal, logContentCardClick } from "@braze/web-sdk";
import { track } from "~/renderer/analytics/segment";
import { LocationContentCard } from "~/types/dynamicContent";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";

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
    location: LocationContentCard.Portfolio,
  },
  {
    id: "1",
    title: "Bar",
    description: "Consectetur adipiscing elit.",
    path: "ledger-live://deep-link",
    location: LocationContentCard.Portfolio,
  },
];

const BottomCards = [
  {
    id: "2",
    title: "Foo",
    description: "Lorem ipsum dolor sit amet.",
    cta: "Click me",
    tag: "New",
    path: "ledger-live://deep-link",
    location: LocationContentCard.BottomPortfolio,
  },
  {
    id: "3",
    title: "Bar",
    description: "Consectetur adipiscing elit.",
    path: "ledger-live://deep-link",
    location: LocationContentCard.BottomPortfolio,
  },
];

jest.mock("@braze/web-sdk", () => {
  class ClassicCard {
    id: string;
    extras: Record<string, unknown>;
    url?: string;

    constructor(id: string, extras: Record<string, unknown>) {
      this.id = id;
      this.extras = extras;
    }
  }

  return {
    ClassicCard,
    getCachedContentCards: jest.fn(),
    logCardDismissal: jest.fn(),
    logContentCardClick: jest.fn(),
  };
});

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
}));

function asClassicBrazeCard(card: (typeof Cards)[number] | (typeof BottomCards)[number]) {
  const { id, ...rest } = card;
  const extras = { ...brazeExtrasById[id], ...rest };
  return Object.assign(Object.create(ClassicCard.prototype), { id, extras });
}

beforeEach(() => {
  jest.clearAllMocks();
});

const desktopCardsForTopCarousel = Cards.map(asClassicBrazeCard);
const desktopCardsWithBottomPlacements = [...Cards, ...BottomCards].map(asClassicBrazeCard);

describe("PortfolioContentCards", () => {
  test("render slides", async () => {
    const { user } = render(<PortfolioContentCards />, {
      initialState: {
        dynamicContent: { desktopCards: desktopCardsForTopCarousel, portfolioCards: Cards },
        settings: {
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
          lastAnalyticsConsentDate: new Date().toISOString(),
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        },
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

    await user.click(screen.getByTestId("carousel-arrow-next"));
    expect(track).toHaveBeenCalledWith("contentcards_slide", {
      button: "next",
      page: "Portfolio",
      type: "carousel_portfolio",
    });
    await user.click(screen.getByTestId("carousel-arrow-prev"));
    expect(track).toHaveBeenCalledWith("contentcards_slide", {
      button: "prev",
      page: "Portfolio",
      type: "carousel_portfolio",
    });

    // Test dismiss button
    expect(logCardDismissal).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalledWith("contentcard_dismissed", expect.any(Object));
    await user.click(screen.getAllByTestId("portfolio-card-close-button")[1]);
    expect(logCardDismissal).toHaveBeenCalledWith(
      expect.objectContaining({
        id: Cards[1].id,
        extras: expect.objectContaining(brazeExtrasById[Cards[1].id]),
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "contentcard_dismissed",
      expect.objectContaining({
        canvas_name: "Portfolio Canvas 2",
        canvas_step_name: "Portfolio Step 2",
        card: "1",
        page: "Portfolio",
        type: "portfolio_carousel",
        location: LocationContentCard.Portfolio,
      }),
    );
    expect(title1).not.toBeInTheDocument();
    expect(description1).not.toBeInTheDocument();

    // Test click button
    expect(logContentCardClick).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalledWith("contentcard_clicked", expect.any(Object));
    await user.click(cta0);
    expect(logContentCardClick).toHaveBeenCalledTimes(1);
    expect(logContentCardClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: Cards[0].id,
        extras: expect.objectContaining(brazeExtrasById[Cards[0].id]),
        url: Cards[0].id,
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "contentcard_clicked",
      expect.objectContaining({
        canvas_name: "Portfolio Canvas",
        canvas_step_name: "Portfolio Step",
        contentcard: "Foo",
        link: "ledger-live://deep-link",
        campaign: "0",
        page: "Portfolio",
        type: "portfolio_carousel",
        location: LocationContentCard.Portfolio,
      }),
    );
  });
});

describe("BottomCarouselContentCards", () => {
  test("render slides", async () => {
    const { user } = render(<BottomCarouselContentCards />, {
      initialState: {
        dynamicContent: {
          desktopCards: desktopCardsWithBottomPlacements,
          portfolioCards: [],
          bottomPortfolioCards: BottomCards,
        },
        settings: {
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
          lastAnalyticsConsentDate: new Date().toISOString(),
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        },
      },
    });

    const title0 = await screen.findByText("Foo");
    const tag0 = screen.getByText("New");
    const title1 = screen.getByText("Bar");

    expect(title0).toBeVisible();
    expect(tag0).toBeVisible();
    expect(title1).toBeVisible();

    expect(logCardDismissal).not.toHaveBeenCalled();
    const closeButtons = screen.getAllByRole("button", { name: /close/i });
    await user.click(closeButtons[1]);
    expect(logCardDismissal).toHaveBeenCalledWith(
      expect.objectContaining({ id: BottomCards[1].id }),
    );
    expect(track).toHaveBeenCalledWith(
      "contentcard_dismissed",
      expect.objectContaining({
        card: "3",
        page: "Portfolio",
        type: "portfolio_carousel",
        location: LocationContentCard.BottomPortfolio,
      }),
    );
    expect(title1).not.toBeInTheDocument();

    expect(logContentCardClick).not.toHaveBeenCalled();
    await user.click(title0);
    expect(logContentCardClick).toHaveBeenCalledTimes(1);
    expect(logContentCardClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: BottomCards[0].id,
        extras: expect.objectContaining({
          title: BottomCards[0].title,
          location: LocationContentCard.BottomPortfolio,
        }),
        url: BottomCards[0].id,
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "contentcard_clicked",
      expect.objectContaining({
        contentcard: "Foo",
        link: "ledger-live://deep-link",
        campaign: "2",
        page: "Portfolio",
        type: "portfolio_carousel",
        location: LocationContentCard.BottomPortfolio,
      }),
    );
  });
});
