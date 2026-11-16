import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import {
  getPerpsDepositReviewDetails,
  type PerpsReviewDetailItem,
} from "@ledgerhq/live-common/wallet-api/Perps/reviewDetails";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";
import { openPerpsDeposit } from "../PerpsDeposit/PerpsDepositDialog";
import type { PerpsDepositDraft } from "../PerpsDeposit/usePerpsDepositViewModel";
import { openPerpsDepositSign } from "../PerpsDepositSign/PerpsDepositSignDialog";
export type PerpsReviewData = PerpsDepositReviewParams & {
  draft?: PerpsDepositDraft;
};

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
  const locale = useSelector(localeSelector);

  const receiverAccountName = accountNameWithDefaultSelector(walletState, data.receiverAccount);

  const { swapDetails, depositDetails } = useMemo(
    () =>
      getPerpsDepositReviewDetails(data, {
        locale,
        receiverAccountName,
        formatApproximate: value => t("perpsReview.approximateValue", { value }),
      }),
    [data, locale, receiverAccountName, t],
  );

  const handleBack = useCallback(() => {
    openPerpsDeposit({ receiverAccount: data.receiverAccount, draft: data.draft });
    onClose();
  }, [data.draft, data.receiverAccount, onClose]);

  const handleDeposit = useCallback(() => {
    openPerpsDepositSign({
      receiverAccount: data.receiverAccount,
      depositAccount: data.depositAccount,
      amountSent: data.amountSent,
      amountTo: data.amountTo,
      quoteId: data.quoteId,
      draft: data.draft,
    });
    onClose();
  }, [
    data.amountTo,
    data.amountSent,
    data.depositAccount,
    data.draft,
    data.quoteId,
    data.receiverAccount,
    onClose,
  ]);

  return {
    swapDetails,
    depositDetails,
    isSubmitting: false,
    handleBack,
    handleDeposit,
  };
}
