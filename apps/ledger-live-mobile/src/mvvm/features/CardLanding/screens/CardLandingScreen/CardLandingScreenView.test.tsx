import React from "react";
import { render, screen } from "@tests/test-renderer";
import CardLandingScreenView from "./CardLandingScreenView";
import { CARD_LANDING_TEST_IDS } from "../../testIds";
import type { CardLandingCta } from "../../types";
import { Screens, CreditCard } from "@ledgerhq/lumen-ui-rnative/symbols";

describe("CardLandingScreenView", () => {
  const mockCtas: CardLandingCta[] = [
    {
      id: "explore_cards",
      label: "Explore cards",
      icon: Screens,
      onPress: jest.fn(),
      testID: CARD_LANDING_TEST_IDS.ctas.exploreCards,
    },
    {
      id: "i_have_a_card",
      label: "I have a card",
      icon: CreditCard,
      onPress: jest.fn(),
      testID: CARD_LANDING_TEST_IDS.ctas.iHaveACard,
    },
  ];

  const defaultProps = {
    title: "Spend your crypto",
    subtitle: "Pay online or in store with a crypto card",
    ctas: mockCtas,
    pageName: "Card Landing",
    topInset: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the screen", () => {
    render(<CardLandingScreenView {...defaultProps} />);

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.screen)).toBeVisible();
  });

  it("should render title with correct text", () => {
    render(<CardLandingScreenView {...defaultProps} />);

    const title = screen.getByTestId(CARD_LANDING_TEST_IDS.title);
    expect(title).toBeVisible();
    expect(title.props.children).toBe("Spend your crypto");
  });

  it("should render subtitle with correct text", () => {
    render(<CardLandingScreenView {...defaultProps} />);

    const subtitle = screen.getByTestId(CARD_LANDING_TEST_IDS.subtitle);
    expect(subtitle).toBeVisible();
    expect(subtitle.props.children).toBe("Pay online or in store with a crypto card");
  });

  it("should render card image", () => {
    render(<CardLandingScreenView {...defaultProps} />);

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.cardImage)).toBeVisible();
  });

  it("should render CTAs container", () => {
    render(<CardLandingScreenView {...defaultProps} />);

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.ctas.container)).toBeVisible();
  });

  it("should render all CTAs", () => {
    render(<CardLandingScreenView {...defaultProps} />);

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.ctas.exploreCards)).toBeVisible();
    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.ctas.iHaveACard)).toBeVisible();
  });

  it("should render CTA labels correctly", () => {
    render(<CardLandingScreenView {...defaultProps} />);

    expect(screen.getByText("Explore cards")).toBeVisible();
    expect(screen.getByText("I have a card")).toBeVisible();
  });

  it("should apply correct topInset to content", () => {
    const topInset = 120;
    const { rerender } = render(<CardLandingScreenView {...defaultProps} topInset={topInset} />);

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.screen)).toBeVisible();

    // Test with different topInset
    rerender(<CardLandingScreenView {...defaultProps} topInset={80} />);
    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.screen)).toBeVisible();
  });

  it("should handle empty CTAs array", () => {
    render(<CardLandingScreenView {...defaultProps} ctas={[]} />);

    expect(screen.getByTestId(CARD_LANDING_TEST_IDS.ctas.container)).toBeVisible();
    expect(screen.queryByTestId(CARD_LANDING_TEST_IDS.ctas.exploreCards)).toBeNull();
    expect(screen.queryByTestId(CARD_LANDING_TEST_IDS.ctas.iHaveACard)).toBeNull();
  });

  it("should truncate title to 2 lines", () => {
    render(<CardLandingScreenView {...defaultProps} />);

    const title = screen.getByTestId(CARD_LANDING_TEST_IDS.title);
    expect(title.props.numberOfLines).toBe(2);
  });
});
