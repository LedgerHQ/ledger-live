import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PredictionsOrderReport } from "@features/platform-predictions";
import { I18nWrapper, ORDER_COPY } from "../../__tests__/i18nWrapper";
import { ORDER_DETAILS, ORDER_IMAGE_URL } from "../../__tests__/orderDetails";
import type { PredictionsOrderDetails } from "../../predictionsOrderStore.internals";
import { OrderContent } from "./OrderContent";

const FILLED = { status: "filled", shares: 16.129, price: 0.31 } as const;

const renderContent = (
  report: PredictionsOrderReport | null,
  order: PredictionsOrderDetails = ORDER_DETAILS,
) => {
  const onClose = jest.fn();
  const onRetry = jest.fn();
  render(<OrderContent order={order} report={report} onClose={onClose} onRetry={onRetry} />, {
    wrapper: I18nWrapper,
  });
  return { onClose, onRetry };
};

describe("OrderContent (web)", () => {
  it("shows the order being placed, without its market yet", () => {
    renderContent(null);

    expect(screen.getByText(ORDER_COPY.placing)).toBeVisible();
    expect(screen.queryByTestId("predictions-order-summary")).not.toBeInTheDocument();
  });

  it("shows a filled order's fill, then its market, and closes", async () => {
    const { onClose } = renderContent(FILLED, {
      ...ORDER_DETAILS,
      display: {
        ...ORDER_DETAILS.display,
        eventTitle: "Will Anthropic's valuation hit __ by December 31?",
        outcomeSide: "yes",
      },
    });

    expect(screen.getByText(ORDER_COPY.filled.title)).toBeVisible();
    const fill = screen.getByText("You bought 16.13 shares for $5.00");
    expect(fill.compareDocumentPosition(screen.getByTestId("predictions-order-summary"))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByText("Will Anthropic's valuation hit __ by December 31?")).toBeVisible();
    expect(screen.getByText(ORDER_DETAILS.display.marketTitle)).toBeVisible();
    expect(screen.getByTestId("predictions-order-outcome")).toHaveAttribute(
      "appearance",
      "success",
    );
    expect(screen.getByTestId("predictions-order-market-image")).toHaveAttribute(
      "src",
      ORDER_IMAGE_URL,
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("loads no image for a market without one", () => {
    renderContent(FILLED, {
      ...ORDER_DETAILS,
      display: { marketTitle: "Fed decision", outcomeLabel: "No" },
    });

    expect(screen.getByTestId("predictions-order-market-image")).not.toHaveAttribute("src");
  });

  it.each([
    [{ status: "not-filled" }, ORDER_COPY.notFilled.title, ORDER_COPY.notFilled.description],
    [
      { status: "rejected", reason: "expired-signature" },
      ORDER_COPY.rejected.title,
      ORDER_COPY.rejected["expired-signature"],
    ],
    [
      { status: "rejected", reason: "invalid-tick-size" },
      ORDER_COPY.rejected.title,
      ORDER_COPY.rejected["invalid-tick-size"],
    ],
  ] as const)("offers to try again or close (%p)", async (report, title, description) => {
    const { onClose, onRetry } = renderContent(report);

    expect(screen.getByText(title)).toBeVisible();
    expect(screen.getByText(description)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: ORDER_COPY.tryAgain }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));

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

    expect(screen.getByText(description)).toBeVisible();
    expect(screen.queryByRole("button", { name: ORDER_COPY.tryAgain })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
