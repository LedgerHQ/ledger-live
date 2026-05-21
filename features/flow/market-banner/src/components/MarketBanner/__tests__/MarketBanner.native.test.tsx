import React from "react";
import { render, screen } from "@testing-library/react-native";
import { MarketBanner } from "../MarketBanner.native";

describe("MarketBanner (Native)", () => {
  it("should render the banner title", () => {
    render(<MarketBanner />);
    expect(screen.getByText("Market Banner")).toBeTruthy();
  });

  it("should render the banner description", () => {
    render(<MarketBanner />);
    expect(screen.getByText("Discover the market")).toBeTruthy();
  });
});
