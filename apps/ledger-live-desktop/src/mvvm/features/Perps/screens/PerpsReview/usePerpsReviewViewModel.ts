import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { formatPerpsDepositAmount } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type {
  PerpsDepositAmount,
  PerpsDepositReviewParams,
} from "@ledgerhq/live-common/wallet-api/Perps/server";
import { useSelector } from "LLD/hooks/redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { openPerpsDeposit } from "../PerpsDeposit/PerpsDepositDialog";
import type { PerpsDepositDraft } from "../PerpsDeposit/usePerpsDepositViewModel";
export type PerpsReviewData = PerpsDepositReviewParams & {
  draft?: PerpsDepositDraft;
};

export type PerpsReviewDetailItem = Readonly<{
  labelKey: string;
  value: string;
  testID?: string;
}>;

function useFormattedPerpsDepositAmount(amount: PerpsDepositAmount, account: AccountLike): string {
  const [formatted, setFormatted] = useState("");
  // Keyed on the amount fields rather than the object, which the caller recreates.
  const { value: amountValue, currencyId } = amount;

  useEffect(() => {
    let cancelled = false;

    void formatPerpsDepositAmount({ value: amountValue, currencyId }, account).then(value => {
      if (!cancelled) {
        setFormatted(value);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [amountValue, currencyId, account]);

  return formatted;
}

export type PerpsReviewViewModel = Readonly<{
  swapDetails: readonly PerpsReviewDetailItem[];
  depositDetails: readonly PerpsReviewDetailItem[];
  isSubmitting: boolean;
  handleBack: () => void;
  handleDeposit: () => void;
}>;

export function usePerpsReviewViewModel(
  data: PerpsReviewData,
  onClose: () => void,
): PerpsReviewViewModel {
  const walletState = useSelector(walletSelector);

  const formattedAmountSent = useFormattedPerpsDepositAmount(data.amountSent, data.depositAccount);

  const formattedAmountReceived = useFormattedPerpsDepositAmount(
    data.amountReceived ?? data.amountSent,
    data.receiverAccount,
  );

  const receiverAccountLabel = useMemo(
    () => accountNameWithDefaultSelector(walletState, data.receiverAccount),
    [data.receiverAccount, walletState],
  );

  const swapDetails = useMemo<readonly PerpsReviewDetailItem[]>(
    () => [
      {
        labelKey: "perpsReview.amountSendLabel",
        value: formattedAmountSent,
        testID: "perps-deposit-amount-sent",
      },
      {
        labelKey: "perpsReview.amountReceiveLabel",
        value: formattedAmountReceived,
        testID: "perps-deposit-amount-received",
      },
    ],
    [formattedAmountReceived, formattedAmountSent],
  );

  const depositDetails = useMemo<readonly PerpsReviewDetailItem[]>(
    () => [
      {
        labelKey: "perpsReview.depositAmountLabel",
        value: formattedAmountReceived,
        testID: "perps-deposit-deposited-amount",
      },
      {
        labelKey: "perpsReview.depositReceiveLabel",
        value: receiverAccountLabel,
        testID: "perps-deposit-receiver-account",
      },
    ],
    [formattedAmountReceived, receiverAccountLabel],
  );

  const handleBack = useCallback(() => {
    openPerpsDeposit({ receiverAccount: data.receiverAccount, draft: data.draft });
    onClose();
  }, [data.draft, data.receiverAccount, onClose]);

  // The signing dialog is not built yet, so confirming just closes the review.
  const handleDeposit = useCallback(() => {
    onClose();
  }, [onClose]);

  return {
    swapDetails,
    depositDetails,
    isSubmitting: false,
    handleBack,
    handleDeposit,
  };
}
