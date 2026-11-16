import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper, STAKE_POSITION_COPY } from "../../__tests__/i18nWrapper";
import { StakePositionUnavailable } from "./StakePositionUnavailable";
import type { StakePositionUnavailableProps } from "./StakePositionUnavailable.types";

function renderUnavailable(reason: StakePositionUnavailableProps["reason"]) {
  const onDismiss = jest.fn();
  render(<StakePositionUnavailable reason={reason} onDismiss={onDismiss} />, {
    wrapper: I18nWrapper,
  });
  return { onDismiss, user: userEvent.setup() };
}

describe("StakePositionUnavailable (web)", () => {
  it("should say the position is loading, without a way out of the step", () => {
    renderUnavailable("loading");

    expect(screen.getByText(STAKE_POSITION_COPY.unavailable.loading)).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should say the position is gone and close from there", async () => {
    const { onDismiss, user } = renderUnavailable("notFound");

    expect(
      screen.getByRole("heading", { name: STAKE_POSITION_COPY.unavailable.notFoundTitle }),
    ).toBeVisible();
    expect(screen.getByText(STAKE_POSITION_COPY.unavailable.notFoundDescription)).toBeVisible();

    await user.click(screen.getByRole("button", { name: STAKE_POSITION_COPY.unavailable.close }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
