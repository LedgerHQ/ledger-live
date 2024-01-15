import { createTransaction } from "@ledgerhq/coin-evm/createTransaction";
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
> = ({ walletApiTransaction, account }) => {
  const hasFeesProvided = areFeesProvided(walletApiTransaction);

  // We create a type 2 tx by default, and fallback to type 0 if gasPrice is provided
  const liveTx: Transaction = createTransaction(account);

  if (walletApiTransaction.nonce !== undefined) {
    liveTx.nonce = walletApiTransaction.nonce;
  }

  if (walletApiTransaction.amount) {
    liveTx.amount = walletApiTransaction.amount;
  }

  if (walletApiTransaction.recipient) {
    liveTx.recipient = walletApiTransaction.recipient;
  }

  if (walletApiTransaction.data) {
    liveTx.data = walletApiTransaction.data;
  }

  if (walletApiTransaction.gasLimit) {
    liveTx.gasLimit = walletApiTransaction.gasLimit;
    liveTx.customGasLimit = walletApiTransaction.gasLimit;
  }

  if (hasFeesProvided) {
    liveTx.feesStrategy = "custom";
  }

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
  if (walletApiTransaction.gasPrice) {
    liveTx.maxFeePerGas = undefined;
    liveTx.maxPriorityFeePerGas = undefined;
    liveTx.gasPrice = walletApiTransaction.gasPrice;
    liveTx.type = 0;
  } else {
    liveTx.gasPrice = undefined;
    liveTx.maxFeePerGas = walletApiTransaction.maxFeePerGas;
    liveTx.maxPriorityFeePerGas = walletApiTransaction.maxPriorityFeePerGas;
    liveTx.type = 2;
  }

  return liveTx;
};

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIEthereumTransaction,
  Transaction
> = ({ walletApiTransaction, account }) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction({ walletApiTransaction, account }),
    hasFeesProvided: areFeesProvided(walletApiTransaction),
  };
};

export default { getWalletAPITransactionSignFlowInfos };
