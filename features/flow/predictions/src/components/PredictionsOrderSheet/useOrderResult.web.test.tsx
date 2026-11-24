import { renderHook } from "@testing-library/react";
import type { PredictionsOrderReport } from "@features/platform-predictions";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { ORDER_DETAILS } from "../../__tests__/orderDetails";
import { useOrderResult } from "./useOrderResult";

const resultOf = (report: PredictionsOrderReport) =>
  renderHook(
    () => useOrderResult({ order: ORDER_DETAILS, report, onClose: jest.fn(), onRetry: jest.fn() }),
    { wrapper: I18nWrapper },
  ).result.current;

describe("useOrderResult", () => {
  it.each([
    [{ status: "filled", shares: 16.129, price: 0.31 }, "You bought 16.13 shares for $5.00"],
    [{ status: "filled", shares: 1.004, price: 0.5 }, "You bought 1 share for $5.00"],
    [{ status: "filled", shares: 1.005, price: 0.5 }, "You bought 1.01 shares for $5.00"],
    [{ status: "filled" }, "You paid $5.00"],
  ] as const)("says what a filled order got for the amount signed (%p)", (report, description) => {
    const result = resultOf(report);

    expect(result.description).toBe(description);
    expect(result.content).toBeDefined();
  });

  it.each([
    { status: "not-filled" },
    { status: "rejected", reason: "market-closed" },
    { status: "unconfirmed" },
  ] as const)("shows no market when the order didn't fill (%p)", report => {
    expect(resultOf(report).content).toBeUndefined();
  });
});
