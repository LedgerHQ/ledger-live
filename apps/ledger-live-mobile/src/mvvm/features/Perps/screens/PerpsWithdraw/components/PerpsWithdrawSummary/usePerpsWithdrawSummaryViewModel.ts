import { useCallback } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import type {
  PerpsWithdrawQuoteParams,
  WithdrawQuote,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/quote";
import { usePerpsWithdrawSummary } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/useWithdrawSummary";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { localeSelector } from "~/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";
import type { PerpsReviewDetailItem } from "@ledgerhq/live-common/wallet-api/Perps/reviewDetails";

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
    /** Hands the latest quote, the one on screen, over to signing. */
    onConfirm: (quote: WithdrawQuote) => void;
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
  onConfirm,
  destinationAccount,
  quote,
  quoteParams,
}: PerpsWithdrawSummaryProps): PerpsWithdrawSummaryViewModel {
  const { t } = useTranslation();
  const walletState = useSelector(walletSelector);
  const locale = useSelector(localeSelector);

  const formatApproximate = useCallback(
    (value: string) => t("perpsReview.approximateValue", { value }),
    [t],
  );
  const {
    quote: latestQuote,
    swapDetails,
    withdrawDetails,
    canWithdraw,
  } = usePerpsWithdrawSummary({
    initialQuote: quote,
    quoteParams,
    receiverName: accountNameWithDefaultSelector(walletState, destinationAccount),
    locale,
    formatApproximate,
    // The closed sheet stays mounted for its exit animation, so it must stop refreshing.
    enabled: isOpen,
  });

  const handleWithdraw = useCallback(() => onConfirm(latestQuote), [latestQuote, onConfirm]);

  return {
    drawerOpen: isOpen,
    swapDetails,
    withdrawDetails,
    canWithdraw,
    handleDrawerClose: onClose,
    handleWithdraw,
  };
}
