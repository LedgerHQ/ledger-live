import {
  InvalidAddress,
  ETHAddressNonEIP,
  RecipientRequired,
} from "@ledgerhq/errors";
import {
  FeeNotLoaded,
  FeeRequired,
  GasLessThanEstimate,
  PriorityFeeHigherThanMaxFee,
  NotEnoughGas,
  PriorityFeeTooHigh,
  PriorityFeeTooLow,
  MaxFeeTooLow,
} from "@ledgerhq/errors";
import eip55 from "eip55";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountBridge, TransactionStatusCommon } from "@ledgerhq/types-live";
import { EIP1559ShouldBeUsed, getGasLimit } from "./transaction";
import { Transaction, TransactionStatus } from "./types";
import { isEthereumAddress } from "./logic";
import { getEnv } from "../../env";
import { modes } from "./modules";

type TransactionErrors = {
  gasPrice?: Error;
  maxFee?: Error;
  maxPriorityFee?: Error;
  gasLimit?: Error;
  recipient?: Error;
};

type TransactionWarnings = {
  maxFee?: Error;
  maxPriorityFee?: Error;
  gasLimit?: Error;
};

const isRecipientValid = (
  currency: CryptoCurrency,
  recipient: string,
  isFullLower: boolean,
  isFullUpper: boolean
): boolean => {
  if (!isEthereumAddress(recipient)) return false;
  // To handle non-eip55 addresses we stop validation here if we detect
  // address is either full upper or full lower.
  // see https://github.com/LedgerHQ/ledger-live-desktop/issues/1397
  if (isFullUpper || isFullLower) return true;

  try {
    return eip55.verify(recipient);
  } catch (error) {
    return false;
  }
};

const validateRecipient = (
  currency: CryptoCurrency,
  recipient: string,
  { errors, warnings }: TransactionStatus
): void => {
  const slice = recipient.substr(2);
  const isFullLower = slice === slice.toLowerCase();
  const isFullUpper = slice === slice.toUpperCase();

  if (!recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (!isRecipientValid(currency, recipient, isFullLower, isFullUpper)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: currency.name,
    });
  } else if (isFullUpper || isFullLower) {
    // Address is not respecting the EIP-55 checksum
    warnings.recipient = new ETHAddressNonEIP();
  }
};

const validateLegacyGas = (
  currency: CryptoCurrency,
  tx: Transaction,
  { errors }: TransactionStatus
): void => {
  if (!tx.gasPrice) {
    errors.gasPrice = new FeeNotLoaded();
  }
};

const validateEIP1559Gas = (
  currency: CryptoCurrency,
  tx: Transaction,
  { errors, warnings }: TransactionStatus
): void => {
  // Minimal estimation is next base fee + the minimal priority fee
  const networkMinimumGasEstimation = tx.networkInfo?.nextBaseFeePerGas?.plus(
    tx.networkInfo?.maxPriorityFeePerGas?.min || 0
  );

  if (!tx.maxFeePerGas) {
    errors.maxFee = new FeeNotLoaded();
  } else if (tx.maxFeePerGas.isEqualTo(0)) {
    errors.maxFee = new FeeRequired();
  } else if (tx.maxFeePerGas.lt(networkMinimumGasEstimation || 0)) {
    warnings.maxFee = new MaxFeeTooLow();
  }

  const shouldGateMinimumPriorityFee = getEnv("EIP1559_MINIMUM_FEES_GATE");
  const minimunPriorityFee = tx?.networkInfo?.maxPriorityFeePerGas?.min?.times(
    getEnv("EIP1559_PRIORITY_FEE_LOWER_GATE")
  );
  const maximalPriorityFee = tx?.networkInfo?.maxPriorityFeePerGas?.max;

  if (!tx.maxPriorityFeePerGas) {
    errors.maxPriorityFee = new FeeNotLoaded();
  } else if (tx.maxPriorityFeePerGas.isEqualTo(0)) {
    errors.maxPriorityFee = new FeeRequired();
  } else if (tx.maxPriorityFeePerGas?.isGreaterThan(tx.maxFeePerGas || 0)) {
    // priority fee is more than max fee (total fee for the transaction) which doesn't make sense
    errors.maxPriorityFee = new PriorityFeeHigherThanMaxFee();
  } else if (
    shouldGateMinimumPriorityFee &&
    tx.maxPriorityFeePerGas.lt(minimunPriorityFee || 0)
  ) {
    // Don't send a transaction with a priority fee more than X % (default is 15%) inferior to network conditions
    // With a low enough priority fee, your transaction might get stuck forever since you can't cancel or boost tx in the live
    errors.maxPriorityFee = new PriorityFeeTooLow();
  } else if (tx.maxPriorityFeePerGas.gt(maximalPriorityFee || 0)) {
    warnings.maxPriorityFee = new PriorityFeeTooHigh();
  }
};

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] =
  (account, tx) => {
    const gasLimit = getGasLimit(tx);
    const estimatedGasPrice = EIP1559ShouldBeUsed(account.currency)
      ? tx.maxFeePerGas || new BigNumber(0)
      : tx.gasPrice;
    const estimatedFees = (estimatedGasPrice || new BigNumber(0)).times(
      gasLimit
    );

    const errors: TransactionErrors = {};
    const warnings: TransactionWarnings = {};
    const status: TransactionStatusCommon = {
      errors,
      warnings,
      estimatedFees,
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    };

    validateRecipient(account.currency, tx.recipient, status);

    const mode = modes[tx.mode];
    invariant(mode, "missing module for mode=" + tx.mode);
    mode.fillTransactionStatus(account, tx, status);

    if (EIP1559ShouldBeUsed(account.currency)) {
      validateEIP1559Gas(account.currency, tx, status);
    } else {
      validateLegacyGas(account.currency, tx, status);
    }

    if (gasLimit.eq(0)) {
      errors.gasLimit = new FeeRequired();
    } else if (!errors.recipient) {
      if (estimatedFees.gt(account.balance)) {
        errors.gasPrice = new NotEnoughGas();
      }
    }

    if (tx.estimatedGasLimit && gasLimit.lt(tx.estimatedGasLimit)) {
      warnings.gasLimit = new GasLessThanEstimate();
    }

    return Promise.resolve(status);
  };

export default getTransactionStatus;
