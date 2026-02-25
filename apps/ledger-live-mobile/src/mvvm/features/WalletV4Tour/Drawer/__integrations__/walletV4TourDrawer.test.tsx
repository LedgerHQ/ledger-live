import React from "react";
import { Button } from "react-native";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { useWalletV4TourDrawer, WalletV4TourDrawer } from "../index";

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
    const { user, resizeScreenWidth } = renderTestComponent();

    await user.press(screen.getByText("Open Drawer"));

    resizeScreenWidth();

    const continueButtons = screen.getAllByRole("button", { name: "Continue" });

    for (const continueButton of continueButtons) {
      await user.press(continueButton);
    }

    const exploreButton = screen.getByRole("button", { name: "Explore my new portfolio" });
    await user.press(exploreButton);

    // should never show again
    await user.press(screen.getByText("Open Drawer"));
    SLIDES.forEach(slide => {
      expect(screen.queryByText(slide.title)).not.toBeOnTheScreen();
      expect(screen.queryByText(slide.description)).not.toBeOnTheScreen();
    });
  });
});
