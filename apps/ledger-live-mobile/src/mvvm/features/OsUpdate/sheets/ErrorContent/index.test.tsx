import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ErrorContent } from ".";

describe("ErrorContent", () => {
  it("renders the title and description from the i18n prefix", () => {
    render(
      <ErrorContent i18nKeyPrefix="osUpdates.outOfMemory" testID="error" onCancel={jest.fn()} />,
    );

    expect(screen.getByTestId("error")).toBeVisible();
    expect(screen.getByText("Not enough space on your device")).toBeVisible();
  });

  it("only offers cancel without a retry handler", async () => {
    const onCancel = jest.fn();
    const { user } = render(
      <ErrorContent i18nKeyPrefix="osUpdates.outOfMemory" testID="error" onCancel={onCancel} />,
    );

    expect(screen.queryByText("Retry")).toBeNull();
    await user.press(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("offers retry first and cancel second with a retry handler", async () => {
    const onCancel = jest.fn();
    const onRetry = jest.fn();
    const { user } = render(
      <ErrorContent
        i18nKeyPrefix="osUpdates.secureConnectionRefused"
        testID="error"
        onCancel={onCancel}
        onRetry={onRetry}
      />,
    );

    await user.press(screen.getByText("Retry"));
    await user.press(screen.getByText("Cancel"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
