import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../types";

/**
 * Used to display the pending transaction (the original transaction being sped up or canceled) fees info in the edit flow
 */
export const getFormattedFeeFields = ({
  transaction,
  mainAccount,
  locale,
}: {
  transaction: Transaction;
  mainAccount: Account;
  locale: string;
}): {
  formattedFeeValue: string;
} => {
  const { currency } = mainAccount;
  const unit = currency.units[0];
  const feeValue = transaction.feePerByte ?? new BigNumber(0);
  const formattedFeeValue = formatCurrencyUnit(unit, feeValue, {
    showCode: true,
    locale,
  });

  return {
    formattedFeeValue,
  };
};
