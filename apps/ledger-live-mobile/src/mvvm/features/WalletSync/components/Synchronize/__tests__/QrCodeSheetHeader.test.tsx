import React from "react";
import { StyleSheet } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { QrCodeSheetHeader } from "../QrCodeSheetHeader";

describe("QrCodeSheetHeader", () => {
  it("closes when the close button is pressed", async () => {
    const onClose = jest.fn();
    const { user } = render(<QrCodeSheetHeader onClose={onClose} />);

    await user.press(screen.getByTestId("qr-code-sheet-header-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the close button out of the title flow so the space under the title does not depend on its line count", () => {
    render(<QrCodeSheetHeader onClose={jest.fn()} />);

    expect(screen.getByText("Sync Ledger Wallet apps")).toBeVisible();
    expect(
      StyleSheet.flatten(screen.getByTestId("qr-code-sheet-header-close-container").props.style),
    ).toMatchObject({ position: "absolute", right: 16 });
    expect(
      StyleSheet.flatten(screen.getByTestId("qr-code-sheet-header").props.style),
    ).toMatchObject({
      paddingBottom: 24,
    });
  });

  it("lets the title span the width left by the close button, reserved on both sides to stay centered", () => {
    render(<QrCodeSheetHeader onClose={jest.fn()} />);

    // The 40 wide close button plus 8 of space beside it.
    expect(screen.getByTestId("qr-code-sheet-header-title")).toHaveStyle({
      marginHorizontal: 48,
      textAlign: "center",
    });
    expect(screen.getByTestId("qr-code-sheet-header-title")).not.toHaveStyle({ flex: 3 });
  });
});
