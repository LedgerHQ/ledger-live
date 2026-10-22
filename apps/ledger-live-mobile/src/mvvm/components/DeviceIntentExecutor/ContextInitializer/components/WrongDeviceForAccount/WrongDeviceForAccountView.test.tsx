import React from "react";
import { render, screen } from "@tests/test-renderer";
import { WrongDeviceForAccountView } from "./WrongDeviceForAccountView";

function renderView() {
  const onCancel = jest.fn();
  const onContactSupport = jest.fn();

  return {
    ...render(
      <WrongDeviceForAccountView onCancel={onCancel} onContactSupport={onContactSupport} />,
    ),
    onCancel,
    onContactSupport,
  };
}

describe("WrongDeviceForAccountView", () => {
  it("should render the wrong device copy and action buttons", () => {
    renderView();

    expect(
      screen.getByText("Use the Ledger device you originally set up this account with"),
    ).toBeVisible();
    expect(
      screen.getByText(
        "This Ledger isn't set up with the Secret Recovery Phrase linked to the selected crypto account.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Close")).toBeVisible();
    expect(screen.getByText("Contact Ledger support")).toBeVisible();
  });

  it("should call onCancel and onContactSupport when action buttons are pressed", async () => {
    const { user, onCancel, onContactSupport } = renderView();

    await user.press(screen.getByText("Close"));
    await user.press(screen.getByText("Contact Ledger support"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onContactSupport).toHaveBeenCalledTimes(1);
  });
});
