import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoState } from "@shared/ui-info-state";
import { I18nWrapper, STAKE_POSITION_COPY } from "../../__tests__/i18nWrapper";
import { StakePositionResult } from "./StakePositionResult";
import type { StakePositionResultProps } from "./StakePositionResult.types";

jest.mock("@shared/ui-info-state", () => {
  const infoState =
    jest.requireActual<typeof import("@shared/ui-info-state")>("@shared/ui-info-state");
  return { ...infoState, InfoState: jest.fn(infoState.InfoState) };
});

function renderResult(props: StakePositionResultProps) {
  render(<StakePositionResult {...props} testID="stake-position-result" />, {
    wrapper: I18nWrapper,
  });
  return userEvent.setup();
}

describe("StakePositionResult (web)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("after a broadcast", () => {
    it.each([
      ["withdraw", "You'll receive your SOL soon."],
      [
        "deactivate",
        "Deactivation can take a few days. You can withdraw your SOL once it is complete.",
      ],
    ] as const)("should say the %s transaction is signed, with what comes next", (action, body) => {
      renderResult({ outcome: "success", action, ticker: "SOL", onViewTransaction: jest.fn() });

      expect(screen.getByRole("heading", { name: "Transaction signed" })).toBeVisible();
      expect(screen.getByText(body)).toBeVisible();
      expect(jest.mocked(InfoState).mock.lastCall?.[0]).toMatchObject({ preset: "success" });
    });

    it("should open the transaction", async () => {
      const onViewTransaction = jest.fn();
      const user = renderResult({
        outcome: "success",
        action: "withdraw",
        ticker: "SOL",
        onViewTransaction,
      });

      await user.click(screen.getByRole("button", { name: "View transaction" }));

      expect(onViewTransaction).toHaveBeenCalledTimes(1);
    });

    it("should offer no button without a transaction to open", () => {
      renderResult({ outcome: "success", action: "withdraw", ticker: "SOL" });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("after a failure", () => {
    it("should say the transaction failed, why, and offer to try again", async () => {
      const onRetry = jest.fn();
      const user = renderResult({
        outcome: "failure",
        errorDescription: "You rejected the transaction on your device.",
        isSigned: false,
        onRetry,
      });

      expect(screen.getByRole("heading", { name: "Transaction failed" })).toBeVisible();
      expect(screen.getByText("You rejected the transaction on your device.")).toBeVisible();
      expect(screen.queryByText(STAKE_POSITION_COPY.result.broadcastError)).not.toBeInTheDocument();
      expect(jest.mocked(InfoState).mock.lastCall?.[0]).toMatchObject({ preset: "error" });

      await user.click(screen.getByRole("button", { name: "Try again" }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should warn that a signed transaction may still reach the network", () => {
      renderResult({ outcome: "failure", isSigned: true, onRetry: jest.fn() });

      expect(screen.getByText(STAKE_POSITION_COPY.result.broadcastError)).toBeVisible();
      expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
    });
  });
});
