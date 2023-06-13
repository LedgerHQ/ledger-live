import { EthereumTransaction as WalletAPIEthereumTransaction } from "@ledgerhq/wallet-api-core";
import { Account } from "@ledgerhq/types-live";
import { Transaction as EvmTx } from "@ledgerhq/coin-evm/types";
import {
  AreFeesProvided,
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import { Transaction as EthTx } from "./types";
import { isTokenAccount } from "../../account";

const CAN_EDIT_FEES = true;

type Transaction = EthTx | EvmTx;

const areFeesProvided: AreFeesProvided<WalletAPIEthereumTransaction> = tx =>
  !!((tx.gasLimit && tx.gasPrice) || (tx.gasLimit && tx.maxFeePerGas && tx.maxPriorityFeePerGas));

const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPIEthereumTransaction,
  Transaction
> = ({ tx, account, parentAccount }) => {
  const hasFeesProvided = areFeesProvided(tx);

  const accountFamily = isTokenAccount(account)
    ? (parentAccount as Account).currency.family
    : account.currency.family;
  const { gasLimit, ...restTx } = tx;

  const liveTx: Partial<Transaction> =
    accountFamily === "ethereum"
      ? {
          ...restTx,
          userGasLimit: gasLimit,
        }
      : convertToEvmLiveTransaction(tx);

  return hasFeesProvided ? { ...liveTx, feesStrategy: "custom" } : liveTx;
};

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIEthereumTransaction,
  Transaction
> = params => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction(params),
    hasFeesProvided: areFeesProvided(params.tx),
  };
};

export default { getWalletAPITransactionSignFlowInfos };

function convertToEvmLiveTransaction(tx: WalletAPIEthereumTransaction): Partial<EvmTx> {
  const params = {
    family: "evm" as const,
    nonce: tx.nonce,
    amount: tx.amount,
    recipient: tx.recipient,
    data: tx.data,
    gasLimit: tx.gasLimit,
  };

  return tx.maxPriorityFeePerGas || tx.maxFeePerGas
    ? {
        ...params,
        type: 2,
      }
    : { ...params, type: 0 };
}
