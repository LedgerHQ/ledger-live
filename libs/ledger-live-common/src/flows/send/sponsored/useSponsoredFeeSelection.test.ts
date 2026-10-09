/**
 * @jest-environment jsdom
 */
import { useCallback, useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction } from "../../../generated/types";
import type { SponsoredFeeQuote } from "../../../bridge/generic-coin-framework/sponsored";
import { USDT_FEE_ASSET } from "./fixtures/usdt";
import { STANDARD_FEE_OPTION_ID, useSponsoredFeeSelection } from "./useSponsoredFeeSelection";

const SPONSORED_ID = "tronify";
const QUOTE: SponsoredFeeQuote = {
  feeAsset: USDT_FEE_ASSET,
  value: 3_200_000n,
  originalValue: 13_000_000n,
};
// 10 USDT spendable, less the 3.2 USDT rent and its 1% margin.
const SNAPPED_MAX = new BigNumber(6_768_000);

const usdtAccount = (spendable = 10_000_000) =>
  ({
    type: "TokenAccount",
    id: "tron|usdt",
    spendableBalance: new BigNumber(spendable),
    pendingOperations: [],
  }) as unknown as TokenAccount;

const transactionOf = (amount: number, useAllAmount = false) =>
  ({ family: "tron", amount: new BigNumber(amount), useAllAmount }) as unknown as Transaction;

const USDT_ACCOUNT = usdtAccount();
const ONE_USDT_TRANSACTION = transactionOf(1_000_000);

type HarnessProps = {
  sponsoredFeeOptionId?: string;
  available?: boolean;
  quote?: SponsoredFeeQuote | null;
  feeTokenAccount?: TokenAccount | null;
  account?: AccountLike;
  initialTransaction?: Transaction;
};

/** Holds the transaction the way the send flow does, so each update feeds the next render. */
function useHarness({
  sponsoredFeeOptionId = SPONSORED_ID,
  available = true,
  quote = QUOTE,
  feeTokenAccount = USDT_ACCOUNT,
  account = feeTokenAccount ?? USDT_ACCOUNT,
  initialTransaction = ONE_USDT_TRANSACTION,
}: HarnessProps) {
  const [transaction, setTransaction] = useState(initialTransaction);
  const updateTransaction = useCallback(
    (updater: (tx: Transaction) => Transaction) => setTransaction(updater),
    [],
  );
  const selection = useSponsoredFeeSelection({
    sponsoredFeeOptionId,
    available,
    quote,
    feeTokenAccount,
    account,
    transaction,
    updateTransaction,
  });
  const editAmount = (amount: number) =>
    updateTransaction(tx => ({ ...tx, amount: new BigNumber(amount) }) as Transaction);
  return {
    selection,
    transaction: transaction as Transaction & { sponsored?: boolean },
    editAmount,
  };
}

const render = (props: HarnessProps = {}) =>
  renderHook((p: HarnessProps) => useHarness(p), { initialProps: props });

