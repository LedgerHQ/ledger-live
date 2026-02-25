import React from "react";
import { Button } from "react-native";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { useWalletV4TourDrawer, WalletV4TourDrawer } from "../index";

const SLIDES = [
  {
    title: "Your portfolio, reimagined",
    description:
      "We've decluttered your home screen. Missing your graph? Just tap below your balance.",
    lottieSrc: 1,
    speed: 1.25,
  },
  {
    title: "Everything in its right place",
    description:
      "My Ledger & Discover are now at the top. Swap & Card have moved to the bottom for faster access.",
    lottieSrc: 2,
    speed: 1.5,
  },
  {
    title: "Actions at market speed",
    description: "Spot market trends with the new banner and trade instantly.",
    lottieSrc: 3,
    speed: 1.5,
  },
];

const TestComponent = () => {
  const { isDrawerOpen, handleOpenDrawer, handleCloseDrawer } = useWalletV4TourDrawer();

  return (
    <>
      <Button onPress={handleOpenDrawer} title="Open Drawer" />
      <WalletV4TourDrawer
        isDrawerOpen={isDrawerOpen}
        handleCloseDrawer={handleCloseDrawer}
        slides={SLIDES}
      />
    </>
  );
};

describe("WalletV4TourDrawer integration", () => {
  function renderTestComponent(
    { hasSeenTour } = {
      hasSeenTour: false,
    },
  ) {
    const rendered = render(<TestComponent />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          hasCompletedOnboarding: true,
          hasSeenWalletV4Tour: hasSeenTour,
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

  it("should be able to open the drawer and see the first slide as it is not possible to go next on this simulated environment", async () => {
    const { user, resizeScreenWidth } = renderTestComponent({ hasSeenTour: false });

    await user.press(screen.getByText("Open Drawer"));

    resizeScreenWidth();

    await waitFor(() => expect(screen.getByText(SLIDES[0].title)).toBeOnTheScreen());
    expect(screen.getByText(SLIDES[0].description)).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Next" }));
  });

  it("should not be able to see the drawer again after user has seen the tour", async () => {
    const { user, resizeScreenWidth } = renderTestComponent({ hasSeenTour: false });

    await user.press(screen.getByText("Open Drawer"));

    resizeScreenWidth();

    const firstSlideTitle = await screen.findByText(SLIDES[0].title);
    await user.press(screen.getByRole("button", { name: "Discover my new portfolio" }));

    expect(firstSlideTitle).not.toBeOnTheScreen();

    await user.press(screen.getByText("Open Drawer"));
    expect(screen.queryByText(SLIDES[0].title)).not.toBeOnTheScreen();
  });

  it.skip("should not be able to see the drawer again after user has closed the drawer", async () => {
    const { user, resizeScreenWidth } = renderTestComponent({ hasSeenTour: false });

    await user.press(screen.getByText("Open Drawer"));

    resizeScreenWidth();

    const firstSlideTitle = await screen.findByText(SLIDES[0].title);
    expect(firstSlideTitle).toBeOnTheScreen();
    const closeButton = screen.getByTestId("drawer-close-button");
    await user.press(closeButton);

    // TODO: For some reason, onClose is called but the state isn't updated yet.
    await waitFor(() => expect(firstSlideTitle).not.toBeOnTheScreen());

    await user.press(screen.getByText("Open Drawer"));
    expect(screen.queryByText(SLIDES[0].title)).not.toBeOnTheScreen();
  });

  it("should not open the drawer when user has already seen the tour (hasSeenTour blocks open)", async () => {
    const { user } = renderTestComponent({ hasSeenTour: true });

    await user.press(screen.getByText("Open Drawer"));

    SLIDES.forEach(slide => {
      expect(screen.queryByText(slide.title)).not.toBeOnTheScreen();
      expect(screen.queryByText(slide.description)).not.toBeOnTheScreen();
    });
  });
});
