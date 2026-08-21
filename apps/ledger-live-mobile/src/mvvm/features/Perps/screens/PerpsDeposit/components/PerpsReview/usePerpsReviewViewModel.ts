import { useCallback, useMemo } from "react";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";

export type PerpsReviewDetailItem = Readonly<{
  labelKey: string;
  value: string;
  testID?: string;
}>;

export type PerpsReviewParams = Readonly<PerpsDepositReviewParams>;

export type PerpsReviewProps = PerpsReviewParams &
  Readonly<{
    isOpen: boolean;
    onClose: () => void;
  }>;

export type PerpsReviewViewModel = Readonly<{
  drawerOpen: boolean;
  swapDetails: readonly PerpsReviewDetailItem[];
  depositDetails: readonly PerpsReviewDetailItem[];
  handleDrawerClose: () => void;
  handleDeposit: () => void;
}>;

export function usePerpsReviewViewModel({
  isOpen,
  onClose,
  amountSent,
  amountTo,
  depositAccount,
  receiverAccount,
}: PerpsReviewProps): PerpsReviewViewModel {
  const { t } = useTranslation();
  const walletState = useSelector(walletSelector);
  const sentUnit = useAccountUnit(depositAccount);
  const receivedUnit = useAccountUnit(receiverAccount);

  const formattedAmountSent = useMemo(
    () =>
      formatCurrencyUnit(sentUnit, parseCurrencyUnit(sentUnit, amountSent), {
        showCode: true,
      }),
    [amountSent, sentUnit],
  );

  const formattedAmountReceived = useMemo(
    () =>
      formatCurrencyUnit(receivedUnit, parseCurrencyUnit(receivedUnit, amountTo), {
        showCode: true,
      }),
    [amountTo, receivedUnit],
  );

  const approximateAmountReceived = useMemo(
    () => t("perpsReview.approximateValue", { value: formattedAmountReceived }),
    [formattedAmountReceived, t],
  );

  const receiverAccountLabel = useMemo(
    () => accountNameWithDefaultSelector(walletState, receiverAccount),
    [receiverAccount, walletState],
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

  const handleDeposit = useCallback(() => {
    // Confirming closes the drawer; executing the deposit (sign + broadcast) is
    // owned by the wallet's deposit flow and reports no result to the live app.
    onClose();
  }, [onClose]);

  return {
    drawerOpen: isOpen,
    swapDetails,
    depositDetails,
    handleDrawerClose: onClose,
    handleDeposit,
  };
}
