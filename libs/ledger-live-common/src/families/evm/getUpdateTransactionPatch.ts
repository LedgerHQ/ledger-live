// FIXME: Rename file (and maybe break it down?)

import { getGasTracker } from "@ledgerhq/coin-evm/api/gasTracker/index";
import { getEstimatedFees } from "@ledgerhq/coin-evm/logic";
import type {
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  FeeData,
  GasOptions,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/coin-evm/types/index";
import { getAccountUnit } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { AmountRequired, ReplacementTransactionUnderpriced } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import type { Account, AccountLike, TransactionStatusCommon } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { NotEnoughNftOwned, NotOwnedNft } from "../../errors";

type EditType = "cancel" | "speedup";

const getMinLegacyFees = ({ gasPrice }: { gasPrice: BigNumber }): { gasPrice: BigNumber } => {
  const gasPriceFactor: number = getEnv("EVM_REPLACE_TX_LEGACY_GASPRICE_FACTOR");
  return {
    gasPrice: gasPrice.times(gasPriceFactor).integerValue(BigNumber.ROUND_CEIL),
  };
};

const getMinEip1559Fees = ({
  maxFeePerGas,
  maxPriorityFeePerGas,
}: {
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
}): {
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
} => {
  const maxFeePerGasFactor: number = getEnv("EVM_REPLACE_TX_EIP1559_MAXFEE_FACTOR");
  const maxPriorityFeePerGasFactor: number = getEnv("EVM_REPLACE_TX_EIP1559_MAXPRIORITYFEE_FACTOR");

  return {
    maxFeePerGas: maxFeePerGas.times(maxFeePerGasFactor).integerValue(BigNumber.ROUND_CEIL),
    maxPriorityFeePerGas: maxPriorityFeePerGas
      .times(maxPriorityFeePerGasFactor)
      .integerValue(BigNumber.ROUND_CEIL),
  };
};

export const getMinFees = ({
  transaction,
}: {
  transaction: Transaction;
}): {
  gasPrice?: BigNumber;
  maxFeePerGas?: BigNumber;
  maxPriorityFeePerGas?: BigNumber;
} => {
  if (transaction.type === 2) {
    const { maxFeePerGas, maxPriorityFeePerGas } = transaction;
    return getMinEip1559Fees({ maxFeePerGas, maxPriorityFeePerGas });
  } else {
    const { gasPrice } = transaction;
    return getMinLegacyFees({ gasPrice });
  }
};

export const hasMinimumFundsToCancel = ({
  mainAccount,
  transactionToUpdate,
}: {
  mainAccount: Account;
  transactionToUpdate: Transaction;
}): boolean => {
  const isEip1559 = transactionToUpdate.type === 2;

  const factor: number = isEip1559
    ? getEnv("EVM_REPLACE_TX_EIP1559_MAXFEE_FACTOR")
    : getEnv("EVM_REPLACE_TX_LEGACY_GASPRICE_FACTOR");

  const feeValue = getEstimatedFees(transactionToUpdate);
  return mainAccount.balance.gt(feeValue.times(factor).integerValue(BigNumber.ROUND_CEIL));
};

export const hasMinimumFundsToSpeedUp = ({
  account,
  mainAccount,
  transactionToUpdate,
}: {
  account: AccountLike;
  mainAccount: Account;
  transactionToUpdate: Transaction;
}): boolean => {
  const isEip1559 = transactionToUpdate.type === 2;

  const factor: number = isEip1559
    ? getEnv("EVM_REPLACE_TX_EIP1559_MAXFEE_FACTOR")
    : getEnv("EVM_REPLACE_TX_LEGACY_GASPRICE_FACTOR");

  const feeValue = getEstimatedFees(transactionToUpdate);
  return mainAccount.balance.gt(
    feeValue
      .times(factor)
      .plus(account.type === "Account" ? transactionToUpdate.amount : 0)
      .integerValue(BigNumber.ROUND_CEIL),
  );
};

/**
 * Can't easily and properly use generics with Partial to avoid type casting
 * when used with EvmTransactionLegacy or EvmTransactionEIP1559
 * cf. https://github.com/microsoft/TypeScript/issues/13442
 * Ideal signature would be something like:
 * getCommonSpeedUpPatch<T extends Transaction>(...): Partial<T>
 * With T being either EvmTransactionLegacy or EvmTransactionEIP1559
 */
const getCommonSpeedUpPatch = ({
  transaction,
  shouldUseFastStrategy,
  gasOptions,
}: {
  transaction: Transaction;
  shouldUseFastStrategy: boolean;
  gasOptions: GasOptions;
}): Partial<Transaction> => {
  const patch: Partial<Transaction> = {
    /**
     * Since there is multiple update transactions happening throughout the edit flow,
     * and a user can change the edit type (cancel -> speedup or speedup -> cancel),
     * within the flow, we need to make sure we use the correct values fron the original transaction
     * when creating the new tx patch
     */
    subAccountId: transaction.subAccountId,
    amount: transaction.amount,
    data: transaction.data,
    nonce: transaction.nonce,
    recipient: transaction.recipient,
    mode: transaction.mode,
    feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
    useAllAmount: false,
    gasLimit: transaction.gasLimit,
    // TODO: explain why we need to set customGasLimit (if really needed?)
    customGasLimit: transaction.gasLimit,
    /**
     * we add gasOptions to the patch to prevent `prepareTransaction` to request
     * value from a node when fast fee option is used
     * cf. https://github.com/LedgerHQ/ledger-live/blob/f03479a40eba734e1ac4ec92415fe139b3b7eee6/libs/coin-evm/src/prepareTransaction.ts#L200-L201
     */
    gasOptions,
  };

  return patch;
};

/**
 * Can't easily and properly use generics with Partial to avoid type casting
 * when used with EvmTransactionLegacy or EvmTransactionEIP1559
 * cf. https://github.com/microsoft/TypeScript/issues/13442
 * Ideal signature would be something like:
 * getCommonCancelPatch<T extends Transaction>(...): Partial<T>
 * With T being either EvmTransactionLegacy or EvmTransactionEIP1559
 */
const getCommonCancelPatch = ({
  transaction,
  shouldUseFastStrategy,
  freshAddress,
  gasOptions,
}: {
  transaction: Transaction;
  shouldUseFastStrategy: boolean;
  freshAddress: string;
  gasOptions: GasOptions;
}): Partial<Transaction> => {
  const patch: Partial<Transaction> = {
    amount: new BigNumber(0),
    // removing the subAccountId to transform a token tx to main coin tx
    subAccountId: undefined,
    data: undefined,
    nonce: transaction.nonce,
    mode: "send",
    recipient: freshAddress,
    feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
    useAllAmount: false,
    gasLimit: transaction.gasLimit,
    // TODO: explain why we need to set customGasLimit (if really needed?)
    customGasLimit: transaction.gasLimit,
    /**
     * we add gasOptions to the patch to prevent `prepareTransaction` to request
     * value from a node when fast fee option is used
     * cf. https://github.com/LedgerHQ/ledger-live/blob/f03479a40eba734e1ac4ec92415fe139b3b7eee6/libs/coin-evm/src/prepareTransaction.ts#L200-L201
     */
    gasOptions,
  };

  return patch;
};

const getLegacyPatch = ({
  transaction,
  gasOptions,
  editType,
  account,
}: {
  transaction: EvmTransactionLegacy;
  gasOptions: GasOptions;
  editType: EditType;
  account: Account;
}): Partial<EvmTransactionLegacy> => {
  const { gasPrice } = gasOptions.fast;

  if (!gasPrice) {
    throw new Error("gasPrice is required");
  }

  const { gasPrice: minNewGasPrice } = getMinLegacyFees({ gasPrice: transaction.gasPrice });

  const newGasPrice = BigNumber.max(minNewGasPrice, gasPrice);

  const shouldUseFastStrategy = newGasPrice.isEqualTo(gasPrice);

  if (editType === "speedup") {
    const patch: Partial<EvmTransactionLegacy> = {
      ...(getCommonSpeedUpPatch({
        transaction,
        shouldUseFastStrategy,
        gasOptions,
      }) as Partial<EvmTransactionLegacy>),
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
      gasPrice: newGasPrice,
    };

    return patch;
  }

  const patch: Partial<EvmTransactionLegacy> = {
    ...(getCommonCancelPatch({
      transaction,
      shouldUseFastStrategy,
      freshAddress: account.freshAddress,
      gasOptions,
    }) as Partial<EvmTransactionLegacy>),
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
    gasPrice: newGasPrice,
  };

  return patch;
};

const getEip1559Patch = ({
  transaction,
  gasOptions,
  editType,
  account,
}: {
  transaction: EvmTransactionEIP1559;
  gasOptions: GasOptions;
  editType: EditType;
  account: Account;
}): Partial<EvmTransactionEIP1559> => {
  const { maxFeePerGas, maxPriorityFeePerGas } = gasOptions.fast;

  if (!maxFeePerGas) {
    throw new Error("maxFeePerGas is required");
  }

  if (!maxPriorityFeePerGas) {
    throw new Error("maxPriorityFeePerGas is required");
  }

  const { maxFeePerGas: minNewMaxFeePerGas, maxPriorityFeePerGas: minNewMaxPriorityFeePerGas } =
    getMinEip1559Fees({
      maxFeePerGas: transaction.maxFeePerGas,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
    });

  const newMaxFeePerGas = BigNumber.max(minNewMaxFeePerGas, maxFeePerGas);
  const newMaxPriorityFeePerGas = BigNumber.max(minNewMaxPriorityFeePerGas, maxPriorityFeePerGas);

  const shouldUseFastStrategy =
    newMaxFeePerGas.isEqualTo(maxFeePerGas) &&
    newMaxPriorityFeePerGas.isEqualTo(maxPriorityFeePerGas);

  if (editType === "speedup") {
    const patch: Partial<EvmTransactionEIP1559> = {
      ...(getCommonSpeedUpPatch({
        transaction,
        shouldUseFastStrategy,
        gasOptions,
      }) as Partial<EvmTransactionEIP1559>),
      maxFeePerGas: newMaxFeePerGas,
      maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      gasPrice: undefined,
    };

    return patch;
  }

  const patch: Partial<EvmTransactionEIP1559> = {
    ...(getCommonCancelPatch({
      transaction,
      shouldUseFastStrategy,
      freshAddress: account.freshAddress,
      gasOptions,
    }) as Partial<EvmTransactionEIP1559>),
    maxFeePerGas: newMaxFeePerGas,
    maxPriorityFeePerGas: newMaxPriorityFeePerGas,
    gasPrice: undefined,
  };

  return patch;
};

// FIXME: add tests
export const getEditTransactionPatch = async ({
  editType,
  transaction,
  account,
}: {
  editType: EditType;
  transaction: Transaction;
  account: Account;
}): Promise<Partial<Transaction>> => {
  const { currency } = account;
  const gasTracker = getGasTracker(currency);

  if (!gasTracker) {
    throw new Error(`No gas tracker found for currency ${currency.id}`);
  }

  const shouldUseEip1559 = transaction.type === 2;

  const gasOptions = await gasTracker.getGasOptions({
    currency,
    options: { useEIP1559: shouldUseEip1559 },
  });

  return shouldUseEip1559
    ? getEip1559Patch({ transaction, gasOptions, editType, account })
    : getLegacyPatch({ transaction, gasOptions, editType, account });
};

type ValidatedTransactionFields = "replacementTransactionUnderpriced";
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

/**
 * Validate an edited transaction and returns related errors and warnings
 * Makes sure the updated fees are at least 10% higher than the original fees
 * 10% isn't defined in the protocol, it's just how most nodes & miners implement it
 * If the new transaction fees are less than 10% higher than the original fees,
 * the transaction will be rejected by the network with a
 * "replacement transaction underpriced" error
 */
const validateEditTransaction = ({
  editType,
  transaction,
  transactionToUpdate,
}: {
  transaction: Transaction;
  transactionToUpdate: Transaction;
  editType?: EditType;
}): {
  errors: TransactionStatusCommon["errors"];
  warnings: TransactionStatusCommon["warnings"];
} => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  if (!editType) {
    return {
      errors: {},
      warnings: {},
    };
  }

  const { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = transactionToUpdate;
  const {
    maxFeePerGas: newMaxFeePerGas,
    maxPriorityFeePerGas: newMaxPriorityFeePerGas,
    gasPrice: newGasPrice,
  } = transaction;

  if (transaction.type === 2) {
    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      throw new Error("maxFeePerGas and maxPriorityFeePerGas are required");
    }

    if (!newMaxFeePerGas || !newMaxPriorityFeePerGas) {
      // This should already be handled in getTransactionStatus
      return {
        errors: {},
        warnings: {},
      };
    }

    const { maxFeePerGas: minNewMaxFeePerGas, maxPriorityFeePerGas: minNewMaxPriorityFeePerGas } =
      getMinEip1559Fees({ maxFeePerGas, maxPriorityFeePerGas });

    if (
      newMaxFeePerGas.isLessThan(minNewMaxFeePerGas) ||
      newMaxPriorityFeePerGas.isLessThan(minNewMaxPriorityFeePerGas)
    ) {
      errors.replacementTransactionUnderpriced = new ReplacementTransactionUnderpriced();

      return {
        errors,
        warnings,
      };
    }
  } else {
    if (!gasPrice) {
      throw new Error("gasPrice is required");
    }

    if (!newGasPrice) {
      // This should already be handled in getTransactionStatus
      return {
        errors: {},
        warnings: {},
      };
    }

    const { gasPrice: minNewGasPrice } = getMinLegacyFees({ gasPrice });

    if (newGasPrice.isLessThan(minNewGasPrice)) {
      errors.replacementTransactionUnderpriced = new ReplacementTransactionUnderpriced();

      return {
        errors,
        warnings,
      };
    }
  }

  return {
    errors: {},
    warnings: {},
  };
};

