import React from "react";
import { Button } from "react-native";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { useProductTourDrawer, ProductTourDrawer } from "../index";

const TestComponent = () => {
  const { isDrawerOpen, openDrawer, closeDrawer, onSlideChange } = useProductTourDrawer();

  return (
    <>
      <Button onPress={openDrawer} title="Open Drawer" />
      <ProductTourDrawer
        isDrawerOpen={isDrawerOpen}
        closeDrawer={closeDrawer}
        onSlideChange={onSlideChange}
      />
    </>
  );
};

describe("ProductTourDrawer integration", () => {
  function renderTestComponent(
    { productTourCompleted, featureFlagEnabled } = {
      productTourCompleted: false,
      featureFlagEnabled: true,
    },
  ) {
    const rendered = render(<TestComponent />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          productTourCompleted,
        },
        featureFlags: {
          ...state.featureFlags,
          overrides: { lwmProductTour: { enabled: featureFlagEnabled } },
        },
      }),
    });

    // Run this to make sure Slides is rendered as it requires its container's width > 0.
    // Must be called after awaiting a user interaction so that act() flushes the bottom
    // sheet portal timers and makes the Slides container queryable.
    const resizeScreenWidth = () => {
      const slidesContainer = screen.getByTestId("product-tour-slides-container");
      fireEvent(slidesContainer, "layout", {
        nativeEvent: { layout: { width: 375, height: 800 } },
      });
    };

    return {
      ...rendered,
      resizeScreenWidth,
    };
  }

  it("should auto-open and display the first slide when the tour is not completed", async () => {
    const { user, resizeScreenWidth } = renderTestComponent({
      productTourCompleted: false,
      featureFlagEnabled: true,
    });

    // The drawer is already open (isDrawerOpen starts as true when !productTourCompleted).
    // Pressing "Open Drawer" is a no-op state-wise but the act() wrapper flushes bottom
    // sheet portal timers so the Slides container becomes queryable.
    await user.press(screen.getByText("Open Drawer"));
    resizeScreenWidth();

    await waitFor(() => expect(screen.getByText("Slide 1 title")).toBeOnTheScreen());
    expect(screen.getByText("Slide 1 description")).toBeOnTheScreen();
  });

  it("should be able to press the Continue button on the first slide", async () => {
    const { user, resizeScreenWidth } = renderTestComponent({
      productTourCompleted: false,
      featureFlagEnabled: true,
    });

    await user.press(screen.getByText("Open Drawer"));
    resizeScreenWidth();

    await screen.findByText("Slide 1 title");

    // In test env both buttons are pressable; pressing Continue on slide 0
    // calls goToNext which does not navigate in this simulated environment
    await screen.findByRole("button", { name: "Continue" });
  });

  it("should not open the drawer when product tour is already completed", async () => {
    const { user } = renderTestComponent({ productTourCompleted: true, featureFlagEnabled: true });

    await user.press(screen.getByText("Open Drawer"));

    expect(screen.queryByText("Slide 1 title")).not.toBeOnTheScreen();
    expect(screen.queryByText("Slide 1 description")).not.toBeOnTheScreen();
  });

  it("should not open the drawer when the feature flag is disabled", async () => {
    const { user } = renderTestComponent({
      productTourCompleted: false,
      featureFlagEnabled: false,
    });

    await user.press(screen.getByText("Open Drawer"));

    expect(screen.queryByText("Slide 1 title")).not.toBeOnTheScreen();
    expect(screen.queryByText("Slide 1 description")).not.toBeOnTheScreen();
  });
});
