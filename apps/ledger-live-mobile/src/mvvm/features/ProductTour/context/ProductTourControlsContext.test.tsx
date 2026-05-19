import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { ProductTourControlsProvider, useProductTourControls } from "./ProductTourControlsContext";

function ContextProbe() {
  useProductTourControls();
  return <Text>inside</Text>;
}

describe("ProductTourControlsContext", () => {
  it("should throw from useProductTourControls when rendered outside the provider", () => {
    expect(() => render(<ContextProbe />)).toThrow(
      "useProductTourControls must be used within ProductTourControlsProvider",
    );
  });

  it("should expose openProductTour and closeProductTour inside the provider", () => {
    const openProductTour = jest.fn();
    const closeProductTour = jest.fn();
    const onSlideChange = jest.fn();
    const onPrimaryAction = jest.fn();

    render(
      <ProductTourControlsProvider
        value={{
          openProductTour,
          closeProductTour,
          onSlideChange,
          onPrimaryAction,
          isDrawerOpen: false,
        }}
      >
        <ContextProbe />
      </ProductTourControlsProvider>,
    );

    expect(screen.getByText("inside")).toBeVisible();
  });
});
