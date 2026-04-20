import React from "react";
import { render, screen, fireEvent } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { PortfolioLoansSection } from "../index";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("PortfolioLoansSection", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should render the loans entry point card", () => {
    render(<PortfolioLoansSection />);
    expect(screen.getByTestId("portfolio-loans-entry-point")).toBeVisible();
  });

  it("should render the explore CTA button", () => {
    render(<PortfolioLoansSection />);
    expect(screen.getByTestId("loans-explore-cta")).toBeVisible();
  });

  it("should navigate to Borrow screen when CTA is pressed", () => {
    render(<PortfolioLoansSection />);
    fireEvent.press(screen.getByTestId("loans-explore-cta"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Borrow, {
      screen: ScreenName.Borrow,
      params: {},
    });
  });

  it("should track button_clicked event when CTA is pressed", () => {
    render(<PortfolioLoansSection />);
    fireEvent.press(screen.getByTestId("loans-explore-cta"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: ScreenName.Portfolio,
    });
  });
});
