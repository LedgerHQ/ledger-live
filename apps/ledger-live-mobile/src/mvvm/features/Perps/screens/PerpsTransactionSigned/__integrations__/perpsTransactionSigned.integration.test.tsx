import React from "react";
import { render, screen } from "@tests/test-renderer";
import PerpsTransactionSignedScreen from "../PerpsTransactionSignedScreen";
import type { PerpsTransactionSignedParams } from "../../../types";

const mockNavigation = { goBack: jest.fn() };

const SIGNED_PARAMS: PerpsTransactionSignedParams = {
  receiveCurrencyTicker: "USDC",
  swapId: "swap-1",
  provider: "swapkit",
};

function renderScreen(params: PerpsTransactionSignedParams = SIGNED_PARAMS) {
  return render(
    <PerpsTransactionSignedScreen
      navigation={mockNavigation as never}
      route={{ params } as never}
    />,
  );
}

describe("PerpsTransactionSigned integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should tell the holder the deposit is on its way", async () => {
    renderScreen();

    expect(await screen.findByTestId("perps-transaction-signed")).toBeOnTheScreen();
    expect(screen.getByText("Transaction signed")).toBeOnTheScreen();
    expect(
      screen.getByText("You'll receive your USDC once confirmed on the blockchain"),
    ).toBeOnTheScreen();
  });

  it("should offer to track the swap it was given", async () => {
    const { user } = renderScreen();

    await user.press(await screen.findByTestId("perps-transaction-signed-cta"));

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it("should offer nothing to track without a swap id", async () => {
    renderScreen({ receiveCurrencyTicker: "USDC" });

    expect(await screen.findByTestId("perps-transaction-signed")).toBeOnTheScreen();
    expect(screen.queryByTestId("perps-transaction-signed-cta")).not.toBeOnTheScreen();
  });
});
