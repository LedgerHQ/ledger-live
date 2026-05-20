import React from "react";
import { render, screen } from "@tests/test-renderer";
import { IntentError } from "./IntentError";

describe("IntentError", () => {
  it("renders title, description and the primary Retry / secondary Close CTAs", () => {
    render(<IntentError error={new Error("job failed")} onRetry={jest.fn()} onClose={jest.fn()} />);

    expect(screen.getByTestId("device-intent-executor-intent-error")).toBeVisible();
    expect(screen.getByText("job failed")).toBeVisible();
    expect(
      screen.getByText(
        "Something went wrong. Please retry. If the problem persists, please save your logs using the button below and provide them to Ledger Support.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
    expect(screen.getByText("Close")).toBeVisible();
  });

  it("falls back to the generic i18n title/description when the error is not translatable", () => {
    render(
      <IntentError
        error={"not-an-error" as unknown as Error}
        onRetry={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId("device-intent-executor-intent-error")).toBeVisible();
    expect(screen.getByText("Unknown error")).toBeVisible();
    expect(
      screen.getByText(
        "An error occurred. Please try again or contact Ledger support if the issue persists.",
      ),
    ).toBeVisible();
  });

  it("invokes onRetry when the primary CTA is pressed", async () => {
    const onRetry = jest.fn();
    const onClose = jest.fn();

    const { user } = render(
      <IntentError error={new Error("job failed")} onRetry={onRetry} onClose={onClose} />,
    );

    await user.press(screen.getByText("Retry"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("invokes onClose when the secondary CTA is pressed", async () => {
    const onRetry = jest.fn();
    const onClose = jest.fn();

    const { user } = render(
      <IntentError error={new Error("job failed")} onRetry={onRetry} onClose={onClose} />,
    );

    await user.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
