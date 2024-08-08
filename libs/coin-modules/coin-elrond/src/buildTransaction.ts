import { INetworkConfig } from "@elrondnetwork/erdjs/out";
import { Account } from "@ledgerhq/types-live";
import { isAmountSpentFromBalance } from "./logic";
import type { ElrondProtocolTransaction, Transaction } from "./types";
import { getAccountNonce, getNetworkConfig } from "./api";
import { GAS_PRICE, HASH_TRANSACTION } from "./constants";

/**
 *
 * @param {ElrondAccount} account
 * @param {SubAccount | null | undefined} tokenAccount
 * @param {Transaction} transaction
 */
export const buildTransactionToSign = async (
  account: Account,
  transaction: Transaction,
): Promise<string> => {
  const address = account.freshAddress;
  const nonce = await getAccountNonce(address);
  const networkConfig: INetworkConfig = await getNetworkConfig();
  const chainID = networkConfig.ChainID.valueOf();

  const isTokenAccount = account.subAccounts?.some(ta => ta.id === transaction.subAccountId);
  const value =
    !isTokenAccount && isAmountSpentFromBalance(transaction.mode)
      ? transaction.amount.toFixed()
      : "0";

  const unsigned: ElrondProtocolTransaction = {
    nonce: nonce.valueOf(),
    value,
    receiver: transaction.recipient,
    sender: address,
    gasPrice: GAS_PRICE,
    gasLimit: transaction.gasLimit || networkConfig.MinGasLimit.valueOf(),
    chainID,
    ...HASH_TRANSACTION,
  };

  if (transaction.data) {
    unsigned.data = transaction.data;
  }

  // Will likely be a call to Elrond SDK
  return JSON.stringify(unsigned);
};

export const serializeESDTInfo = (
  ticker: string,
  id: string,
  decimals: number,
  chainId: string,
  signature: string,
): Buffer => {
  const tickerLengthBuffer = Buffer.from([ticker.length]);
  const tickerBuffer = Buffer.from(ticker);
  const idLengthBuffer = Buffer.from([id.length]);
  const idBuffer = Buffer.from(id);
  const decimalsBuffer = Buffer.from([decimals]);
  const chainIdLengthBuffer = Buffer.from([chainId.length]);
  const chainIdBuffer = Buffer.from(chainId);
  const signatureBuffer = Buffer.from(signature, "hex");
  const infoBuffer = [
    tickerLengthBuffer,
    tickerBuffer,
    idLengthBuffer,
    idBuffer,
    decimalsBuffer,
    chainIdLengthBuffer,
    chainIdBuffer,
    signatureBuffer,
  ];
  return Buffer.concat(infoBuffer);
};

export const provideESDTInfo = async (
  ticker?: string,
  id?: string,
  decimals?: number,
  chainId?: string,
  signature?: string,
): Promise<any> => {
  if (!ticker || !id || !decimals || !chainId || !signature) {
    throw new Error("Invalid ESDT token credentials!");
  }

  return serializeESDTInfo(ticker, id, decimals, chainId, signature);
};
