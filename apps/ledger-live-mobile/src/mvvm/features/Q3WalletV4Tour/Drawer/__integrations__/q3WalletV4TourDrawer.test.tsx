import React from "react";
import { Button } from "react-native";
import { fireEvent, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { useQ3WalletV4TourDrawerViewModel } from "../hooks/useQ3WalletV4TourDrawerViewModel";
import { Q3WalletV4TourDrawer } from "../index";

const SLIDES = [
  {
    title: "A quick tour of the latest",
    subtitle: "New ways to send, spend, earn, and more.",
  },
  {
    title: "Say goodbye to long addresses",
    subtitle: "Introducing Contacts. Save wallet addresses with names. Easy to find, easy to send.",
  },
  {
    title: "Say hello to Pay",
    subtitle:
      "Pay contacts, request money, and get cashback with crypto card. Now, all via one tab.",
  },
  {
    title: "Keep your crypto, finance your projects",
    subtitle: "Borrow stablecoins using wrapped BTC as collateral via Yield.xyz powered by Morpho.",
  },
] as const;

type Q3Variant = "q3_a" | "q3_b" | "q3_b2";

const TestComponent = () => {
  const { isDrawerOpen, handleOpenDrawer, handleCloseDrawer, closeDrawer, onSlideChange } =
    useQ3WalletV4TourDrawerViewModel();

  return (
    <>
      <Button onPress={handleOpenDrawer} title="Open Drawer" />
      <Q3WalletV4TourDrawer
        isDrawerOpen={isDrawerOpen}
        handleCloseDrawer={handleCloseDrawer}
        closeDrawer={closeDrawer}
        onSlideChange={onSlideChange}
      />
    </>
  );
};

describe("Q3WalletV4TourDrawer integration", () => {
  function renderTestComponent({
    hasSeenTour = false,
    variant = "q3_a",
  }: { hasSeenTour?: boolean; variant?: Q3Variant } = {}) {
    const rendered = render(<TestComponent />, {
      overrideInitialState: withFlagOverrides(
        { releaseTour: { enabled: true, params: { variant } } },
        state => ({
          ...state,
          settings: {
            ...state.settings,
            hasSeenQ3WalletV4Tour: hasSeenTour,
          },
        }),
      ),
    });

    const resizeScreenWidth = () => {
      const slidesContainer = screen.getByTestId("q3-wallet-v4-tour-slides-container");
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
    const { user, resizeScreenWidth } = renderTestComponent({
      hasSeenTour: false,
    });

    await user.press(screen.getByText("Open Drawer"));

    resizeScreenWidth();

    await waitFor(() => expect(screen.getByText(SLIDES[0].title)).toBeOnTheScreen());

    await user.press(screen.getByRole("button", { name: "Take a look" }));
  });

  it("should not show the drawer again after the tour is completed", async () => {
    const { user, resizeScreenWidth } = renderTestComponent({
      hasSeenTour: false,
    });

    await user.press(screen.getByText("Open Drawer"));

    resizeScreenWidth();

    const firstSlideTitle = await screen.findByText(SLIDES[0].title);
    await user.press(screen.getByRole("button", { name: "All caught up" }));

    expect(firstSlideTitle).not.toBeOnTheScreen();

    await user.press(screen.getByText("Open Drawer"));
    expect(screen.queryByText(SLIDES[0].title)).not.toBeOnTheScreen();
  });

  it("should not open the drawer when the user has already seen the tour", async () => {
    const { user } = renderTestComponent({ hasSeenTour: true });

    await user.press(screen.getByText("Open Drawer"));

    SLIDES.forEach(slide => {
      expect(screen.queryByText(slide.title)).not.toBeOnTheScreen();
      expect(screen.queryByText(slide.subtitle)).not.toBeOnTheScreen();
    });
  });

  it.each(["q3_a", "q3_b", "q3_b2"] as const)(
    "should open the %s tour on the intro slide",
    async variant => {
      const { user, resizeScreenWidth } = renderTestComponent({ variant });

      await user.press(screen.getByText("Open Drawer"));
      resizeScreenWidth();

      await waitFor(() => expect(screen.getByText(SLIDES[0].title)).toBeOnTheScreen());
      expect(screen.getByText(SLIDES[0].subtitle)).toBeOnTheScreen();
    },
  );
});
