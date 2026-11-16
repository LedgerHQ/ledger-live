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

function renderUnavailable(reason: StakePositionUnavailableProps["reason"]) {
  const onDismiss = jest.fn();
  render(<StakePositionUnavailable reason={reason} onDismiss={onDismiss} />, {
    wrapper: I18nWrapper,
  });
  return { onDismiss };
}

describe("StakePositionUnavailable (native)", () => {
  it("should say the position is loading, without a way out of the step", () => {
    renderUnavailable("loading");

    expect(screen.getByText(STAKE_POSITION_COPY.unavailable.loading)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("should say the position is gone and close from there", () => {
    const { onDismiss } = renderUnavailable("notFound");

    expect(
      screen.getByRole("header", { name: STAKE_POSITION_COPY.unavailable.notFoundTitle }),
    ).toBeTruthy();
    expect(screen.getByText(STAKE_POSITION_COPY.unavailable.notFoundDescription)).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: STAKE_POSITION_COPY.unavailable.close }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
