import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BigNumber } from "bignumber.js";
import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction } from "../../../generated/types";
import type { SponsoredFeeQuote } from "../../../bridge/generic-coin-framework/sponsored";
import type { SendFlowTransactionActions } from "../types";
import { isSponsoredFeeUnaffordable, sponsoredMaxAmount } from "./feeAsset";
import { SPONSORED_PHASE, type SponsoredPhase } from "./types";

export const STANDARD_FEE_OPTION_ID = "standard";

type UseSponsoredFeeSelectionParams = Readonly<{
  /** Empty while no seam has resolved. */
  sponsoredFeeOptionId: string;
  available: boolean;
  /** Past IDLE, TX-A's pending op has already taken the rent off the fee token. */
  phase: SponsoredPhase;
  quote: SponsoredFeeQuote | null;
  feeTokenAccount: TokenAccount | null;
  account: AccountLike | null;
  transaction: Transaction | null;
  updateTransaction: SendFlowTransactionActions["updateTransaction"];
}>;

export type SponsoredFeeSelection = Readonly<{
  selectedFeeOptionId: string;
  sponsoredSelected: boolean;
  selectSponsored: () => void;
  selectStandard: () => void;
  /** Drops a finished send's pick so the next send opts in again; the sent amount stays as is. */
  resetSelection: () => void;
  /** Largest amount the fee token covers next to the rent; ≤ 0 when nothing fits, null until quoted. */
  sponsoredMaxAmount: BigNumber | null;
  /** The sponsored pick can't pay the amount and the rent from the fee token. */
  sponsoredUnaffordable: boolean;
}>;

export function useSponsoredFeeSelection({
  sponsoredFeeOptionId,
  available,
  phase,
  quote,
  feeTokenAccount,
  account,
  transaction,
  updateTransaction,
}: UseSponsoredFeeSelectionParams): SponsoredFeeSelection {
  const [selectedFeeOptionId, setSelectedFeeOptionId] = useState(STANDARD_FEE_OPTION_ID);
  const snappedAmountRef = useRef<BigNumber | null>(null);

  // `sponsored` makes getPendingNativeSpent skip the native fee on the optimistic op; crafting ignores it.
  const selectSponsored = useCallback(() => {
    if (!sponsoredFeeOptionId) return;
    setSelectedFeeOptionId(sponsoredFeeOptionId);
    updateTransaction(tx => ({ ...tx, sponsored: true }) as Transaction);
  }, [sponsoredFeeOptionId, updateTransaction]);
  // Restores Max only while the amount is still the one the sponsored option snapped it to.
  const selectStandard = useCallback(() => {
    setSelectedFeeOptionId(STANDARD_FEE_OPTION_ID);
    const snapped = snappedAmountRef.current;
    snappedAmountRef.current = null;
    updateTransaction(
      tx =>
        (snapped !== null && !tx.useAllAmount && tx.amount.eq(snapped)
          ? { ...tx, sponsored: false, useAllAmount: true, amount: new BigNumber(0) }
          : { ...tx, sponsored: false }) as Transaction,
    );
  }, [updateTransaction]);
  const resetSelection = useCallback(() => {
    setSelectedFeeOptionId(STANDARD_FEE_OPTION_ID);
    snappedAmountRef.current = null;
    updateTransaction(tx => ({ ...tx, sponsored: false }) as Transaction);
  }, [updateTransaction]);

  const sponsoredSelected = !!sponsoredFeeOptionId && selectedFeeOptionId === sponsoredFeeOptionId;
  const maxAmountWithRent = useMemo(
    () => (quote && feeTokenAccount ? sponsoredMaxAmount(feeTokenAccount, quote.value) : null),
    [quote, feeTokenAccount],
  );
  const snapsMax =
    sponsoredSelected &&
    available &&
    transaction?.useAllAmount === true &&
    !!feeTokenAccount &&
    account?.id === feeTokenAccount.id &&
    !!maxAmountWithRent?.gt(0);

  // Crafting refuses a Max send, so Max snaps to what the fee token leaves after the rent and its
  // margin. The snap turns Max off, so a later quote never moves the amount under the user.
  useEffect(() => {
    if (!snapsMax || !maxAmountWithRent) return;
    const snapped = maxAmountWithRent;
    snappedAmountRef.current = snapped;
    updateTransaction(tx => ({ ...tx, useAllAmount: false, amount: snapped }) as Transaction);
  }, [snapsMax, maxAmountWithRent, updateTransaction]);

  // A Max about to snap fits by construction, so it isn't flagged for the render before the snap.
  // Past IDLE, the rent is already off the balance, so checking it again would lock Review.
  const sponsoredUnaffordable =
    sponsoredSelected &&
    available &&
    phase === SPONSORED_PHASE.IDLE &&
    !snapsMax &&
    !!quote &&
    !!account &&
    !!transaction &&
    isSponsoredFeeUnaffordable({ account, transaction, feeTokenAccount, rentValue: quote.value });

  return useMemo(
    () => ({
      selectedFeeOptionId,
      sponsoredSelected,
      selectSponsored,
      selectStandard,
      resetSelection,
      sponsoredMaxAmount: maxAmountWithRent,
      sponsoredUnaffordable,
    }),
    [
      selectedFeeOptionId,
      sponsoredSelected,
      selectSponsored,
      selectStandard,
      resetSelection,
      maxAmountWithRent,
      sponsoredUnaffordable,
    ],
  );
}
