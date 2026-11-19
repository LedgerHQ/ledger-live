import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nWrapper, STAKE_POSITION_COPY } from "../../__tests__/i18nWrapper";
import { StakePositionResult } from "./StakePositionResult";
import type { StakePositionResultProps } from "./StakePositionResult.types";

jest.mock("@ledgerhq/lumen-ui-rnative", () =>
  jest
    .requireActual<typeof import("../../__tests__/lumenNativeMock")>(
      "../../__tests__/lumenNativeMock",
    )
    .lumenNativeWithAccessibleButtons(),
);

function renderResult(props: StakePositionResultProps) {
  render(<StakePositionResult {...props} />, { wrapper: I18nWrapper });
}

describe("StakePositionResult (native)", () => {
  it.each([
    ["withdraw", "You'll receive your SOL soon."],
    [
      "deactivate",
      "Deactivation can take a few days. You can withdraw your SOL once it is complete.",
    ],
  ] as const)("should say the %s transaction is signed and open it", (action, body) => {
    const onViewTransaction = jest.fn();
    renderResult({ outcome: "success", action, ticker: "SOL", onViewTransaction });

    expect(screen.getByText("Transaction signed")).toBeTruthy();
    expect(screen.getByText(body)).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "View transaction" }));
    expect(onViewTransaction).toHaveBeenCalledTimes(1);
  });

  it("should say the transaction failed and offer to try again", () => {
    const onRetry = jest.fn();
    renderResult({ outcome: "failure", isSigned: false, onRetry });

    expect(screen.getByText("Transaction failed")).toBeTruthy();
    expect(screen.queryByText(STAKE_POSITION_COPY.result.broadcastError)).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should warn that a signed transaction may still reach the network", () => {
    renderResult({ outcome: "failure", isSigned: true, onRetry: jest.fn() });

    expect(screen.getByText(STAKE_POSITION_COPY.result.broadcastError)).toBeTruthy();
  });
});
