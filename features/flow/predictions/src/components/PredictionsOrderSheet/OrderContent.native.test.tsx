import React from "react";
import { render, screen, userEvent, within } from "@testing-library/react-native";
import type { PredictionsOrderOutcome } from "@features/platform-predictions";
import { I18nWrapper, ORDER_COPY } from "../../__tests__/i18nWrapper";
import { ORDER_DETAILS } from "../../__tests__/orderDetails";
import type { PredictionsOrderDetails } from "../../predictionsOrderStore.internals";
import { OrderContent } from "./OrderContent";

const FILLED = { outcome: "filled", shares: 16.129, price: 0.31 } as const;

const renderContent = (
  outcome: PredictionsOrderOutcome | null,
  order: PredictionsOrderDetails = ORDER_DETAILS,
) => {
  const onClose = jest.fn();
  const onRetry = jest.fn();
  render(<OrderContent order={order} outcome={outcome} onClose={onClose} onRetry={onRetry} />, {
    wrapper: I18nWrapper,
  });
  return { onClose, onRetry };
};

describe("OrderContent (native)", () => {
  it("shows the order being placed, without its market yet", () => {
    renderContent(null);

    expect(screen.getByText(ORDER_COPY.placing)).toBeOnTheScreen();
    expect(screen.queryByTestId("predictions-order-summary")).toBeNull();
  });

  it("shows a filled order's fill and its market, and closes", async () => {
    const { onClose } = renderContent(FILLED, {
      ...ORDER_DETAILS,
      display: {
        ...ORDER_DETAILS.display,
        eventTitle: "Will Anthropic's valuation hit __ by December 31?",
      },
    });

    expect(screen.getByText("You bought 16.13 shares for $5.00")).toBeOnTheScreen();
    expect(screen.getByText("Will Anthropic's valuation hit __ by December 31?")).toBeOnTheScreen();
    expect(screen.getByText(ORDER_DETAILS.display.marketTitle)).toBeOnTheScreen();
    expect(screen.getByText(ORDER_DETAILS.display.outcomeLabel)).toBeOnTheScreen();
    await userEvent.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("scrolls the outcome and its market when they don't fit, keeping the actions outside", () => {
    renderContent(FILLED);

    const scroll = screen.getByTestId("predictions-order-result-scroll");
    expect(within(scroll).getByText(ORDER_DETAILS.display.marketTitle)).toBeOnTheScreen();
    expect(within(scroll).queryByText("Close")).toBeNull();
    expect(screen.getByText("Close")).toBeOnTheScreen();
  });

  it("shows no market when the order didn't fill", () => {
    renderContent({ outcome: "not-filled" });

    expect(screen.queryByTestId("predictions-order-summary")).toBeNull();
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
