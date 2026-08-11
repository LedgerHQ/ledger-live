import { useCallback, useMemo } from "react";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { useSelector } from "LLD/hooks/redux";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";
import { openPerpsDeposit } from "../PerpsDeposit/PerpsDepositDialog";
import type { PerpsDepositDraft } from "../PerpsDeposit/usePerpsDepositViewModel";
import { formatDepositAmount } from "./utils/formatDepositAmount";
export type PerpsReviewData = PerpsDepositReviewParams & {
  draft?: PerpsDepositDraft;
};

export type PerpsReviewDetailItem = Readonly<{
  labelKey: string;
  value: string;
  testID?: string;
}>;

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

  const formattedAmountSent = useMemo(
    () => formatDepositAmount(data.amountSent, data.depositAccount),
    [data.amountSent, data.depositAccount],
  );

  const formattedAmountReceived = useMemo(
    () => formatDepositAmount(data.amountTo, data.receiverAccount),
    [data.amountTo, data.receiverAccount],
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
