import React from "react";
import { render, screen, userEvent, within } from "@testing-library/react-native";
import type { PredictionsOrderReport } from "@features/platform-predictions";
import { I18nWrapper, ORDER_COPY } from "../../__tests__/i18nWrapper";
import { PredictionsOrderResultContent } from "./PredictionsOrderResultContent";

const renderContent = (report: PredictionsOrderReport) => {
  const onClose = jest.fn();
  const onRetry = jest.fn();
  render(<PredictionsOrderResultContent report={report} onClose={onClose} onRetry={onRetry} />, {
    wrapper: I18nWrapper,
  });
  return { onClose, onRetry };
};

describe("PredictionsOrderResultContent", () => {
  it("shows the shares and price the order filled at, and returns to predictions", async () => {
    const { onClose } = renderContent({ status: "filled", shares: 3.7, price: 0.54 });

    expect(screen.getByText("3.7 shares at $0.54")).toBeOnTheScreen();
    await userEvent.press(screen.getByText(ORDER_COPY.filled.return));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("says the order filled when its fill isn't known", () => {
    renderContent({ status: "filled" });

    expect(screen.getByText(ORDER_COPY.filled.description)).toBeOnTheScreen();
  });

  it("scrolls the result when it doesn't fit, keeping the actions outside", () => {
    renderContent({ status: "not-filled" });

    const scroll = screen.getByTestId("predictions-order-result-scroll");
    expect(within(scroll).getByText(ORDER_COPY.notFilled.description)).toBeOnTheScreen();
    expect(within(scroll).queryByText("Close")).toBeNull();
    expect(screen.getByText("Close")).toBeOnTheScreen();
  });

  it.each([
    [{ status: "not-filled" }, ORDER_COPY.notFilled.description],
    [{ status: "rejected", reason: "expired-signature" }, ORDER_COPY.rejected["expired-signature"]],
    [{ status: "rejected", reason: "invalid-tick-size" }, ORDER_COPY.rejected["invalid-tick-size"]],
  ] as const)("offers to try again or close (%p)", async (report, description) => {
    const { onClose, onRetry } = renderContent(report);

    expect(screen.getByText(description)).toBeOnTheScreen();
    await userEvent.press(screen.getByText(ORDER_COPY.tryAgain));
    await userEvent.press(screen.getByText("Close"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      { status: "rejected", reason: "insufficient-balance" },
      ORDER_COPY.rejected["insufficient-balance"],
    ],
    [{ status: "rejected", reason: "market-closed" }, ORDER_COPY.rejected["market-closed"]],
    [{ status: "rejected", reason: "not-accepted" }, ORDER_COPY.rejected["not-accepted"]],
    [{ status: "unconfirmed" }, ORDER_COPY.unconfirmed.description],
  ] as const)("only offers to close (%p)", async (report, description) => {
    const { onClose } = renderContent(report);

    expect(screen.getByText(description)).toBeOnTheScreen();
    expect(screen.queryByText(ORDER_COPY.tryAgain)).not.toBeOnTheScreen();
    await userEvent.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
