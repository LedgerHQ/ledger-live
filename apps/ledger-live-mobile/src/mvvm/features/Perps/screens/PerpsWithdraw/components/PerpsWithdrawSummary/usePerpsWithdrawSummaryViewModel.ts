import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type {
  PerpsWithdrawQuoteParams,
  WithdrawQuote,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/quote";
import { getPerpsWithdrawSummary } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/summary";
import { usePerpsWithdrawSummaryQuote } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/useWithdrawSummaryQuote";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { localeSelector } from "~/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";
import type { PerpsReviewDetailItem } from "LLM/features/Perps/components/PerpsReviewSection";

export type PerpsWithdrawSummaryParams = Readonly<{
  sourceAccount: AccountLike;
  destinationAccount: AccountLike;
  /** The quote shown on the input, with the request that refreshes it. */
  quote: WithdrawQuote;
  quoteParams: PerpsWithdrawQuoteParams;
}>;

export type PerpsWithdrawSummaryProps = PerpsWithdrawSummaryParams &
  Readonly<{
    isOpen: boolean;
    onClose: () => void;
  }>;

export type PerpsWithdrawSummaryViewModel = Readonly<{
  drawerOpen: boolean;
  swapDetails: readonly PerpsReviewDetailItem[];
  withdrawDetails: readonly PerpsReviewDetailItem[];
  canWithdraw: boolean;
  handleDrawerClose: () => void;
  handleWithdraw: () => void;
}>;

export function usePerpsWithdrawSummaryViewModel({
  isOpen,
  onClose,
  sourceAccount,
  destinationAccount,
  quote: initialQuote,
  quoteParams,
}: PerpsWithdrawSummaryProps): PerpsWithdrawSummaryViewModel {
  const { t } = useTranslation();
  const walletState = useSelector(walletSelector);
  const locale = useSelector(localeSelector);

  // The closed sheet stays mounted for its exit animation, so it must stop refreshing.
  const { quote, isRefreshing, error } = usePerpsWithdrawSummaryQuote(initialQuote, quoteParams, {
    enabled: isOpen,
  });

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

  // TODO(LIVE-39369): sign the withdrawal on the device.
  const handleWithdraw = useCallback(() => undefined, []);

  return {
    drawerOpen: isOpen,
    swapDetails,
    withdrawDetails,
    canWithdraw: !isRefreshing && error === null,
    handleDrawerClose: onClose,
    handleWithdraw,
  };
}
