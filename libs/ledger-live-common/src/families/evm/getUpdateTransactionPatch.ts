// TODO: move to coin-evm

import { getGasTracker } from "@ledgerhq/coin-evm/api/gasTracker/index";
import { DEFAULT_GAS_LIMIT } from "@ledgerhq/coin-evm/transaction";
import type {
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  FeeData,
  Transaction,
} from "@ledgerhq/coin-evm/types/index";
import { ReplacementTransactionUnderpriced } from "@ledgerhq/errors";
import type { Account, TransactionStatusCommon } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

type EditType = "cancel" | "speedup";

// build the appropriate patch for cancel flow depending on the transaction type
// const buildCancelTxPatch = ({
//   transaction,
//   account,
// }: {
//   transaction: Transaction;
//   account: Account;
// }): Partial<Transaction> => {
//   let patch: Partial<Transaction> = {
//     type: transaction.type,
//     amount: new BigNumber(0),
//     data: undefined,
//     nonce: transaction.nonce,
//     mode: "send",
//     recipient: account.freshAddress,
//     feesStrategy: "custom",
//     useAllAmount: false,
//     /**
//      * since canceling a tx is just sending 0 eth to yourself, the gasLimit can
//      * just be the default value
//      */
//     gasLimit: DEFAULT_GAS_LIMIT,
//   };

//   // increase gas fees in case of cancel flow as we don't have the fees input screen for cancel flow
//   if (patch.type === 2) {
//     const type2Patch: Partial<EvmTransactionEIP1559> = {
//       ...patch,
//       maxFeePerGas: transaction.maxFeePerGas?.times(1.1).integerValue(BigNumber.ROUND_CEIL),
//       maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
//         ?.times(1.1)
//         .integerValue(BigNumber.ROUND_CEIL),
//     };
//     patch = type2Patch;
//   } else if (patch.type === 1 || patch.type === 0) {
//     const type1Patch: Partial<EvmTransactionLegacy> = {
//       ...patch,
//       gasPrice: transaction.gasPrice?.times(1.1).integerValue(BigNumber.ROUND_CEIL),
//     };
//     patch = type1Patch;
//   }

//   return patch;
// };

// const buildSpeedupTxPatch = ({}: {}): Partial<Transaction> => {};

// ------------------->

// const getCommonSpeedupPatch = ({
//   transaction,
//   shouldUseFastStrategy,
// }: {
//   transaction: Transaction;
//   shouldUseFastStrategy: boolean;
// }): Partial<Transaction> => {
//   const patch: Partial<Transaction> = {
//     amount: transaction.amount,
//     data: transaction.data,
//     nonce: transaction.nonce,
//     recipient: transaction.recipient,
//     mode: transaction.mode,
//     feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
//     useAllAmount: false,
//   };

//   return patch;
// };

// const getCommonCancelPatch = ({
//   transaction,
//   shouldUseFastStrategy,
//   freshAddress,
// }: {
//   transaction: Transaction;
//   shouldUseFastStrategy: boolean;
//   freshAddress: string;
// }): Partial<Transaction> => {
//   const patch: Partial<Transaction> = {
//     amount: new BigNumber(0),
//     data: undefined,
//     nonce: transaction.nonce,
//     mode: "send",
//     recipient: freshAddress,
//     feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
//     useAllAmount: false,
//   };

//   return patch;
// };

// ------------------->

// FIXME: add tests

const getLegacyPatch = ({
  transaction,
  feeData,
  editType,
  account,
}: {
  transaction: EvmTransactionLegacy;
  feeData: FeeData;
  editType: EditType;
  account: Account;
}): Partial<EvmTransactionLegacy> => {
  const { gasPrice } = feeData;

  if (!gasPrice) {
    throw new Error("gasPrice is required");
  }

  const minNewGasPrice = transaction.gasPrice.times(1.1).integerValue(BigNumber.ROUND_CEIL);
  const newGasPrice = BigNumber.max(minNewGasPrice, gasPrice);

  const shouldUseFastStrategy = newGasPrice.isEqualTo(gasPrice);

  if (editType === "speedup") {
    const patch: Partial<EvmTransactionLegacy> = {
      amount: transaction.amount,
      data: transaction.data,
      nonce: transaction.nonce,
      recipient: transaction.recipient,
      mode: transaction.mode,
      feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
      useAllAmount: false,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
      gasPrice: newGasPrice,
    };

    return patch;
  }

  const patch: Partial<EvmTransactionLegacy> = {
    amount: new BigNumber(0),
    data: undefined,
    nonce: transaction.nonce,
    mode: "send",
    recipient: account.freshAddress,
    feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
    gasPrice: newGasPrice,
    useAllAmount: false,
    /**
     * since canceling a tx is just sending 0 eth to yourself, the gasLimit can
     * just be the default value
     */
    gasLimit: DEFAULT_GAS_LIMIT,
  };

  return patch;
};

