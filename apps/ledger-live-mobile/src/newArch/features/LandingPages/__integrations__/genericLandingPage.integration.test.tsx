import { render, screen } from "@tests/test-renderer";
import React from "react";
import { fakeCategoryContentCards, landingPageStickyCtaCard, classicCards } from "./shared";
import { LandingPageStickyCtaContentCard, LandingPageUseCase } from "~/dynamicContent/types";
import { GenericView } from "../screens/GenericLandingPage";
import { State } from "~/reducers/types";

const logClickCard = jest.fn();
const trackContentCardEvent = jest.fn();
const useCase = LandingPageUseCase.LP_Generic;
const Linking = {
  openURL: jest.fn(),
};

const openLinkMock = jest.fn((card: LandingPageStickyCtaContentCard) => {
  trackContentCardEvent("contentcard_clicked", {
    campaign: card.id,
    link: card.link,
    contentcard: card.cta,
    landingPage: useCase,
  });
  logClickCard(card.id);
  Linking.openURL(card.link);
});

jest.mock("~/dynamicContent/useDynamicContent", () => ({
  __esModule: true,
  default: () => ({
    categoriesCards: fakeCategoryContentCards,
    mobileCards: classicCards,
    logImpressionCard: jest.fn(),
  }),
}));

describe("GenericLandingPage", () => {
  test("Display Content Cards on Landing Page, Scroll to bottom and clicks Sticky CTA", async () => {
    const { user } = render(
      <GenericView
        isLoading={false}
        openLink={openLinkMock}
        categoriesCards={fakeCategoryContentCards}
        landingStickyCTA={landingPageStickyCtaCard}
        useCase={LandingPageUseCase.LP_Generic}
      />,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            readOnlyModeEnabled: false,
            overriddenFeatureFlags: {
              flexibleContentCards: {
                enabled: true,
              },
            },
          },
          dynamicContent: {
            ...state.dynamicContent,
            mobileCards: classicCards,
          },
        }),
      },
    );
    const firstCard = fakeCategoryContentCards[0];
    const secondCard = fakeCategoryContentCards[1];

    expect(await screen.findByText(String(firstCard.cta))).toBeOnTheScreen();
    expect(await screen.findByText(String(firstCard.title))).toBeOnTheScreen();

    const scrollContainer = screen.getByTestId("flat-list-container");

    // Scroll to bottom
    await user.scrollTo(scrollContainer, {
      y: 200,
    });

    expect(await screen.findByText(String(secondCard.cta))).toBeOnTheScreen();
    expect(await screen.findByText(String(secondCard.title))).toBeOnTheScreen();

    // Click on Sticky CTA
    expect(await screen.findByText(String(landingPageStickyCtaCard.cta))).toBeOnTheScreen();
    await user.press(screen.getByText(String(landingPageStickyCtaCard.cta)));

    expect(openLinkMock).toHaveBeenCalled();
    expect(trackContentCardEvent).toHaveBeenCalledWith("contentcard_clicked", {
      campaign: "stickyCta001",
      link: "https://example.com/signup",
      contentcard: "Sign Up Now",
      landingPage: "LP_Generic",
    });
    expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/signup");
    expect(logClickCard).toHaveBeenCalledWith("stickyCta001");
  });
});
