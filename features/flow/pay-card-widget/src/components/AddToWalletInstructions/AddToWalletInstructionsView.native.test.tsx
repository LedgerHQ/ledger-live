import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { AddToWalletInstructionsView } from "./AddToWalletInstructionsView.native";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  useBottomSheetBackgroundTone: jest.fn(),
}));

describe("AddToWalletInstructionsView", () => {
  it("shows the wallet error actions", async () => {
    const user = userEvent.setup();
    const onPressAction = jest.fn();
    const onBack = jest.fn();

    render(
      <AddToWalletInstructionsView
        scene="error"
        title="Wallet could not be opened"
        description="Wallet is unavailable"
        actionLabel="Try again"
        backLabel="Back to instructions"
        onPressAction={onPressAction}
        onBack={onBack}
        isPending={false}
      />,
    );

    expect(screen.getByText("Wallet could not be opened")).toBeVisible();
    expect(screen.getByText("Wallet is unavailable")).toBeVisible();

    await user.press(screen.getByLabelText("Try again"));
    await user.press(screen.getByLabelText("Back to instructions"));

    expect(onPressAction).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
