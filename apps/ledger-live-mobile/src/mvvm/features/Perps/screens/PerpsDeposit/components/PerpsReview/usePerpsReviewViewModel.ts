import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { formatPerpsDepositAmount } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { PerpsDepositAmount } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { useSelector } from "~/context/hooks";
import { walletSelector } from "~/reducers/wallet";

export type PerpsReviewDetailItem = Readonly<{
  labelKey: string;
  value: string;
  testID?: string;
}>;

export type PerpsReviewParams = Readonly<{
  depositAccount: AccountLike;
  receiverAccount: AccountLike;
  amountSent: PerpsDepositAmount;
  amountReceived?: PerpsDepositAmount;
}>;

export type PerpsReviewProps = PerpsReviewParams &
  Readonly<{
    isOpen: boolean;
    onClose: () => void;
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
  amountReceived,
  depositAccount,
  receiverAccount,
}: PerpsReviewProps): PerpsReviewViewModel {
  const walletState = useSelector(walletSelector);

  const formattedAmountSent = useFormattedPerpsDepositAmount(amountSent, depositAccount);

  const formattedAmountReceived = useFormattedPerpsDepositAmount(
    amountReceived ?? amountSent,
    receiverAccount,
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
