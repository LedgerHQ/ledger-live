import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import type { PredictionsOrderOutcome } from "@features/platform-predictions";
import { I18nWrapper, ORDER_COPY } from "../../__tests__/i18nWrapper";
import { OrderContent } from "./OrderContent";

const renderContent = (outcome: PredictionsOrderOutcome | null) => {
  const onClose = jest.fn();
  const onRetry = jest.fn();
  render(<OrderContent outcome={outcome} onClose={onClose} onRetry={onRetry} />, {
    wrapper: I18nWrapper,
  });
  return { onClose, onRetry };
};

describe("OrderContent (native)", () => {
  it("shows the order being placed", () => {
    renderContent(null);

    expect(screen.getByText(ORDER_COPY.placing)).toBeOnTheScreen();
  });

  it("shows the shares and price the order filled at, and returns to predictions", async () => {
    const { onClose } = renderContent({ outcome: "filled", shares: 3.7, price: 0.54 });

    expect(screen.getByText("3.7 shares at $0.54")).toBeOnTheScreen();
    await userEvent.press(screen.getByText(ORDER_COPY.filled.return));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("says the order filled when its fill isn't known", () => {
    renderContent({ outcome: "filled" });

    expect(screen.getByText(ORDER_COPY.filled.description)).toBeOnTheScreen();
  });

  it.each([
    [{ outcome: "not-filled" }, ORDER_COPY.notFilled.description],
    [
      { outcome: "rejected", reason: "expired-signature" },
      ORDER_COPY.rejected["expired-signature"],
    ],
    [
      { outcome: "rejected", reason: "invalid-tick-size" },
      ORDER_COPY.rejected["invalid-tick-size"],
    ],
    [{ outcome: "rejected", reason: "workflow-failed" }, ORDER_COPY.rejected["workflow-failed"]],
  ] as const)("offers to try again or close (%p)", async (outcome, description) => {
    const { onClose, onRetry } = renderContent(outcome);

    expect(screen.getByText(description)).toBeOnTheScreen();
    await userEvent.press(screen.getByText(ORDER_COPY.tryAgain));
    await userEvent.press(screen.getByText("Close"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      { outcome: "rejected", reason: "insufficient-balance" },
      ORDER_COPY.rejected["insufficient-balance"],
    ],
    [{ outcome: "rejected", reason: "market-closed" }, ORDER_COPY.rejected["market-closed"]],
    [{ outcome: "unconfirmed" }, ORDER_COPY.unconfirmed.description],
  ] as const)("only offers to close (%p)", async (outcome, description) => {
    const { onClose } = renderContent(outcome);

    expect(screen.getByText(description)).toBeOnTheScreen();
    expect(screen.queryByText(ORDER_COPY.tryAgain)).not.toBeOnTheScreen();
    await userEvent.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
