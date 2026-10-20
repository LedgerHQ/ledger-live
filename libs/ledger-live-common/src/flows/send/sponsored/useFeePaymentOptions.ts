import { useCallback, useMemo, useState } from "react";
import type { BigNumber } from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import { STANDARD_FEE_OPTION_ID } from "./useSponsoredFeeSelection";
import type { FeePaymentLabels, FeePaymentOption, SponsoredFeeAmounts } from "./types";

type UseFeePaymentOptionsParams = Readonly<{
  selectedFeeOptionId: string;
  sponsoredFeeOptionId: string;
  sponsoredFeeAmounts: SponsoredFeeAmounts | null;
  feeTokenAccount: TokenAccount | null;
  sponsoredMaxAmount: BigNumber | null;
  selectSponsored: () => void;
  selectStandard: () => void;
  labels: FeePaymentLabels;
}>;

export type FeePaymentOptions = Readonly<{
  options: readonly FeePaymentOption[];
  /** The option Confirm applies. */
  pendingId: string;
  confirmDisabled: boolean;
  onSelect: (id: string) => void;
  /** Applies the staged option; false, applying nothing, while it can't be paid. */
  confirm: () => boolean;
  /** Drops the staged option, so the next opening starts from the current pick. */
  reset: () => void;
}>;

/** Stages a fee option until Confirm, then applies it. */
export function useFeePaymentOptions({
  selectedFeeOptionId,
  sponsoredFeeOptionId,
  sponsoredFeeAmounts,
  feeTokenAccount,
  sponsoredMaxAmount,
  selectSponsored,
  selectStandard,
  labels,
}: UseFeePaymentOptionsParams): FeePaymentOptions {
  const sponsoredDisabled = !feeTokenAccount || !!sponsoredMaxAmount?.lte(0);
  const [stagedId, setStagedId] = useState<string | null>(null);
  const pendingId = stagedId ?? selectedFeeOptionId;
  const confirmDisabled = pendingId === sponsoredFeeOptionId && sponsoredDisabled;

  const onSelect = useCallback(
    (id: string) => {
      if (id === sponsoredFeeOptionId && sponsoredDisabled) return;
      setStagedId(id);
    },
    [sponsoredFeeOptionId, sponsoredDisabled],
  );

  const reset = useCallback(() => setStagedId(null), []);

  const confirm = useCallback(() => {
    if (confirmDisabled) return false;
    if (pendingId !== selectedFeeOptionId) {
      if (pendingId === sponsoredFeeOptionId) {
        selectSponsored();
      } else {
        selectStandard();
      }
    }
    setStagedId(null);
    return true;
  }, [
    confirmDisabled,
    pendingId,
    selectedFeeOptionId,
    sponsoredFeeOptionId,
    selectSponsored,
    selectStandard,
  ]);

  const options: readonly FeePaymentOption[] = useMemo(
    () => [
      {
        id: sponsoredFeeOptionId,
        label: labels.sponsored,
        paidInLabel: labels.sponsoredPaidIn,
        fee: sponsoredFeeAmounts?.sponsored ?? null,
        selected: pendingId === sponsoredFeeOptionId,
        disabled: sponsoredDisabled,
        note: sponsoredDisabled ? labels.insufficientFunds : null,
      },
      {
        id: STANDARD_FEE_OPTION_ID,
        label: labels.regular,
        paidInLabel: labels.regularPaidIn,
        fee: sponsoredFeeAmounts ? { ...sponsoredFeeAmounts.standard, originalValue: null } : null,
        selected: pendingId === STANDARD_FEE_OPTION_ID,
        disabled: false,
        note: null,
      },
    ],
    [labels, pendingId, sponsoredFeeOptionId, sponsoredFeeAmounts, sponsoredDisabled],
  );

  return { options, pendingId, confirmDisabled, onSelect, confirm, reset };
}
