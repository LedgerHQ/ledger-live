import React from "react";
import { render } from "tests/testSetup";

import PortfolioCategoryContentCards from "..";

describe("PortfolioCategoryContentCards", () => {
  it("should not render a layout wrapper when no content cards are available", () => {
    const { container } = render(<PortfolioCategoryContentCards />);

    expect(container).toBeEmptyDOMElement();
  });
});
