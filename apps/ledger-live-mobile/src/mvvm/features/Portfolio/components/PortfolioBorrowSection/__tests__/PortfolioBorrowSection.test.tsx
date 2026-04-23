import React from "react";
import { render, screen, fireEvent } from "@tests/test-renderer";
import { PortfolioBorrowSection } from "../index";

describe("PortfolioBorrowSection", () => {
  const onPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the borrow entry point card", () => {
    render(<PortfolioBorrowSection onPress={onPress} />);
    expect(screen.getByTestId("portfolio-borrow-entry-point")).toBeVisible();
  });

  it("should render the explore CTA button", () => {
    render(<PortfolioBorrowSection onPress={onPress} />);
    expect(screen.getByTestId("borrow-explore-cta")).toBeVisible();
  });

  it("should call onPress when CTA is pressed", () => {
    render(<PortfolioBorrowSection onPress={onPress} />);
    fireEvent.press(screen.getByTestId("borrow-explore-cta"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should call onPress when card is pressed", () => {
    render(<PortfolioBorrowSection onPress={onPress} />);
    fireEvent.press(screen.getByTestId("portfolio-borrow-entry-point"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
