import React from "react";
import { render, screen, fireEvent } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { PortfolioBorrowSection } from "../index";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("PortfolioBorrowSection", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should render the borrow entry point card", () => {
    render(<PortfolioBorrowSection />);
    expect(screen.getByTestId("portfolio-borrow-entry-point")).toBeVisible();
  });

  it("should render the explore CTA button", () => {
    render(<PortfolioBorrowSection />);
    expect(screen.getByTestId("borrow-explore-cta")).toBeVisible();
  });

  it("should navigate to Borrow screen when CTA is pressed", () => {
    render(<PortfolioBorrowSection />);
    fireEvent.press(screen.getByTestId("borrow-explore-cta"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Borrow, {
      screen: ScreenName.Borrow,
      params: {},
    });
  });

  it("should track button_clicked event when CTA is pressed", () => {
    render(<PortfolioBorrowSection />);
    fireEvent.press(screen.getByTestId("borrow-explore-cta"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: ScreenName.Portfolio,
    });
  });
});
