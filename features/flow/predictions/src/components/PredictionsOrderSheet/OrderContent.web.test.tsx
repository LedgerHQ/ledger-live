import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PredictionsOrderReport } from "@features/platform-predictions";
import { I18nWrapper, ORDER_COPY } from "../../__tests__/i18nWrapper";
import { OrderContent } from "./OrderContent";

const renderContent = (report: PredictionsOrderReport | null) => {
  const onClose = jest.fn();
  const onRetry = jest.fn();
  render(<OrderContent report={report} onClose={onClose} onRetry={onRetry} />, {
    wrapper: I18nWrapper,
  });
  return { onClose, onRetry };
};

describe("OrderContent (web)", () => {
  it("shows the order being placed", () => {
    renderContent(null);

    expect(screen.getByText(ORDER_COPY.placing)).toBeVisible();
  });

  it("shows the shares and price the order filled at, and returns to predictions", async () => {
    const { onClose } = renderContent({ status: "filled", shares: 3.7, price: 0.54 });

    expect(screen.getByText(ORDER_COPY.filled.title)).toBeVisible();
    expect(screen.getByText("3.7 shares at $0.54")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: ORDER_COPY.filled.return }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("says a single share, and keeps a sub-cent price", () => {
    renderContent({ status: "filled", shares: 1, price: 0.545 });

    expect(screen.getByText("1 share at $0.545")).toBeVisible();
  });

  it("says the order filled when its fill isn't known", () => {
    renderContent({ status: "filled" });

    expect(screen.getByText(ORDER_COPY.filled.description)).toBeVisible();
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
