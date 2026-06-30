import React from "react";
import { Button } from "react-native";
import { fireEvent, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { useQ2WalletV4TourDrawerViewModel } from "../hooks/useQ2WalletV4TourDrawerViewModel";
import { Q2WalletV4TourDrawer } from "../index";

const SLIDES = [
  {
    title: "Smarter portfolio management. Clearer paths to growth",
  },
  {
    title: "One balance for each asset",
    subtitle: "Multi-chain assets like USDT are now shown as one total. Simple, accurate, clear.",
  },
  {
    title: "Your returns, front and center",
    subtitle: "See profit and loss on every asset, across your portfolio and analytics page.",
  },
  {
    title: "Test your earn potential",
    subtitle: "Simulate what rewards you can earn and build a growth plan that fits your goals.",
  },
  {
    title: "More protocols, more rewards",
    subtitle:
      "Stablecoins and top picks, surfaced right in your wallet. Less searching. More deciding.",
  },
] as const;

const Q2_TOUR_FEATURE_FLAGS = {
  lwmWallet40: { enabled: true, params: { q2Tour: true } },
};

const TestComponent = () => {
  const { isDrawerOpen, handleOpenDrawer, handleCloseDrawer, closeDrawer, onSlideChange } =
    useQ2WalletV4TourDrawerViewModel();

  return (
    <>
      <Button onPress={handleOpenDrawer} title="Open Drawer" />
      <Q2WalletV4TourDrawer
        isDrawerOpen={isDrawerOpen}
        handleCloseDrawer={handleCloseDrawer}
        closeDrawer={closeDrawer}
        onSlideChange={onSlideChange}
      />
    </>
  );
};

describe("Q2WalletV4TourDrawer integration", () => {
  function renderTestComponent({ hasSeenTour = false } = {}) {
    const rendered = render(<TestComponent />, {
      overrideInitialState: withFlagOverrides(Q2_TOUR_FEATURE_FLAGS, state => ({
        ...state,
        settings: {
          ...state.settings,
          hasSeenQ2WalletV4Tour: hasSeenTour,
        },
      })),
    });

    const resizeScreenWidth = () => {
      const slidesContainer = screen.getByTestId("q2-wallet-v4-tour-slides-container");
      fireEvent(slidesContainer, "layout", {
        nativeEvent: { layout: { width: 375, height: 800 } },
      });
    };

    return {
      ...rendered,
      resizeScreenWidth,
    };
  }

  it("should open the drawer and show the first slide", async () => {
    const { user, resizeScreenWidth } = renderTestComponent({ hasSeenTour: false });

    await user.press(screen.getByText("Open Drawer"));

    resizeScreenWidth();

    await waitFor(() => expect(screen.getByText(SLIDES[0].title)).toBeOnTheScreen());

    await user.press(screen.getByRole("button", { name: "See what's new" }));
  });

  it("should not show the drawer again after the tour is completed", async () => {
    const { user, resizeScreenWidth } = renderTestComponent({ hasSeenTour: false });

    await user.press(screen.getByText("Open Drawer"));

    resizeScreenWidth();

    const firstSlideTitle = await screen.findByText(SLIDES[0].title);
    await user.press(screen.getByRole("button", { name: "Got it" }));

    expect(firstSlideTitle).not.toBeOnTheScreen();

    await user.press(screen.getByText("Open Drawer"));
    expect(screen.queryByText(SLIDES[0].title)).not.toBeOnTheScreen();
  });

  it("should not open the drawer when the user has already seen the tour", async () => {
    const { user } = renderTestComponent({ hasSeenTour: true });

    await user.press(screen.getByText("Open Drawer"));

    SLIDES.forEach(slide => {
      expect(screen.queryByText(slide.title)).not.toBeOnTheScreen();
      if ("subtitle" in slide && slide.subtitle) {
        expect(screen.queryByText(slide.subtitle)).not.toBeOnTheScreen();
      }
    });
  });
});
