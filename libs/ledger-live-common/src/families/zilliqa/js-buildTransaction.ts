import type { Transaction, ZilliqaAccount } from "./types";

import { getNonce } from "./logic";
import {
  TxParams,
  Transaction as ZilliqaTransaction,
} from "@zilliqa-js/account";
import { BN, Long } from "@zilliqa-js/util";
import {
  zilliqa,
  VERSION,
  getMinimumGasPrice,
  ZILLIQA_TX_GAS_LIMIT,
} from "./api";
export const buildNativeTransaction = async (
  account: ZilliqaAccount,
  toAddr: string,
  nonce: number,
  amount: BN,
  maybeGasPrice?: BN,
  signature?: string
): Promise<ZilliqaTransaction> => {
  if (!account.zilliqaResources) {
    throw new Error("Zilliqa resources missing on account.");
  }

  const gasPrice = maybeGasPrice || (await getMinimumGasPrice());
  const gasLimit = new Long(ZILLIQA_TX_GAS_LIMIT);

  const params: TxParams = {
    version: VERSION,
    toAddr,
    amount,
    gasPrice,
    gasLimit,
    nonce: nonce,
    pubKey: account.zilliqaResources ? account.zilliqaResources.publicKey : "",
    code: "",
    data: "",
    signature,
  };
  const tx = new ZilliqaTransaction(params, zilliqa.provider);
  return tx;
};

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (a: ZilliqaAccount, t: Transaction) => {
  const tx = await buildNativeTransaction(
    a,
    t.recipient,
    await getNonce(a),
    new BN(t.amount.toString()),
    await getMinimumGasPrice()
  );

  return tx.bytes.toString("hex");
};
