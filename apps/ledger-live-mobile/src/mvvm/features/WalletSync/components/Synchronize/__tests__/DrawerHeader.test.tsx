import React from "react";
import { StyleSheet } from "react-native";
import { render, screen } from "@tests/test-renderer";
import DrawerHeader from "../DrawerHeader";

describe("DrawerHeader", () => {
  it("closes when the close button is pressed", async () => {
    const onClose = jest.fn();
    const { user } = render(<DrawerHeader onClose={onClose} />);

    await user.press(screen.getByTestId("drawer-header-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the close button out of the title flow so the space under the title does not depend on its line count", () => {
    render(<DrawerHeader onClose={jest.fn()} />);

    expect(screen.getByText("Sync Ledger Wallet apps")).toBeVisible();
    expect(
      StyleSheet.flatten(screen.getByTestId("drawer-header-close-container").props.style),
    ).toMatchObject({ position: "absolute", right: 16 });
    expect(StyleSheet.flatten(screen.getByTestId("drawer-header").props.style)).toMatchObject({
      paddingBottom: 24,
    });
  });
});