const ERROR_NOT_ENOUGH_NFT_OWNED = new NotEnoughNftOwned();
const ERROR_NOT_OWNED_NFT = new NotOwnedNft();
const ERROR_AMOUNT_REQUIRED = new AmountRequired();

// NOTE: this logic should ideally be done in getTransactionStatus if possible
// (not sure it is)
export const getEditTransactionStatus = ({
  transaction,
  transactionToUpdate,
  status,
  editType,
}: {
  transaction: Transaction;
  transactionToUpdate: Transaction;
  status: TransactionStatus;
  editType?: EditType;
}): TransactionStatus => {
  const { errors: editTxErrors } = validateEditTransaction({
    editType,
    transaction,
    transactionToUpdate,
  });

  const errors: Record<string, Error> = { ...status.errors, ...editTxErrors };

  // copy errors object to avoid mutating the original one
  const updatedErrors: Record<string, Error> = { ...errors };

  // discard "AmountRequired" (for cancel and speedup since one can decide to speedup a cancel)
  // exclude "NotOwnedNft" and "NotEnoughNftOwned" error if it's a nft operation
  // since nfts being sent are not owned by the user anymore (removed from the account)
  // cf. this (as of 14-09-2023) https://github.com/LedgerHQ/ledger-live/blob/73217c9aa93c901d9c8d2067dcc7090243d35d35/libs/coin-evm/src/synchronization.ts#L111-L120
  if (
    updatedErrors.amount &&
    (updatedErrors.amount.name === ERROR_NOT_OWNED_NFT.name ||
      updatedErrors.amount.name === ERROR_NOT_ENOUGH_NFT_OWNED.name ||
      updatedErrors.amount.name === ERROR_AMOUNT_REQUIRED.name)
  ) {
    delete updatedErrors.amount;
  }

  const updatedStatus: TransactionStatus = {
    ...status,
    errors: updatedErrors,
  };

  return updatedStatus;
};

export const isStrategyDisabled = ({
  isEIP1559,
  feeData,
  minFees,
}: {
  isEIP1559: boolean;
  feeData: FeeData;
  minFees?: {
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
    gasPrice?: BigNumber;
  };
}): boolean => {
  if (!minFees) {
    return false;
  }

  if (isEIP1559) {
    if (
      !feeData.maxFeePerGas ||
      !feeData.maxPriorityFeePerGas ||
      !minFees.maxFeePerGas ||
      !minFees.maxPriorityFeePerGas
    ) {
      return false;
    }

    return (
      feeData.maxFeePerGas.isLessThan(minFees.maxFeePerGas) ||
      feeData.maxPriorityFeePerGas.isLessThan(minFees.maxPriorityFeePerGas)
    );
  } else {
    if (!feeData.gasPrice || !minFees.gasPrice) {
      return false;
    }

    return feeData.gasPrice.isLessThan(minFees.gasPrice);
  }
};

/**
 * Used to display the pending transaction fees info in the edit flow
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
