import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { PerpsWithdrawUiParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type {
  PerpsWithdrawQuoteParams,
  WithdrawQuote,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/quote";
import { getPerpsWithdrawSummary } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/summary";
import { usePerpsWithdrawSummaryQuote } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/useWithdrawSummaryQuote";
import { useSelector } from "LLD/hooks/redux";
import type { PerpsReviewDetailItem } from "LLD/features/Perps/components/PerpsReviewSection";
import { localeSelector } from "~/renderer/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";
import { openPerpsWithdraw } from "../PerpsWithdraw/PerpsWithdrawDialog";
import type { PerpsWithdrawDraft } from "../PerpsWithdraw/usePerpsWithdrawViewModel";

export type PerpsWithdrawSummaryData = PerpsWithdrawUiParams & {
  destinationAccount: AccountLike;
  /** The quote shown on the input, with the request that refreshes it. */
  quote: WithdrawQuote;
  quoteParams: PerpsWithdrawQuoteParams;
  draft: PerpsWithdrawDraft;
};

export type PerpsWithdrawSummaryViewModel = Readonly<{
  swapDetails: readonly PerpsReviewDetailItem[];
  withdrawDetails: readonly PerpsReviewDetailItem[];
  canWithdraw: boolean;
  handleBack: () => void;
  handleWithdraw: () => void;
}>;

export function usePerpsWithdrawSummaryViewModel(
  data: PerpsWithdrawSummaryData,
  onClose: () => void,
): PerpsWithdrawSummaryViewModel {
  const { t } = useTranslation();
  const walletState = useSelector(walletSelector);
  const locale = useSelector(localeSelector);
  const { sourceAccount, destinationAccount, quoteParams, draft } = data;

  const { quote, isRefreshing, error } = usePerpsWithdrawSummaryQuote(data.quote, quoteParams);

  const summary = useMemo(
    () =>
      getPerpsWithdrawSummary({
        amount: new BigNumber(quoteParams.amount),
        quote,
        sourceAccount,
        destinationAccount,
        locale,
      }),
    [destinationAccount, locale, quote, quoteParams.amount, sourceAccount],
  );

  const swapDetails = useMemo<readonly PerpsReviewDetailItem[]>(
    () => [
      {
        labelKey: "perpsReview.amountSendLabel",
        value: summary.amountSent,
        testID: "perps-withdraw-amount-sent",
      },
      {
        labelKey: "perpsReview.amountReceiveLabel",
        value: t("perpsReview.approximateValue", { value: summary.amountReceived }),
        testID: "perps-withdraw-amount-received",
      },
    ],
    [summary, t],
  );

  const withdrawDetails = useMemo<readonly PerpsReviewDetailItem[]>(
    () => [
      {
        labelKey: "perpsReview.withdrawReceiveLabel",
        value: accountNameWithDefaultSelector(walletState, destinationAccount),
        testID: "perps-withdraw-receiver-account",
      },
      {
        labelKey: "perpsReview.networkFeesLabel",
        value: summary.networkFees,
        testID: "perps-withdraw-network-fees",
      },
      {
        labelKey: "perpsReview.totalDebitedLabel",
        value: summary.totalDebited,
        testID: "perps-withdraw-total-debited",
      },
    ],
    [destinationAccount, summary, walletState],
  );

  const handleBack = useCallback(() => {
    openPerpsWithdraw({ sourceAccount, draft });
    onClose();
  }, [draft, onClose, sourceAccount]);

  // TODO(LIVE-39369): sign the withdrawal on the device.
  const handleWithdraw = useCallback(() => undefined, []);

  return {
    swapDetails,
    withdrawDetails,
    canWithdraw: !isRefreshing && error === null,
    handleBack,
    handleWithdraw,
  };
}
