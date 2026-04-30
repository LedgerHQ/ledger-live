import React from "react";
import { Button } from "react-native";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { track } from "~/analytics";
import { ProductTourControlsProvider } from "../../context/ProductTourControlsContext";
import { useProductTourDrawer, ProductTourDrawer } from "../index";
import { PAGE_TRACKING_PRODUCT_TOUR, PRODUCT_TOUR_SLIDES } from "../const";
import type { ProductTourPrimaryAction } from "../const";

type TestComponentProps = {
  readonly onPrimaryActionOverride?: (action: ProductTourPrimaryAction) => void;
};

const TestComponent = ({ onPrimaryActionOverride }: TestComponentProps) => {
  const { isDrawerOpen, openProductTour, closeProductTour, onSlideChange, onPrimaryAction } =
    useProductTourDrawer();

  return (
    <>
      <Button onPress={openProductTour} title="Open Drawer" />
      <ProductTourControlsProvider
        value={{
          openProductTour,
          closeProductTour,
          onSlideChange,
          isDrawerOpen,
          onPrimaryAction: onPrimaryActionOverride ?? onPrimaryAction,
        }}
      >
        <ProductTourDrawer />
      </ProductTourControlsProvider>
    </>
  );
};

describe("ProductTourDrawer integration", () => {
  function renderTestComponent(
    {
      productTourCompleted,
      featureFlagEnabled,
      onPrimaryActionOverride,
    }: {
      productTourCompleted?: boolean;
      featureFlagEnabled?: boolean;
      onPrimaryActionOverride?: (action: ProductTourPrimaryAction) => void;
    } = {
      productTourCompleted: false,
      featureFlagEnabled: true,
    },
  ) {
    const rendered = render(<TestComponent onPrimaryActionOverride={onPrimaryActionOverride} />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          productTourCompleted: productTourCompleted ?? false,
        },
        featureFlags: {
          ...state.featureFlags,
          overrides: { lwmProductTour: { enabled: featureFlagEnabled ?? true } },
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

  async function openTourOnFirstSlide(props?: Parameters<typeof renderTestComponent>[0]) {
    const rendered = renderTestComponent(props);
    await rendered.user.press(screen.getByText("Open Drawer"));
    rendered.resizeScreenWidth();
    await screen.findByText("Slide 1 title");
    return rendered;
  }

  it("should auto-open and display the first slide when the tour is not completed", async () => {
    await openTourOnFirstSlide({ productTourCompleted: false, featureFlagEnabled: true });

    await waitFor(() => expect(screen.getByText("Slide 1 title")).toBeOnTheScreen());
    expect(screen.getByText("Slide 1 description")).toBeOnTheScreen();
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

  describe("footer buttons on the first slide", () => {
    it("should call onPrimaryAction with the slide's action when the primary CTA is pressed", async () => {
      const onPrimaryActionOverride = jest.fn();
      const { user } = await openTourOnFirstSlide({ onPrimaryActionOverride });

      const expectedAction = PRODUCT_TOUR_SLIDES[0].primaryAction;
      await user.press(screen.getByRole("button", { name: "View your portfolio" }));

      expect(onPrimaryActionOverride).toHaveBeenCalledTimes(1);
      expect(onPrimaryActionOverride).toHaveBeenCalledWith(expectedAction);
    });

    it("should track button_clicked when the primary CTA is pressed", async () => {
      const { user } = await openTourOnFirstSlide({ onPrimaryActionOverride: jest.fn() });

      await user.press(screen.getByRole("button", { name: "View your portfolio" }));

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "CTA click",
        page: PAGE_TRACKING_PRODUCT_TOUR,
        card: 1,
        action: PRODUCT_TOUR_SLIDES[0].primaryAction,
      });
    });

    it("should track button_clicked when the Continue button is pressed", async () => {
      const { user } = await openTourOnFirstSlide();

      await user.press(screen.getByRole("button", { name: "Continue" }));

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Continue",
        page: PAGE_TRACKING_PRODUCT_TOUR,
        card: 1,
      });
    });
  });
});
