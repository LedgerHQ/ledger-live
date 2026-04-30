import React from "react";
import { screen, render, waitFor } from "@tests/test-renderer";
import CantonDisclaimer from "../index";

describe("CantonDisclaimer integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("disables Agree until the checkbox is toggled, then calls onAgree", async () => {
    const onAgree = jest.fn();
    const onCancel = jest.fn();

    const { user } = render(<CantonDisclaimer onAgree={onAgree} onCancel={onCancel} />);

    const agreeButton = screen.getByText("Agree");
    expect(agreeButton).toBeDisabled();

    await user.press(screen.getByTestId("canton-disclaimer-agree-row"));

    await waitFor(() => {
      expect(screen.getByText("Agree")).not.toBeDisabled();
    });

    await user.press(screen.getByText("Agree"));
    expect(onAgree).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when Cancel is pressed", async () => {
    const onAgree = jest.fn();
    const onCancel = jest.fn();

    const { user } = render(<CantonDisclaimer onAgree={onAgree} onCancel={onCancel} />);

    await user.press(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onAgree).not.toHaveBeenCalled();
  });

  it("opens the terms drawer when the inline link is pressed", async () => {
    const onAgree = jest.fn();
    const onCancel = jest.fn();

    const { user } = render(<CantonDisclaimer onAgree={onAgree} onCancel={onCancel} />);

    expect(screen.queryByText("Standard Token Liability & Recovery")).not.toBeOnTheScreen();

    await user.press(screen.getByTestId("canton-disclaimer-terms-link"));

    await waitFor(() => {
      expect(screen.getByText("Standard Token Liability & Recovery")).toBeOnTheScreen();
    });
  });
});
