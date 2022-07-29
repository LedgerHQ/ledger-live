import type { ElrondAccount, Transaction } from "./types";
import { getNonce } from "./logic";
import { getNetworkConfig } from "./api";
import { HASH_TRANSACTION } from "./constants";
import BigNumber from "bignumber.js";

/**
 *
 * @param {ElrondAccount} a
 * @param {Transaction} t
 */
export const buildTransaction = async (a: ElrondAccount, t: Transaction) => {
  const address = a.freshAddress;
  const nonce = getNonce(a);
  const { gasPrice, gasLimit, chainId } = await getNetworkConfig();

  const unsigned = {
    nonce,
    value: t.useAllAmount
      ? a.balance.minus(t.fees ? t.fees : new BigNumber(0))
      : t.amount,
    receiver: t.recipient,
    sender: address,
    gasPrice,
    gasLimit,
    chainID: chainId,
    ...HASH_TRANSACTION,
  };
  // Will likely be a call to Elrond SDK
  return JSON.stringify(unsigned);
};
