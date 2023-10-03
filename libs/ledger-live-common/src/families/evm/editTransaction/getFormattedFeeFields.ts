import { getEstimatedFees } from "@ledgerhq/coin-evm/logic";
import type { Transaction } from "@ledgerhq/coin-evm/types/index";
import { getAccountUnit } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

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
  const feeValue = getEstimatedFees(transaction);
  const formattedFeeValue = formatCurrencyUnit(getAccountUnit(mainAccount), feeValue, {
    showCode: true,
    locale,
  });

  const { currency } = mainAccount;
  const gweiUnit = currency.units[1];

  const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas ?? new BigNumber(0);
  const formattedMaxPriorityFeePerGas = formatCurrencyUnit(gweiUnit, maxPriorityFeePerGas, {
    showCode: true,
    locale,
  });

  const maxFeePerGas = transaction.maxFeePerGas ?? new BigNumber(0);
  const formattedMaxFeePerGas = formatCurrencyUnit(gweiUnit, maxFeePerGas, {
    showCode: true,
    locale,
  });

  const gasPrice = transaction.gasPrice ?? new BigNumber(0);
  const formattedGasPrice = formatCurrencyUnit(gweiUnit, gasPrice, {
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
