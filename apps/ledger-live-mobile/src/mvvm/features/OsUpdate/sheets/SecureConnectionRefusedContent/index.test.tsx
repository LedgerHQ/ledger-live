import React from "react";
import { render, screen } from "@tests/test-renderer";
import { SecureConnectionRefusedContent } from ".";

describe("SecureConnectionRefusedContent", () => {
  it("shows the error", () => {
    render(<SecureConnectionRefusedContent onRetry={jest.fn()} onCancel={jest.fn()} />);

    expect(screen.getByTestId("os-update-secure-connection-refused")).toBeVisible();
    expect(screen.getByText("Secure connection refused")).toBeVisible();
  });

  it("retries and cancels independently", async () => {
    const onRetry = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <SecureConnectionRefusedContent onRetry={onRetry} onCancel={onCancel} />,
    );

    await user.press(screen.getByText("Retry"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    await user.press(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
