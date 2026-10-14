import React from "react";
import { render, screen } from "@tests/test-renderer";
import { SponsoredFailureScreen } from "../SponsoredFailureScreen";
import {
  useSponsoredFailureViewModel,
  type SponsoredFailureViewModel,
} from "../hooks/useSponsoredFailureViewModel";

jest.mock("../hooks/useSponsoredFailureViewModel", () => ({
  useSponsoredFailureViewModel: jest.fn(),
}));

const buildViewModel = (
  overrides: Partial<SponsoredFailureViewModel> = {},
): SponsoredFailureViewModel => ({
  message: "Energy was not delivered.",
  retryBlockedMessage: null,
  retryLabel: "Pay again and retry",
  retryDisabled: false,
  cancelLabel: "Cancel",
  onRetry: jest.fn(),
  onCancel: jest.fn(),
  ...overrides,
});

describe("SponsoredFailureScreen", () => {
  it("explains the failure and offers Retry and Cancel", async () => {
    const viewModel = buildViewModel();
    jest.mocked(useSponsoredFailureViewModel).mockReturnValue(viewModel);

    const { user } = render(<SponsoredFailureScreen />);

    expect(screen.getByText("Energy was not delivered.")).toBeOnTheScreen();
    await user.press(screen.getByTestId("send-sponsored-failure-retry"));
    await user.press(screen.getByTestId("send-sponsored-failure-cancel"));
    expect(viewModel.onRetry).toHaveBeenCalled();
    expect(viewModel.onCancel).toHaveBeenCalled();
  });

  it("disables Retry and says why when the fee token can't pay again", async () => {
    const viewModel = buildViewModel({
      retryDisabled: true,
      retryBlockedMessage: "You don't have enough USDT.",
    });
    jest.mocked(useSponsoredFailureViewModel).mockReturnValue(viewModel);

    const { user } = render(<SponsoredFailureScreen />);

    expect(screen.getByText("You don't have enough USDT.")).toBeOnTheScreen();
    await user.press(screen.getByTestId("send-sponsored-failure-retry"));
    expect(viewModel.onRetry).not.toHaveBeenCalled();
  });
});
