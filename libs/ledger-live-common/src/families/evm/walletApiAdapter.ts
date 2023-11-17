import { DEFAULT_NONCE } from "@ledgerhq/coin-evm/createTransaction";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import { EthereumTransaction as WalletAPIEthereumTransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPIEthereumTransaction> = tx =>
  !!((tx.gasLimit && tx.gasPrice) || (tx.gasLimit && tx.maxFeePerGas && tx.maxPriorityFeePerGas));

const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPIEthereumTransaction,
  Transaction
> = tx => {
  const hasFeesProvided = areFeesProvided(tx);

  const params: Partial<Transaction> = {
    family: "evm" as const,
    nonce: tx.nonce === undefined ? DEFAULT_NONCE : tx.nonce,
    amount: tx.amount,
    recipient: tx.recipient,
    data: tx.data,
    gasLimit: tx.gasLimit,
    feesStrategy: hasFeesProvided ? ("custom" as const) : ("medium" as const),
    customGasLimit: tx.gasLimit,
  };

  // We create a type 2 tx by default, and fallback to type 0 if gasPrice is provided

  /**
   * We explicitly set unrelated type specific fields to undefined to avoid transaction
   * type assertion errors during the `prepareTransaction` logic (libs/coin-evm/src/prepareTransaction.ts)
   * when performing an `updateTransaction` with a newly created tx
   * Which is what happen in this case (in apps/ledger-live-desktop/src/renderer/modals/SignTransaction/Body.tsx):
      // `createTransaction` will create a type 2 tx by default with `maxFeePerGas` and `maxPriorityFeePerGas` set to 0
      const tx = bridge.createTransaction(account);
      const { recipient, ...txData } = transactionData;
      const tx2 = bridge.updateTransaction(tx, {
        recipient,
        subAccountId: isTokenAccount(account) ? account.id : undefined,
      });
      // `transaction` will be of type 2 here if `maxFeePerGas` and `maxPriorityFeePerGas` are not undefined
      const transaction = bridge.updateTransaction(tx2, txData);
   */

  const liveTx: Partial<Transaction> = tx.gasPrice
    ? {
        ...params,
        gasPrice: tx.gasPrice,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        type: 0,
      }
    : {
        ...params,
        gasPrice: undefined,
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        type: 2,
      };

  return liveTx;
};

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIEthereumTransaction,
  Transaction
> = tx => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction(tx),
    hasFeesProvided: areFeesProvided(tx),
  };
};

export default { getWalletAPITransactionSignFlowInfos };
