import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../types/index";
import { getEstimatedFees } from "../utils";

/**
 * Used to display the pending transaction (the original transaction being sped
 * up or canceled) fees info in the edit flow
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
  formattedMaxPriorityFeePerGas: string;
  formattedMaxFeePerGas: string;
  formattedGasPrice: string;
} => {
  const { currency } = mainAccount;
  const unit = currency.units[0];
  const feeValue = getEstimatedFees(transaction);
  const formattedFeeValue = formatCurrencyUnit(unit, feeValue, {
    showCode: true,
    locale,
  });

  // If a lower unit is available, use it to display the fees (e.g. ETH -> GWEI)
  // This might not be the case for all currencies, so we fallback to the general unit
  const feesUnit = currency.units.length > 1 ? currency.units[1] : unit;

  const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas ?? new BigNumber(0);
  const formattedMaxPriorityFeePerGas = formatCurrencyUnit(feesUnit, maxPriorityFeePerGas, {
    showCode: true,
    locale,
  });

  const maxFeePerGas = transaction.maxFeePerGas ?? new BigNumber(0);
  const formattedMaxFeePerGas = formatCurrencyUnit(feesUnit, maxFeePerGas, {
    showCode: true,
    locale,
  });

  const gasPrice = transaction.gasPrice ?? new BigNumber(0);
  const formattedGasPrice = formatCurrencyUnit(feesUnit, gasPrice, {
    showCode: true,
    locale,
  });

  return {
    formattedFeeValue,
    formattedMaxPriorityFeePerGas,
    formattedMaxFeePerGas,
    formattedGasPrice,
  };
};
