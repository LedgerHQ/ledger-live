import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../account";
import { formatCurrencyUnit, parseCurrencyUnit } from "../../currencies";
import type { PerpsDepositReviewParams } from "./server";

export type PerpsReviewDetailItem = Readonly<{
  labelKey: string;
  value: string;
  testID?: string;
}>;

export type PerpsTransactionSignedParams = Readonly<{
  receiveCurrencyTicker: string;
  swapId?: string;
  provider?: string;
}>;

export type PerpsDepositReviewDetails = Readonly<{
  swapDetails: readonly PerpsReviewDetailItem[];
  depositDetails: readonly PerpsReviewDetailItem[];
}>;

function formatAmount(account: AccountLike, amount: string, locale: string): string {
  const unit = getAccountCurrency(account).units[0];
  return formatCurrencyUnit(unit, parseCurrencyUnit(unit, amount), { showCode: true, locale });
}

export function getPerpsDepositReviewDetails(
  params: Pick<
    PerpsDepositReviewParams,
    "depositAccount" | "receiverAccount" | "amountSent" | "amountTo"
  >,
  options: Readonly<{
    locale: string;
    receiverAccountName: string;
    formatApproximate: (value: string) => string;
  }>,
): PerpsDepositReviewDetails {
  const amountSent = formatAmount(params.depositAccount, params.amountSent, options.locale);
  const amountReceived = options.formatApproximate(
    formatAmount(params.receiverAccount, params.amountTo, options.locale),
  );

  return {
    swapDetails: [
      {
        labelKey: "perpsReview.amountSendLabel",
        value: amountSent,
        testID: "perps-deposit-amount-sent",
      },
      {
        labelKey: "perpsReview.amountReceiveLabel",
        value: amountReceived,
        testID: "perps-deposit-amount-received",
      },
    ],
    depositDetails: [
      {
        labelKey: "perpsReview.depositAmountLabel",
        value: amountReceived,
        testID: "perps-deposit-deposited-amount",
      },
      {
        labelKey: "perpsReview.depositReceiveLabel",
        value: options.receiverAccountName,
        testID: "perps-deposit-receiver-account",
      },
    ],
  };
}
