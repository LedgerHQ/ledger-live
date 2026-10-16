import BigNumber from "bignumber.js";
import { PERPS_WITHDRAW_HYPERLIQUID_FEE_USDC } from "./constants";

export type WithdrawAmountError = "insufficientBalance";

export function getWithdrawMaxAmount(availableBalance: BigNumber): BigNumber {
  return BigNumber.max(availableBalance.minus(PERPS_WITHDRAW_HYPERLIQUID_FEE_USDC), 0);
}

export function validateWithdrawAmount({
  amount,
  availableBalance,
}: {
  amount: BigNumber;
  availableBalance: BigNumber;
}): WithdrawAmountError | null {
  if (amount.isZero()) return null;
  return amount.plus(PERPS_WITHDRAW_HYPERLIQUID_FEE_USDC).isGreaterThan(availableBalance)
    ? "insufficientBalance"
    : null;
}
