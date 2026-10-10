import React from "react";
import { render, screen } from "@tests/test-renderer";
import { OsUpdateNavBar } from ".";

describe("OsUpdateNavBar", () => {
  it("only offers a close button", () => {
    render(<OsUpdateNavBar onClose={jest.fn()} />);

    expect(screen.getByTestId("os-update-close-button")).toBeVisible();
    expect(screen.queryByText(/OS update/)).toBeNull();
  });

  it("asks to close when the close button is pressed", async () => {
    const onClose = jest.fn();
    const { user } = render(<OsUpdateNavBar onClose={onClose} />);

    await user.press(screen.getByTestId("os-update-close-button"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
