import type BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../../account";
import { formatCurrencyUnit } from "../../../currencies";
import { PERPS_WITHDRAW_HYPERLIQUID_FEE_USDC } from "./constants";
import type { WithdrawQuote } from "./quote";

export type PerpsWithdrawSummaryParams = Readonly<{
  /** The USDC amount the user withdraws, also the amount shown on the device. */
  amount: BigNumber;
  quote: WithdrawQuote;
  sourceAccount: AccountLike;
  destinationAccount: AccountLike;
  locale: string;
}>;

export type PerpsWithdrawSummary = Readonly<{
  amountSent: string;
  /** Net of every fee; shown as an estimate. */
  amountReceived: string;
  /** The payout fee in the destination asset, plus the Hyperliquid fee in USDC. */
  networkFees: string;
  /** What leaves the Perps balance: the amount plus the Hyperliquid fee. */
  totalDebited: string;
}>;

/** The withdraw summary's values, formatted with their tickers. */
export function getPerpsWithdrawSummary({
  amount,
  quote,
  sourceAccount,
  destinationAccount,
  locale,
}: PerpsWithdrawSummaryParams): PerpsWithdrawSummary {
  const sourceUnit = getAccountCurrency(sourceAccount).units[0];
  const destinationUnit = getAccountCurrency(destinationAccount).units[0];
  // Unrounded: the amount sent is also the amount shown on the device.
  const formatSource = (value: BigNumber) =>
    formatCurrencyUnit(sourceUnit, value.shiftedBy(sourceUnit.magnitude), {
      showCode: true,
      disableRounding: true,
      locale,
    });
  const formatDestination = (value: BigNumber) =>
    formatCurrencyUnit(destinationUnit, value.shiftedBy(destinationUnit.magnitude), {
      showCode: true,
      locale,
    });

  const hyperliquidFee = formatSource(PERPS_WITHDRAW_HYPERLIQUID_FEE_USDC);

  return {
    amountSent: formatSource(amount),
    amountReceived: formatDestination(quote.amountTo),
    networkFees: quote.payoutNetworkFees.isZero()
      ? hyperliquidFee
      : `${formatDestination(quote.payoutNetworkFees)} + ${hyperliquidFee}`,
    totalDebited: formatSource(amount.plus(PERPS_WITHDRAW_HYPERLIQUID_FEE_USDC)),
  };
}
