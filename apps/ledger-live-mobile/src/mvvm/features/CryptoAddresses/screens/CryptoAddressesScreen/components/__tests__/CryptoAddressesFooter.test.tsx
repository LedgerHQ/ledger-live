import React from "react";
import { render, screen } from "@tests/test-renderer";
import CryptoAddressesFooter from "../CryptoAddressesFooter";

describe("CryptoAddressesFooter", () => {
  it("should render the button and call onPress when pressed", async () => {
    const onPress = jest.fn();
    const { user } = render(<CryptoAddressesFooter label="Add account" onPress={onPress} />);

    const button = screen.getByTestId("crypto-addresses-add-button");
    expect(button).toBeVisible();
    expect(screen.getByText("Add account")).toBeVisible();

    await user.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
