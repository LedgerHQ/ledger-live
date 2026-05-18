import React from "react";
import { render, screen } from "@tests/test-renderer";
import { FinalErrorView } from "./FinalErrorView";

function renderView(error: Error) {
  const onCancel = jest.fn();
  const onContactSupport = jest.fn();

  return {
    ...render(
      <FinalErrorView error={error} onCancel={onCancel} onContactSupport={onContactSupport} />,
    ),
    onCancel,
    onContactSupport,
  };
}

describe("FinalErrorView", () => {
  it("should render the translated error message and action buttons", () => {
    renderView(new Error("Something went wrong"));

    expect(screen.getByText("Something went wrong")).toBeVisible();
    expect(screen.getByText("Contact Ledger support")).toBeVisible();
    expect(screen.getByText("Close")).toBeVisible();
  });

  it("should call onContactSupport and onCancel when action buttons are pressed", async () => {
    const { user, onContactSupport, onCancel } = renderView(new Error("Boom!"));

    await user.press(screen.getByText("Contact Ledger support"));
    await user.press(screen.getByText("Close"));

    expect(onContactSupport).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
