/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../../../generated/types";
import { useReestimateOnRentDelivery } from "./useReestimateOnRentDelivery";

type Props = { deliveredAt: number | null; active: boolean };

const updateTransaction = jest.fn();

// A new function per render, as a store that doesn't memoize its actions would give.
const render = (initial: Partial<Props> = {}) =>
  renderHook(
    ({ deliveredAt, active }: Props) =>
      useReestimateOnRentDelivery({
        deliveredAt,
        active,
        updateTransaction: (...args) => updateTransaction(...args),
      }),
    { initialProps: { deliveredAt: null, active: true, ...initial } },
  );

describe("useReestimateOnRentDelivery", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should re-estimate once with a copy of the transaction when a delivery lands while active", () => {
    const { rerender } = render();
    expect(updateTransaction).not.toHaveBeenCalled();

    rerender({ deliveredAt: 1_000, active: true });

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const transaction = { family: "tron", amount: new BigNumber(1) } as unknown as Transaction;
    const copy = updateTransaction.mock.calls[0][0](transaction);
    expect(copy).toEqual(transaction);
    expect(copy).not.toBe(transaction);
  });

  it("should hold a delivery when it lands while inactive", () => {
    const { rerender } = render({ active: false });

    rerender({ deliveredAt: 1_000, active: false });

    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it("should re-estimate a held delivery once when it becomes active", () => {
    const { rerender } = render({ active: false });
    rerender({ deliveredAt: 1_000, active: false });

    rerender({ deliveredAt: 1_000, active: true });
    rerender({ deliveredAt: 1_000, active: true });

    expect(updateTransaction).toHaveBeenCalledTimes(1);
  });

  it("should never re-estimate the same delivery twice when it goes inactive and back", () => {
    const { rerender } = render({ deliveredAt: 1_000 });
    expect(updateTransaction).toHaveBeenCalledTimes(1);

    rerender({ deliveredAt: 1_000, active: false });
    rerender({ deliveredAt: 1_000, active: true });

    expect(updateTransaction).toHaveBeenCalledTimes(1);
  });

  it("should not re-fire a delivery when updateTransaction changes on every render", () => {
    const { rerender } = render({ deliveredAt: 1_000 });

    rerender({ deliveredAt: 1_000, active: true });
    rerender({ deliveredAt: 1_000, active: true });

    expect(updateTransaction).toHaveBeenCalledTimes(1);
  });

  it("should re-estimate again when a later delivery lands", () => {
    const { rerender } = render({ deliveredAt: 1_000 });

    rerender({ deliveredAt: 2_000, active: true });

    expect(updateTransaction).toHaveBeenCalledTimes(2);
  });
});
