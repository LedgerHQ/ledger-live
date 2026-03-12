import React from "react";
import { render, screen } from "tests/testSetup";
import Cryptos from "../index";
import useCryptosViewModel from "../hooks/useCryptosViewModel";

jest.mock("../useCryptosViewModel");
const mockedUseCryptosViewModel = useCryptosViewModel as jest.Mock;

const mockNavigateToDashboard = jest.fn();

const defaultViewModel = {
  navigateToDashboard: mockNavigateToDashboard,
};

describe("Cryptos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCryptosViewModel.mockReturnValue(defaultViewModel);
  });

  it("should render the Cryptos page with header and content", () => {
    render(<Cryptos />);

    expect(screen.getByText("Crypto accounts")).toBeVisible();
    expect(screen.getByTestId("cryptos-page-content")).toBeVisible();
  });

  it("should call navigateToDashboard when back button is clicked", async () => {
    const { user } = render(<Cryptos />);

    const header = screen.getByTestId("page-header");
    const backButton = header.querySelector("button");
    if (!backButton) throw new Error("Back button not found");
    await user.click(backButton);

    expect(mockNavigateToDashboard).toHaveBeenCalledTimes(1);
  });
});
