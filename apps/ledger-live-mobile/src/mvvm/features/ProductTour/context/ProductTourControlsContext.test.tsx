import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { ProductTourControlsProvider, useProductTourControls } from "./ProductTourControlsContext";

function ContextProbe() {
  const controls = useProductTourControls();
  return <Text>{controls ? "inside" : "outside"}</Text>;
}

describe("ProductTourControlsContext", () => {
  it("should return null from useProductTourControls when rendered outside the provider", () => {
    render(<ContextProbe />);

    expect(screen.getByText("outside")).toBeVisible();
  });

  it("should expose openProductTour and closeProductTour inside the provider", () => {
    const openProductTour = jest.fn();
    const closeProductTour = jest.fn();
    const onSlideChange = jest.fn();

    render(
      <ProductTourControlsProvider
        value={{
          openProductTour,
          closeProductTour,
          onSlideChange,
          isDrawerOpen: false,
        }}
      >
        <ContextProbe />
      </ProductTourControlsProvider>,
    );

    expect(screen.getByText("inside")).toBeVisible();
  });
});
