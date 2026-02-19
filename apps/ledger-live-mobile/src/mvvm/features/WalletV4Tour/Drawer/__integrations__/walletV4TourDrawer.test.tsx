import React from "react";
import { Button } from "react-native";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { useWalletV4TourDrawer, WalletV4TourDrawer } from "../index";

/**
 * In Jest there is no real scroll: the carousel (FlatList) never fires onMomentumScrollEnd,
 * so useSlidesContext's currentIndex/scrollProgress never advance when the user taps Continue.
 * We mock the context with a configurable currentIndex so we can:
 * - Test first slide + Continue button (currentIndex 0)
 * - Test last slide + Explore button and Redux outcome (currentIndex 2)
 * Full slide-by-slide navigation (Continue → slide 2 → Continue → slide 3) is better covered by E2E.
 */
let mockSlidesCurrentIndex = 2;

jest.mock("@ledgerhq/native-ui", () => {
  const actual = jest.requireActual("@ledgerhq/native-ui");
  return {
    ...actual,
    useSlidesContext: () => ({
      currentIndex: mockSlidesCurrentIndex,
      totalSlides: 3,
      goToNext: () => {},
      goToPrevious: () => {},
      goToSlide: () => {},
      flatListRef: { current: null },
      scrollProgressSharedValue: { value: mockSlidesCurrentIndex },
    }),
  };
});

const TestComponent = () => {
  const { isDrawerOpen, handleOpenDrawer, handleCloseDrawer } = useWalletV4TourDrawer();
  return (
    <>
      <Button onPress={handleOpenDrawer} title="Open Drawer" />
      {isDrawerOpen && (
        <WalletV4TourDrawer isDrawerOpen={isDrawerOpen} handleCloseDrawer={handleCloseDrawer} />
      )}
    </>
  );
};

describe("WalletV4TourDrawer integration", () => {
  function renderTestComponent() {
    const rendered = render(<TestComponent />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          hasSeenWalletV4Tour: false,
        },
      }),
    });

    // Run this to make sure Slides is rendered as it requires its container's width > 0
    const resizeScreenWidth = () => {
      const slidesContainer = screen.getByTestId("walletv4-tour-slides-container");
      fireEvent(slidesContainer, "layout", {
        nativeEvent: { layout: { width: 375, height: 800 } },
      });
    };

    return {
      ...rendered,
      resizeScreenWidth,
    };
  }

  const SLIDES = [
    {
      title: "Your portfolio, reimagined",
      description:
        "We've decluttered your home screen. Missing your graph? Just tap below your balance.",
    },
    {
      title: "Everything in its right place",
      description:
        "My Ledger & Discover are now at the top. Swap & Card have moved to the bottom for faster access.",
    },
    {
      title: "Actions at market speed",
      description: "Spot market trends with the new banner and trade instantly.",
    },
  ];

  it("should show first slide and Continue button when on first slide", async () => {
    mockSlidesCurrentIndex = 0;
    const { user, resizeScreenWidth } = renderTestComponent();

    await user.press(screen.getByText("Open Drawer"));
    resizeScreenWidth();

    await waitFor(() => expect(screen.getByText(SLIDES[0].title)).toBeOnTheScreen());
    expect(screen.getByText(SLIDES[0].description)).toBeOnTheScreen();
    const continueButton = screen.getByRole("button", { name: /continue/i });
    expect(continueButton).toBeOnTheScreen();
    await user.press(continueButton);
  });

  it("should be able to open the drawer and see all the slides", async () => {
    const { user, resizeScreenWidth } = renderTestComponent();

    await user.press(screen.getByText("Open Drawer"));

    resizeScreenWidth();

    await waitFor(() => expect(screen.getByText("Your portfolio, reimagined")).toBeOnTheScreen());
    SLIDES.forEach(slide => {
      expect(screen.getByText(slide.title)).toBeOnTheScreen();
      expect(screen.getByText(slide.description)).toBeOnTheScreen();
    });
  });

  it('should close the drawer and never show again when user presses the "Explore my new portfolio" button on the last slide', async () => {
    mockSlidesCurrentIndex = 2;
    const { user, resizeScreenWidth } = renderTestComponent();

    await user.press(screen.getByText("Open Drawer"));

    resizeScreenWidth();

    await user.press(screen.getByText("Explore my new portfolio"));

    // should never show again
    await user.press(screen.getByText("Open Drawer"));
    SLIDES.forEach(slide => {
      expect(screen.queryByText(slide.title)).not.toBeOnTheScreen();
      expect(screen.queryByText(slide.description)).not.toBeOnTheScreen();
    });
  });
});