const getEip1559Patch = ({
  transaction,
  feeData,
  editType,
  account,
}: {
  transaction: EvmTransactionEIP1559;
  feeData: FeeData;
  editType: EditType;
  account: Account;
}): Partial<EvmTransactionEIP1559> => {
  const { maxFeePerGas, maxPriorityFeePerGas } = feeData;

  if (!maxFeePerGas) {
    throw new Error("maxFeePerGas is required");
  }

  if (!maxPriorityFeePerGas) {
    throw new Error("maxPriorityFeePerGas is required");
  }

  const minNewMaxFeePerGas = transaction.maxFeePerGas.times(1.1).integerValue(BigNumber.ROUND_CEIL);
  const minNewMaxPriorityFeePerGas = transaction.maxPriorityFeePerGas
    .times(1.1)
    .integerValue(BigNumber.ROUND_CEIL);

  const newMaxFeePerGas = BigNumber.max(minNewMaxFeePerGas, maxFeePerGas);
  const newMaxPriorityFeePerGas = BigNumber.max(minNewMaxPriorityFeePerGas, maxPriorityFeePerGas);

  const shouldUseFastStrategy =
    newMaxFeePerGas.isEqualTo(maxFeePerGas) &&
    newMaxPriorityFeePerGas.isEqualTo(maxPriorityFeePerGas);

  if (editType === "speedup") {
    const patch: Partial<EvmTransactionEIP1559> = {
      amount: transaction.amount,
      data: transaction.data,
      nonce: transaction.nonce,
      recipient: transaction.recipient,
      mode: transaction.mode,
      feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
      maxFeePerGas: newMaxFeePerGas,
      maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      gasPrice: undefined,
      useAllAmount: false,
    };

    return patch;
  }

  const patch: Partial<EvmTransactionEIP1559> = {
    amount: new BigNumber(0),
    data: undefined,
    nonce: transaction.nonce,
    mode: "send",
    recipient: account.freshAddress,
    feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
    maxFeePerGas: newMaxFeePerGas,
    maxPriorityFeePerGas: newMaxPriorityFeePerGas,
    gasPrice: undefined,
    useAllAmount: false,
    /**
     * since canceling a tx is just sending 0 eth to yourself, the gasLimit can
     * just be the default value
     */
    gasLimit: DEFAULT_GAS_LIMIT,
  };

  return patch;
};

export const getUpdateTransactionPatch = async ({
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

  const { fast } = await gasTracker.getGasOptions({
    currency,
    options: { useEIP1559: shouldUseEip1559 },
  });

  return shouldUseEip1559
    ? getEip1559Patch({ transaction, feeData: fast, editType, account })
    : getLegacyPatch({ transaction, feeData: fast, editType, account });
};

type ValidatedTransactionFields = "replacementTransactionUnderpriced";
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

export const validateUpdateTransaction = ({
  editType,
  transaction,
  transactionToUpdate,
}: {
  editType: EditType;
  transaction: Transaction;
  transactionToUpdate: Transaction;
}): {
  errors: TransactionStatusCommon["errors"];
  warnings: TransactionStatusCommon["warnings"];
} => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  console.log("validateUpdateTransaction", { editType, transaction, transactionToUpdate });

  if (editType === "speedup") {
    // FIXME: check new fees > old fees
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
    const minNewMaxFeePerGas = maxFeePerGas.times(1.1).integerValue(BigNumber.ROUND_CEIL);
    const minNewMaxPriorityFeePerGas = maxPriorityFeePerGas
      .times(1.1)
      .integerValue(BigNumber.ROUND_CEIL);

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

    const minNewGasPrice = gasPrice.times(1.1).integerValue(BigNumber.ROUND_CEIL);

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
