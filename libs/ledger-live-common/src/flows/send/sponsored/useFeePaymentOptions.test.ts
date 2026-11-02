/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { FeePaymentLabels, FeePaymentOption } from "./types";
import { useFeePaymentOptions } from "./useFeePaymentOptions";

const SPONSORED_ID = "tronify";
const labels: FeePaymentLabels = {
  sponsored: "Pay with Tronify",
  sponsoredPaidIn: "Paid in USDT",
  regular: "Regular transfer",
  regularPaidIn: "Paid in TRX",
  insufficientFunds: "Not enough USDT",
};

const selectSponsored = jest.fn();
const selectStandard = jest.fn();

type Params = Parameters<typeof useFeePaymentOptions>[0];

const baseParams: Params = {
  selectedFeeOptionId: "standard",
  sponsoredFeeOptionId: SPONSORED_ID,
  sponsoredFeeAmounts: {
    sponsored: { value: "$3.22", secondaryValue: "3.22324 USDT", originalValue: "$4.12" },
    standard: { value: "$4.12", secondaryValue: "2.32923 TRX" },
  },
  feeTokenAccount: { id: "tron|usdt" } as TokenAccount,
  sponsoredMaxAmount: new BigNumber(6_768_000),
  selectSponsored,
  selectStandard,
  labels,
};

const render = (overrides: Partial<Params> = {}) =>
  renderHook((params: Params) => useFeePaymentOptions(params), {
    initialProps: { ...baseParams, ...overrides },
  });

const byId = (options: readonly FeePaymentOption[], id: string) =>
  options.find(option => option.id === id);

describe("useFeePaymentOptions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists the sponsored option before Regular, each labelled with what it is paid in", () => {
    const { result } = render();

    expect(result.current.options).toEqual([
      {
        id: SPONSORED_ID,
        label: "Pay with Tronify",
        paidInLabel: "Paid in USDT",
        fee: { value: "$3.22", secondaryValue: "3.22324 USDT", originalValue: "$4.12" },
        selected: false,
        disabled: false,
        note: null,
      },
      {
        id: "standard",
        label: "Regular transfer",
        paidInLabel: "Paid in TRX",
        fee: { value: "$4.12", secondaryValue: "2.32923 TRX", originalValue: null },
        selected: true,
        disabled: false,
        note: null,
      },
    ]);
  });

  it("shows no fee on either option before a quote", () => {
    const { result } = render({ sponsoredFeeAmounts: null });

    expect(result.current.options.map(option => option.fee)).toEqual([null, null]);
  });

  it("stages a picked option without applying it", () => {
    const { result } = render();

    act(() => result.current.onSelect(SPONSORED_ID));

    expect(result.current.pendingId).toBe(SPONSORED_ID);
    expect(byId(result.current.options, SPONSORED_ID)?.selected).toBe(true);
    expect(selectSponsored).not.toHaveBeenCalled();
  });

  it("applies the staged sponsored option on confirm", () => {
    const { result } = render();
    act(() => result.current.onSelect(SPONSORED_ID));

    let confirmed = false;
    act(() => {
      confirmed = result.current.confirm();
    });

    expect(confirmed).toBe(true);
    expect(selectSponsored).toHaveBeenCalledTimes(1);
    expect(selectStandard).not.toHaveBeenCalled();
  });

  it("applies the staged Regular option on confirm", () => {
    const { result } = render({ selectedFeeOptionId: SPONSORED_ID });
    act(() => result.current.onSelect("standard"));

    act(() => {
      result.current.confirm();
    });

    expect(selectStandard).toHaveBeenCalledTimes(1);
    expect(selectSponsored).not.toHaveBeenCalled();
  });

  it("applies nothing when confirm keeps the current option", () => {
    const { result } = render();

    let confirmed = false;
    act(() => {
      confirmed = result.current.confirm();
    });

    expect(confirmed).toBe(true);
    expect(selectSponsored).not.toHaveBeenCalled();
    expect(selectStandard).not.toHaveBeenCalled();
  });

  it("starts from the current pick again after reset", () => {
    const { result } = render();
    act(() => result.current.onSelect(SPONSORED_ID));

    act(() => result.current.reset());

    expect(result.current.pendingId).toBe("standard");
  });

  it("follows the current pick while nothing is staged", () => {
    const { result, rerender } = render();

    rerender({ ...baseParams, selectedFeeOptionId: SPONSORED_ID });

    expect(result.current.pendingId).toBe(SPONSORED_ID);
  });

  it.each([
    ["nothing is left after the rent", { sponsoredMaxAmount: new BigNumber(0) }],
    ["the account holds none of the fee token", { feeTokenAccount: null }],
  ])("disables the sponsored option and says why when %s", (_, overrides) => {
    const { result } = render(overrides);

    expect(byId(result.current.options, SPONSORED_ID)).toMatchObject({
      disabled: true,
      note: "Not enough USDT",
    });
    expect(byId(result.current.options, "standard")?.disabled).toBe(false);
  });

  it("ignores a pick of the disabled sponsored option", () => {
    const { result } = render({ sponsoredMaxAmount: new BigNumber(0) });

    act(() => result.current.onSelect(SPONSORED_ID));

    expect(result.current.pendingId).toBe("standard");
  });

  it("refuses to confirm a sponsored pick that can no longer be paid", () => {
    const { result } = render({
      selectedFeeOptionId: SPONSORED_ID,
      sponsoredMaxAmount: new BigNumber(0),
    });

    let confirmed = true;
    act(() => {
      confirmed = result.current.confirm();
    });

    expect(result.current.confirmDisabled).toBe(true);
    expect(confirmed).toBe(false);
  });
});
