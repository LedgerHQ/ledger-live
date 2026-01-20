import React from "react";
import { render } from "@testing-library/react";
import { MarketBanner } from "../MarketBanner.web";

describe("MarketBanner (Web)", () => {
  it("should render the banner title", () => {
    const { getByText } = render(<MarketBanner />);
    expect(getByText("Market Banner")).toBeInTheDocument();
  });

  it("should render the banner description", () => {
    const { getByText } = render(<MarketBanner />);
    expect(getByText("Discover the market")).toBeInTheDocument();
  });
});