describe("useSponsoredFeeSelection", () => {
  it("starts on the standard fee and leaves the transaction untouched", () => {
    const initialTransaction = transactionOf(1_000_000);
    const { result } = render({ initialTransaction });

    expect(result.current.selection.selectedFeeOptionId).toBe(STANDARD_FEE_OPTION_ID);
    expect(result.current.selection.sponsoredSelected).toBe(false);
    expect(result.current.transaction).toBe(initialTransaction);
  });

  it("marks the transaction sponsored on selectSponsored, and clears it on selectStandard", () => {
    const { result } = render();

    act(() => result.current.selection.selectSponsored());

    expect(result.current.selection.sponsoredSelected).toBe(true);
    expect(result.current.transaction.sponsored).toBe(true);

    act(() => result.current.selection.selectStandard());

    expect(result.current.selection.selectedFeeOptionId).toBe(STANDARD_FEE_OPTION_ID);
    expect(result.current.transaction.sponsored).toBe(false);
  });

  it("ignores selectSponsored while no seam has resolved", () => {
    const { result } = render({ sponsoredFeeOptionId: "" });

    act(() => result.current.selection.selectSponsored());

    expect(result.current.selection.sponsoredSelected).toBe(false);
    expect(result.current.transaction.sponsored).toBeUndefined();
  });

  it("exposes what the fee token leaves after the rent and its margin, once quoted", () => {
    const { result, rerender } = render({ quote: null });
    expect(result.current.selection.sponsoredMaxAmount).toBeNull();

    rerender({});

    expect(result.current.selection.sponsoredMaxAmount).toEqual(SNAPPED_MAX);
  });

  describe("Max with the sponsored fee", () => {
    const maxTransaction = transactionOf(0, true);

    it("snaps Max to what the fee token leaves after the rent and its margin", () => {
      const { result } = render({ initialTransaction: maxTransaction });

      act(() => result.current.selection.selectSponsored());

      expect(result.current.transaction.useAllAmount).toBe(false);
      expect(result.current.transaction.amount).toEqual(SNAPPED_MAX);
    });

    it("snaps once a quote that arrives after the selection lands", () => {
      const { result, rerender } = render({ initialTransaction: maxTransaction, quote: null });
      act(() => result.current.selection.selectSponsored());
      expect(result.current.transaction.useAllAmount).toBe(true);

      rerender({ initialTransaction: maxTransaction });

      expect(result.current.transaction.amount).toEqual(SNAPPED_MAX);
    });

    it("restores Max on the standard fee while the amount is still the snapped one", () => {
      const { result } = render({ initialTransaction: maxTransaction });
      act(() => result.current.selection.selectSponsored());

      act(() => result.current.selection.selectStandard());

      expect(result.current.transaction.useAllAmount).toBe(true);
      expect(result.current.transaction.amount).toEqual(new BigNumber(0));
    });

    it("keeps an amount the user edited after the snap", () => {
      const { result } = render({ initialTransaction: maxTransaction });
      act(() => result.current.selection.selectSponsored());
      act(() => result.current.editAmount(5_000_000));

      act(() => result.current.selection.selectStandard());

      expect(result.current.transaction.useAllAmount).toBe(false);
      expect(result.current.transaction.amount).toEqual(new BigNumber(5_000_000));
    });

    it("leaves Max alone when the send spends another asset", () => {
      const { result } = render({
        initialTransaction: maxTransaction,
        account: { type: "Account", id: "tron" } as AccountLike,
      });

      act(() => result.current.selection.selectSponsored());

      expect(result.current.transaction.useAllAmount).toBe(true);
    });

    it("leaves Max alone and flags it when nothing is left after the rent and its margin", () => {
      const { result } = render({
        initialTransaction: maxTransaction,
        feeTokenAccount: usdtAccount(3_000_000),
      });

      act(() => result.current.selection.selectSponsored());

      expect(result.current.transaction.useAllAmount).toBe(true);
      expect(result.current.selection.sponsoredUnaffordable).toBe(true);
    });

    it("never flags a Max about to snap as unaffordable", () => {
      const flagged: boolean[] = [];
      const { result } = renderHook(() => {
        const harness = useHarness({ initialTransaction: maxTransaction });
        flagged.push(harness.selection.sponsoredUnaffordable);
        return harness;
      });

      act(() => result.current.selection.selectSponsored());

      expect(result.current.transaction.amount).toEqual(SNAPPED_MAX);
      expect(flagged).not.toContain(true);
    });
  });

  describe("sponsoredUnaffordable", () => {
    const largeTransaction = transactionOf(9_000_000);

    it("flags a sponsored pick the fee token can't cover with the rent", () => {
      const { result } = render({ initialTransaction: largeTransaction });

      act(() => result.current.selection.selectSponsored());

      expect(result.current.selection.sponsoredUnaffordable).toBe(true);
    });

    it("never flags the standard fee", () => {
      const { result } = render({ initialTransaction: largeTransaction });

      expect(result.current.selection.sponsoredUnaffordable).toBe(false);
    });

    it("doesn't flag the pick while the option is unavailable or unquoted", () => {
      const { result, rerender } = render({ initialTransaction: largeTransaction });
      act(() => result.current.selection.selectSponsored());

      rerender({ initialTransaction: largeTransaction, quote: null });
      expect(result.current.selection.sponsoredUnaffordable).toBe(false);

      rerender({ initialTransaction: largeTransaction, available: false });
      expect(result.current.selection.sponsoredUnaffordable).toBe(false);
    });
  });
});
