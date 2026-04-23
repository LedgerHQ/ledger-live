import React from "react";
import { render } from "@tests/test-renderer";
import { ProductTourDrawer } from "./index";

describe("ProductTourDrawer", () => {
  it("should render without throwing when drawer is closed", () => {
    const { toJSON } = render(<ProductTourDrawer isDrawerOpen={false} />);
    expect(toJSON()).toBeNull();
  });

  it("should render without throwing when drawer is open", () => {
    const { toJSON } = render(<ProductTourDrawer isDrawerOpen />);
    expect(toJSON()).toBeNull();
  });
});
