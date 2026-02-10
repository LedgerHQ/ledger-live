import { Account } from "@ledgerhq/types-live";
import { IGasLimit, INetworkConfig, INonce } from "@multiversx/sdk-core";
import { getAccountNonce, getNetworkConfig } from "./api";
import {
  GAS_PRICE,
  TRANSACTION_OPTIONS_TX_HASH_SIGN,
  TRANSACTION_VERSION_DEFAULT,
} from "./constants";
import { isAmountSpentFromBalance } from "./logic";
import type { MultiversXProtocolTransaction, Transaction } from "./types";

/**
 *
 * @param {MultiversXAccount} account
 * @param {SubAccount | null | undefined} tokenAccount
 * @param {Transaction} transaction
 */
export const buildTransactionToSign = async (
  account: Account,
  transaction: Transaction,
): Promise<string> => {
  const sender = account.freshAddress;
  const nonce = await getAccountNonce(sender);
  const networkConfig: INetworkConfig = await getNetworkConfig();
  const chainID = networkConfig.ChainID.valueOf();

  const isTokenAccount = account.subAccounts?.some(ta => ta.id === transaction.subAccountId);
  const value =
    !isTokenAccount && isAmountSpentFromBalance(transaction.mode)
      ? transaction.amount.toFixed()
      : "0";

  return doBuildTransactionToSign({
    transaction,
    sender: sender,
    nonce,
    value,
    minGasLimit: networkConfig.MinGasLimit,
    chainID,
  });
};

export const doBuildTransactionToSign = async (options: {
  transaction: Transaction;
  sender: string;
  nonce: INonce;
  value: string;
  minGasLimit: IGasLimit;
  chainID: string;
}): Promise<string> => {
  const gasLimit = options.transaction.gasLimit || options.minGasLimit.valueOf();

  const transaction: MultiversXProtocolTransaction = {
    nonce: options.nonce.valueOf(),
    value: options.value,
    receiver: options.transaction.recipient,
    sender: options.sender,
    gasPrice: GAS_PRICE,
    gasLimit: gasLimit,
    ...(options.transaction.data ? { data: options.transaction.data } : {}),
    chainID: options.chainID,
    version: TRANSACTION_VERSION_DEFAULT,
    options: TRANSACTION_OPTIONS_TX_HASH_SIGN,
  };

  return JSON.stringify(transaction);
};
