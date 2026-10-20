import React from "react";
import { render, screen } from "@tests/test-renderer";
import { OutOfMemoryContent } from ".";

describe("OutOfMemoryContent", () => {
  it("shows the error", () => {
    render(<OutOfMemoryContent onCancel={jest.fn()} />);

    expect(screen.getByTestId("os-update-out-of-memory")).toBeVisible();
    expect(screen.getByText("Not enough space on your device")).toBeVisible();
  });

  it("only offers cancel", async () => {
    const onCancel = jest.fn();
    const { user } = render(<OutOfMemoryContent onCancel={onCancel} />);

    expect(screen.queryByText("Retry")).toBeNull();
    await user.press(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
