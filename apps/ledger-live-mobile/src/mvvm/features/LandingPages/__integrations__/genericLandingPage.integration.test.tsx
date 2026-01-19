import { render, screen } from "@tests/test-renderer";
import React from "react";
import { fakeCategoryContentCards, landingPageStickyCtaCard, classicCards } from "./shared";
import {
  LandingPageStickyCtaContentCard,
  LandingPageUseCase,
  ContentCardsType,
} from "~/dynamicContent/types";
import VerticalCard from "~/contentCards/cards/vertical";
import { ContentCardMetadata } from "~/contentCards/cards/types";
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

describe("Content cards clickability", () => {
  const createVerticalCard = (metadata: ContentCardMetadata, id: string) => {
    return (
      <VerticalCard
        title="Test Card"
        description="desc"
        size="L"
        media="https://example.com/img.png"
        metadata={metadata}
        id={id}
        createdAt={Date.now() / 1000}
        viewed={false}
        widthFactor={1}
        type={ContentCardsType.bigSquare}
      />
    );
  };

  const testCardClickability = async (isClickable: boolean) => {
    const onClick = jest.fn();
    const metadata = isClickable
      ? { id: "vcard-clickable", actions: { onClick } }
      : { id: "vcard-non-clickable", actions: {} };

    const component = createVerticalCard(
      metadata,
      `test-vertical-${isClickable ? "clickable" : "non-clickable"}`,
    );
    const { user } = render(component);

    const card = await screen.findByTestId("content-card-container");
    expect(card).toBeOnTheScreen();

    await user.press(card);

    if (isClickable) {
      expect(onClick).toHaveBeenCalled();
      expect(card.props.accessibilityRole).toBe("button");
    } else {
      expect(onClick).not.toHaveBeenCalled();
      expect(card.props.accessibilityRole).toBeUndefined();
    }
  };

  test("Vertical card is clickable when onClick provided", async () => {
    await testCardClickability(true);
  });

  test("Vertical card is not clickable when onClick is missing", async () => {
    await testCardClickability(false);
  });
});
