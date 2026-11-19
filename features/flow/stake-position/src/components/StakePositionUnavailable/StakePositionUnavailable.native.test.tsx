import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nWrapper, STAKE_POSITION_COPY } from "../../__tests__/i18nWrapper";
import { StakePositionUnavailable } from "./StakePositionUnavailable";
import type { StakePositionUnavailableProps } from "./StakePositionUnavailable.types";

jest.mock("@ledgerhq/lumen-ui-rnative", () =>
  jest
    .requireActual<typeof import("../../__tests__/lumenNativeMock")>(
      "../../__tests__/lumenNativeMock",
    )
    .lumenNativeWithAccessibleButtons(),
);

const { unavailable } = STAKE_POSITION_COPY;

function renderUnavailable(reason: StakePositionUnavailableProps["reason"]) {
  const onDismiss = jest.fn();
  const onRetry = jest.fn();
  render(<StakePositionUnavailable reason={reason} onDismiss={onDismiss} onRetry={onRetry} />, {
    wrapper: I18nWrapper,
  });
  return { onDismiss, onRetry };
}

describe("StakePositionUnavailable (native)", () => {
  it("should say the position is loading, without a way out of the step", () => {
    renderUnavailable("loading");

    expect(screen.getByText(unavailable.loading)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("should say the position is not available and close from there", () => {
    const { onDismiss } = renderUnavailable("notFound");

    expect(screen.getByRole("header", { name: unavailable.notFoundTitle })).toBeTruthy();
    expect(screen.getByText(unavailable.notFoundDescription)).toBeTruthy();
    expect(screen.queryByRole("button", { name: unavailable.retry })).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: unavailable.close }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should say the position could not load and read it again on Try again", () => {
    const { onRetry, onDismiss } = renderUnavailable("error");

    expect(screen.getByRole("header", { name: unavailable.errorTitle })).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: unavailable.retry }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
