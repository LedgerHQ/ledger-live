import React from "react";
import { render, screen } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { BorrowEntryPoint } from "../index";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

describe("BorrowEntryPoint", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should render the borrow entry point card", () => {
    render(<BorrowEntryPoint />);
    expect(screen.getByTestId("portfolio-borrow-entry-point")).toBeVisible();
  });

  it("should navigate to /borrow with returnTo state when clicked", async () => {
    const { user } = render(<BorrowEntryPoint />);

    await user.click(screen.getByText("Explore"));

    expect(mockNavigate).toHaveBeenCalledWith("/borrow", {
      state: { returnTo: "/" },
    });
  });

  it("should track button_clicked event when clicked", async () => {
    const { user } = render(<BorrowEntryPoint />);

    await user.click(screen.getByText("Explore"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: "Portfolio",
    });
  });
});
