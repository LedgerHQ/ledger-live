import React from "react";
import { render, screen } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { LoansEntryPoint } from "../index";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

describe("LoansEntryPoint", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should render the loans entry point card", () => {
    render(<LoansEntryPoint />);
    expect(screen.getByTestId("portfolio-loans-entry-point")).toBeVisible();
  });

  it("should navigate to /borrow when clicked", async () => {
    const { user } = render(<LoansEntryPoint />);

    await user.click(screen.getByText("Explore"));

    expect(mockNavigate).toHaveBeenCalledWith("/borrow");
  });

  it("should track button_clicked event when clicked", async () => {
    const { user } = render(<LoansEntryPoint />);

    await user.click(screen.getByText("Explore"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: "Portfolio",
    });
  });
});
