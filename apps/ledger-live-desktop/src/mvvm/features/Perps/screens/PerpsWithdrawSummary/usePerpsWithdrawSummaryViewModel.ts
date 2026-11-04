import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { AccountLike } from "@ledgerhq/types-live";
import type { PerpsWithdrawUiParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type {
  PerpsWithdrawQuoteParams,
  WithdrawQuote,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/quote";
import { usePerpsWithdrawSummary } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/useWithdrawSummary";
import { useSelector } from "LLD/hooks/redux";
import type { PerpsReviewDetailItem } from "LLD/features/Perps/components/PerpsReviewSection";
import { localeSelector } from "~/renderer/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";
import { openPerpsWithdraw } from "../PerpsWithdraw/PerpsWithdrawDialog";
import { openPerpsWithdrawSign } from "../PerpsWithdrawSign/PerpsWithdrawSignDialog";
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
  const { sourceAccount, destinationAccount, draft } = data;

  const formatApproximate = useCallback(
    (value: string) => t("perpsReview.approximateValue", { value }),
    [t],
  );
  const { quote, swapDetails, withdrawDetails, canWithdraw } = usePerpsWithdrawSummary({
    initialQuote: data.quote,
    quoteParams: data.quoteParams,
    receiverName: accountNameWithDefaultSelector(walletState, destinationAccount),
    locale,
    formatApproximate,
  });

  const handleBack = useCallback(() => {
    openPerpsWithdraw({ sourceAccount, draft });
    onClose();
  }, [draft, onClose, sourceAccount]);

  // Signs the latest quote, the one on screen.
  const handleWithdraw = useCallback(() => {
    openPerpsWithdrawSign({ ...data, quote });
    onClose();
  }, [data, onClose, quote]);

  return { swapDetails, withdrawDetails, canWithdraw, handleBack, handleWithdraw };
}
