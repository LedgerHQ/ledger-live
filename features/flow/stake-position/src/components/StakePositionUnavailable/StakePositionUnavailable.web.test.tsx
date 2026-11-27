import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper, STAKE_POSITION_COPY } from "../../__tests__/i18nWrapper";
import { StakePositionUnavailable } from "./StakePositionUnavailable";
import type { StakePositionUnavailableProps } from "./StakePositionUnavailable.types";

const { unavailable } = STAKE_POSITION_COPY;

function renderUnavailable(
  reason: StakePositionUnavailableProps["reason"],
  { withRetry = true }: { withRetry?: boolean } = {},
) {
  const onDismiss = jest.fn();
  const onRetry = jest.fn();
  render(
    <StakePositionUnavailable
      reason={reason}
      onDismiss={onDismiss}
      onRetry={withRetry ? onRetry : undefined}
    />,
    { wrapper: I18nWrapper },
  );
  return { onDismiss, onRetry, user: userEvent.setup() };
}

describe("StakePositionUnavailable (web)", () => {
  it("should say the position is loading, without a way out of the step", () => {
    renderUnavailable("loading");

    expect(screen.getByText(unavailable.loading)).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should say the position is not available and close from there, without a retry", async () => {
    const { onDismiss, user } = renderUnavailable("notFound");

    expect(screen.getByRole("heading", { name: unavailable.notFoundTitle })).toBeVisible();
    expect(screen.getByText(unavailable.notFoundDescription)).toBeVisible();
    expect(screen.queryByRole("button", { name: unavailable.retry })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: unavailable.close }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should say the position could not load and read it again on Try again", async () => {
    const { onRetry, onDismiss, user } = renderUnavailable("error");

    expect(screen.getByRole("heading", { name: unavailable.errorTitle })).toBeVisible();
    expect(screen.getByText(unavailable.errorDescription)).toBeVisible();

    await user.click(screen.getByRole("button", { name: unavailable.retry }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("should close from the error", async () => {
    const { onDismiss, user } = renderUnavailable("error");

    await user.click(screen.getByRole("button", { name: unavailable.close }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should offer only to close an error it cannot retry", () => {
    renderUnavailable("error", { withRetry: false });

    expect(screen.queryByRole("button", { name: unavailable.retry })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: unavailable.close })).toBeEnabled();
  });
});
