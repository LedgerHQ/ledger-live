import React from "react";
import { render, screen } from "tests/testSetup";
import Cryptos from "../index";
import useCryptosViewModel from "../useCryptosViewModel";

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

    expect(screen.getByText("Accounts")).toBeVisible();
    expect(screen.getByTestId("cryptos-page-content")).toBeVisible();
  });

  it("should call navigateToDashboard when back button is clicked", async () => {
    const { user } = render(<Cryptos />);

    const backButton = screen.getByRole("button");
    await user.click(backButton);

    expect(mockNavigateToDashboard).toHaveBeenCalledTimes(1);
  });
});
