import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "LLD/hooks/redux";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
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
  const { t } = useTranslation();
  const walletState = useSelector(walletSelector);
  const sentUnit = useAccountUnit(data.depositAccount);
  const receivedUnit = useAccountUnit(data.receiverAccount);

  const formattedAmountSent = useMemo(
    () =>
      formatCurrencyUnit(sentUnit, parseCurrencyUnit(sentUnit, data.amountSent), {
        showCode: true,
      }),
    [data.amountSent, sentUnit],
  );

  const formattedAmountReceived = useMemo(
    () =>
      formatCurrencyUnit(receivedUnit, parseCurrencyUnit(receivedUnit, data.amountTo), {
        showCode: true,
      }),
    [data.amountTo, receivedUnit],
  );

  const approximateAmountReceived = useMemo(
    () => t("perpsReview.approximateValue", { value: formattedAmountReceived }),
    [formattedAmountReceived, t],
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
        value: approximateAmountReceived,
        testID: "perps-deposit-amount-received",
      },
    ],
    [approximateAmountReceived, formattedAmountSent],
  );

  const depositDetails = useMemo<readonly PerpsReviewDetailItem[]>(
    () => [
      {
        labelKey: "perpsReview.depositAmountLabel",
        value: approximateAmountReceived,
        testID: "perps-deposit-deposited-amount",
      },
      {
        labelKey: "perpsReview.depositReceiveLabel",
        value: receiverAccountLabel,
        testID: "perps-deposit-receiver-account",
      },
    ],
    [approximateAmountReceived, receiverAccountLabel],
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
