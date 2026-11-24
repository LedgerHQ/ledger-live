import { useMemo } from "react";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import {
  getPerpsDepositReviewDetails,
  type PerpsReviewDetailItem,
} from "@ledgerhq/live-common/wallet-api/Perps/reviewDetails";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { localeSelector } from "~/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";

export type PerpsReviewParams = Readonly<PerpsDepositReviewParams>;

export type PerpsReviewProps = PerpsReviewParams &
  Readonly<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
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
  onConfirm,
  amountSent,
  amountTo,
  depositAccount,
  receiverAccount,
}: PerpsReviewProps): PerpsReviewViewModel {
  const { t } = useTranslation();
  const walletState = useSelector(walletSelector);
  const locale = useSelector(localeSelector);

  const receiverAccountName = accountNameWithDefaultSelector(walletState, receiverAccount);

  const { swapDetails, depositDetails } = useMemo(
    () =>
      getPerpsDepositReviewDetails(
        { amountSent, amountTo, depositAccount, receiverAccount },
        {
          locale,
          receiverAccountName,
          formatApproximate: value => t("perpsReview.approximateValue", { value }),
        },
      ),
    [amountSent, amountTo, depositAccount, receiverAccount, locale, receiverAccountName, t],
  );

  return {
    drawerOpen: isOpen,
    swapDetails,
    depositDetails,
    handleDrawerClose: onClose,
    handleDeposit: onConfirm,
  };
}
