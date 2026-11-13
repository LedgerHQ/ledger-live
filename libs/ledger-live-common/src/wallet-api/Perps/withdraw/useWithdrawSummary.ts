import { useMemo } from "react";
import BigNumber from "bignumber.js";
import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";
import type { PerpsWithdrawQuoteParams, WithdrawQuote } from "./quote";
import { getPerpsWithdrawSummary } from "./summary";
import { usePerpsWithdrawSummaryQuote } from "./useWithdrawSummaryQuote";

export type PerpsWithdrawSummaryDetail = Readonly<{
  labelKey: string;
  value: string;
  testID: string;
}>;

export type UsePerpsWithdrawSummaryParams = Readonly<{
  /** The quote shown on the input, refreshed from `quoteParams`. */
  initialQuote: WithdrawQuote;
  quoteParams: PerpsWithdrawQuoteParams;
  receiverName: string;
  locale: string;
  /** Marks the amount received as an estimate, e.g. "~0.3 ETH". */
  formatApproximate: (value: string) => string;
  enabled?: boolean;
}>;

export type PerpsWithdrawSummaryDetails = Readonly<{
  /** The latest quote, the one the withdraw signs. */
  quote: WithdrawQuote;
  swapDetails: readonly PerpsWithdrawSummaryDetail[];
  withdrawDetails: readonly PerpsWithdrawSummaryDetail[];
  canWithdraw: boolean;
}>;

/** The withdraw summary rows, shared by desktop and mobile, kept fresh with the quote. */
export function usePerpsWithdrawSummary({
  initialQuote,
  quoteParams,
  receiverName,
  locale,
  formatApproximate,
  enabled,
}: UsePerpsWithdrawSummaryParams): PerpsWithdrawSummaryDetails {
  const { quote, isRefreshing, error } = usePerpsWithdrawSummaryQuote(initialQuote, quoteParams, {
    enabled,
  });
  const { amount, sourceAccount, destinationAccount } = quoteParams;

  return useMemo(() => {
    const summary = getPerpsWithdrawSummary({
      amount: parseFiniteBigNumber(amount) ?? new BigNumber(0),
      quote,
      sourceAccount,
      destinationAccount,
      locale,
    });

    return {
      quote,
      swapDetails: [
        {
          labelKey: "perpsReview.amountSendLabel",
          value: summary.amountSent,
          testID: "perps-withdraw-amount-sent",
        },
        {
          labelKey: "perpsReview.amountReceiveLabel",
          value: formatApproximate(summary.amountReceived),
          testID: "perps-withdraw-amount-received",
        },
      ],
      withdrawDetails: [
        {
          labelKey: "perpsReview.withdrawReceiveLabel",
          value: receiverName,
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
      canWithdraw: !isRefreshing && error === null,
    };
  }, [
    amount,
    destinationAccount,
    error,
    formatApproximate,
    isRefreshing,
    locale,
    quote,
    receiverName,
    sourceAccount,
  ]);
}
