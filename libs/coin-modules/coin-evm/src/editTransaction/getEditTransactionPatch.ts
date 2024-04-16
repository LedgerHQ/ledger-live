import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { getGasTracker } from "../api/gasTracker/index";
import type {
  EditType,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  GasOptions,
  Transaction,
} from "../types/index";
import { getMinEip1559Fees, getMinLegacyFees } from "./getMinEditTransactionFees";

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
    // removing the data to transform a contract tx to a simple send tx
    data: undefined,
    nonce: transaction.nonce,
    mode: "send",
    recipient: freshAddress,
    feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
    useAllAmount: false,
    gasLimit: transaction.gasLimit,
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
  const fastFeeData = gasOptions.fast;

  invariant(fastFeeData.gasPrice, "gasOptions.fast.gasPrice is required");

  // we get the minimum possible fees values needed to update the transaction
  const { gasPrice: minGasPrice } = getMinLegacyFees({ gasPrice: transaction.gasPrice });

  /**
   * Depending on the current network conditions, the minimum fees values might
   * not be enought to properly update the transaction. The updated fees might
   * still be lower than the current network fees.
   * To prevent this, which would lead to an updated transaction still being stuck,
   * we use the maximum between the minimum fees values and the current network fees,
   * as a default value.
   */
  const gasPrice = BigNumber.max(minGasPrice, fastFeeData.gasPrice);

  const shouldUseFastStrategy = gasPrice.isEqualTo(fastFeeData.gasPrice);

  if (editType === "speedup") {
    const patch: Partial<EvmTransactionLegacy> = {
      ...(getCommonSpeedUpPatch({
        transaction,
        shouldUseFastStrategy,
        gasOptions,
      }) as Partial<EvmTransactionLegacy>),
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
      gasPrice,
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
    gasPrice,
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
  const fastFeeData = gasOptions.fast;

  invariant(fastFeeData.maxFeePerGas, "gasOptions.fast.maxFeePerGas is required");
  invariant(fastFeeData.maxPriorityFeePerGas, "gasOptions.fast.maxPriorityFeePerGas is required");

  // we get the minimum possible fees values needed to update the transaction
  const { maxFeePerGas: minMaxFeePerGas, maxPriorityFeePerGas: minMaxPriorityFeePerGas } =
    getMinEip1559Fees({
      maxFeePerGas: transaction.maxFeePerGas,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
    });

  /**
   * Depending on the current network conditions, the minimum fees values might
   * not be enought to properly update the transaction. The updated fees might
   * still be lower than the current network fees.
   * To prevent this, which would lead to an updated transaction still being stuck,
   * we use the maximum between the minimum fees values and the current network fees,
   * as a default value.
   */
  const maxFeePerGas = BigNumber.max(minMaxFeePerGas, fastFeeData.maxFeePerGas);
  const maxPriorityFeePerGas = BigNumber.max(
    minMaxPriorityFeePerGas,
    fastFeeData.maxPriorityFeePerGas,
  );

  const shouldUseFastStrategy =
    maxFeePerGas.isEqualTo(fastFeeData.maxFeePerGas) &&
    maxPriorityFeePerGas.isEqualTo(fastFeeData.maxPriorityFeePerGas);

  if (editType === "speedup") {
    const patch: Partial<EvmTransactionEIP1559> = {
      ...(getCommonSpeedUpPatch({
        transaction,
        shouldUseFastStrategy,
        gasOptions,
      }) as Partial<EvmTransactionEIP1559>),
      maxFeePerGas,
      maxPriorityFeePerGas,
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
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasPrice: undefined,
  };

  return patch;
};

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
