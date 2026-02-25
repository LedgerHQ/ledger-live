import React from "react";
import { render, screen } from "@tests/test-renderer";
import { CardLandingScreen } from "./index";
import { track } from "~/analytics";
import { CARD_LANDING_TEST_IDS } from "../../testIds";
import { PAGE_NAME } from "../../constants";
import { CARD_APP_ID, CL_CARD_APP_ID } from "../../constants";
import { ScreenName } from "~/const";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/core", () => {
  const actual = jest.requireActual("@react-navigation/core");
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
    useNavigationIndependentTree: () => ({}),
  };
});

const testIds = [
  CARD_LANDING_TEST_IDS.screen,
  CARD_LANDING_TEST_IDS.title,
  CARD_LANDING_TEST_IDS.subtitle,
  CARD_LANDING_TEST_IDS.cardImage,
  ...Object.values(CARD_LANDING_TEST_IDS.ctas),
];

describe("CardLandingScreen", () => {
  it("renders screen with title, subtitle, image and CTAs", () => {
    render(<CardLandingScreen />);

    testIds.forEach(testId => {
      expect(screen.getByTestId(testId)).toBeVisible();
    });
  });

  it("shows correct content from view model", () => {
    const { getByTestId, getByText } = render(<CardLandingScreen />);

    expect(getByTestId(CARD_LANDING_TEST_IDS.title).props.children).toBe("Spend your\ncrypto");
    expect(getByTestId(CARD_LANDING_TEST_IDS.subtitle).props.children).toBe(
      "Pay online or in store with a crypto card",
    );
    expect(getByText(/Explore cards/i)).toBeVisible();
    expect(getByText(/I have a card/i)).toBeVisible();
  });

  it("truncates title to 2 lines", () => {
    const { getByTestId } = render(<CardLandingScreen />);

    expect(getByTestId(CARD_LANDING_TEST_IDS.title).props.numberOfLines).toBe(2);
  });

  it("tracks and navigates to card program when Explore cards is pressed", async () => {
    const { user } = render(<CardLandingScreen />);

    await user.press(screen.getByTestId(CARD_LANDING_TEST_IDS.ctas.exploreCards));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "explore cards",
      page: PAGE_NAME,
    });
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.PlatformApp, {
      platform: CARD_APP_ID,
      name: "Card Program",
    });
  });

  it("tracks and navigates to CL card when I have a card is pressed", async () => {
    const { user } = render(<CardLandingScreen />);

    await user.press(screen.getByTestId(CARD_LANDING_TEST_IDS.ctas.iHaveACard));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "I have a card",
      page: PAGE_NAME,
    });
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.PlatformApp, {
      platform: CL_CARD_APP_ID,
      name: "CL Card Powered by Ledger",
    });
  });
});
