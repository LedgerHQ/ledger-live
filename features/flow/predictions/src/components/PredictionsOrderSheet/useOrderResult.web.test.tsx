import { renderHook } from "@testing-library/react";
import type { PredictionsOrderReport } from "@features/platform-predictions";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { ORDER_DETAILS, SALE_DETAILS } from "../../__tests__/orderDetails";
import type { PredictionsOrderDetails } from "../../predictionsOrderStore.internals";
import { useOrderResult } from "./useOrderResult";

const resultOf = (report: PredictionsOrderReport, order: PredictionsOrderDetails = ORDER_DETAILS) =>
  renderHook(() => useOrderResult({ order, report, onClose: jest.fn(), onRetry: jest.fn() }), {
    wrapper: I18nWrapper,
  }).result.current;

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

  it.each([
    [16.12, { status: "filled", shares: 16.12, received: 4.3 }, "You sold 16.12 shares for $4.30"],
    [1, { status: "filled", shares: 1, received: 0.5 }, "You sold 1 share for $0.50"],
    [16.12, { status: "filled" }, "You sold 16.12 shares"],
  ] as const)(
    "says what a filled sale of %p shares paid out, when reported (%p)",
    (shares, report, description) => {
      const result = resultOf(report, { side: "sale", display: SALE_DETAILS.display, shares });

      expect(result.title).toBe("Sale complete");
      expect(result.description).toBe(description);
      expect(result.content).toBeDefined();
    },
  );

  it("says the shares the sale signed, not the ones reported", () => {
    const result = resultOf({ status: "filled", shares: 3, received: 4.3 }, SALE_DETAILS);

    expect(result.description).toBe("You sold 16.12 shares for $4.30");
  });

  it.each([
    [
      { status: "not-filled" },
      "Sale not filled",
      "Nothing was sold. Try again with a fresh quote.",
    ],
    [
      { status: "rejected", reason: "insufficient-balance" },
      "Sale not placed",
      "You don't hold enough shares for this sale.",
    ],
    [
      { status: "unconfirmed" },
      "We couldn't confirm your sale",
      "Check your positions before trying again.",
    ],
  ] as const)("tells a sale that didn't fill in sale words (%p)", (report, title, description) => {
    expect(resultOf(report, SALE_DETAILS)).toMatchObject({ title, description });
  });
});
