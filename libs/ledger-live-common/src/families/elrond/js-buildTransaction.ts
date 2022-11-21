import type { ElrondProtocolTransaction, Transaction } from "./types";
import { getAccountNonce, getNetworkConfig } from "./api";
import { GAS_PRICE, HASH_TRANSACTION } from "./constants";
import { Account } from "@ledgerhq/types-live";
import { INetworkConfig } from "@elrondnetwork/erdjs/out";

/**
 *
 * @param {ElrondAccount} account
 * @param {SubAccount | null | undefined} tokenAccount
 * @param {Transaction} transaction
 */
export const buildTransactionToSign = async (
  account: Account,
  transaction: Transaction
): Promise<string> => {
  const address = account.freshAddress;
  const nonce = await getAccountNonce(address);
  const networkConfig: INetworkConfig = await getNetworkConfig();
  const chainID = networkConfig.ChainID.valueOf();

  const unsigned: ElrondProtocolTransaction = {
    nonce: nonce.valueOf(),
    value: transaction.amount.toFixed(),
    receiver: transaction.recipient,
    sender: address,
    gasPrice: GAS_PRICE,
    gasLimit: transaction.gasLimit || networkConfig.MinGasLimit.valueOf(),
    data: transaction.data,
    chainID,
    ...HASH_TRANSACTION,
  };

  // Will likely be a call to Elrond SDK
  return JSON.stringify(unsigned);
};
