import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { CardNumbersUnlockDialog } from "../CardNumbersUnlockDialog";

describe("CardNumbersUnlockDialog", () => {
  it("should send the new password when the user clicks Save", async () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <CardNumbersUnlockDialog
        isOpen
        mode="create"
        isSubmitting={false}
        isBusy={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    await user.type(screen.getByLabelText("New password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "secret");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith("secret", "secret");
  });

  it("should send the password when the user clicks Confirm", async () => {
    const onSubmit = jest.fn();
    const { user } = render(
      <CardNumbersUnlockDialog
        isOpen
        mode="verify"
        isSubmitting={false}
        isBusy={false}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Current password"), "secret");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onSubmit).toHaveBeenCalledWith("secret", "");
  });

  it("should send the password when the user presses Enter", async () => {
    const onSubmit = jest.fn();
    const { user } = render(
      <CardNumbersUnlockDialog
        isOpen
        mode="verify"
        isSubmitting={false}
        isBusy={false}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Current password"), "secret{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("secret", "");
  });

  it("should show the error from the parent", () => {
    render(
      <CardNumbersUnlockDialog
        isOpen
        mode="verify"
        error="Incorrect password"
        isSubmitting={false}
        isBusy={false}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText("Incorrect password")).toBeVisible();
  });

  it("should put focus back on the password field after a failed try", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { user } = render(
      <CardNumbersUnlockDialog
        isOpen
        mode="verify"
        error="Incorrect password"
        isSubmitting={false}
        isBusy={false}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Current password"), "secret");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(screen.getByLabelText("Current password")).toHaveFocus());
  });

  it("should close when the user clicks Cancel", async () => {
    const onCancel = jest.fn();
    const { user } = render(
      <CardNumbersUnlockDialog
        isOpen
        mode="verify"
        isSubmitting={false}
        isBusy={false}
        onSubmit={jest.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
  });

  it("should disable Cancel while the password check is in flight", async () => {
    const onCancel = jest.fn();
    const { user } = render(
      <CardNumbersUnlockDialog
        isOpen
        mode="verify"
        isSubmitting={false}
        isBusy
        onSubmit={jest.fn()}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
