import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import { getAccountNumFromPath } from "../common-logic";
import { MINA_MAINNET_NETWORK_ID, MINA_PAYMENT_TYPE_ID } from "../consts";
import type { MinaUnsignedTransaction, Transaction } from "../types";
import { TxType } from "../types";

export const buildTransaction = async (
  a: Account,
  t: Transaction,
): Promise<MinaUnsignedTransaction> => {
  try {
    const accountNum = getAccountNumFromPath(a.freshAddressPath);
    invariant(accountNum !== undefined, "mina: accountNum is required to build transaction");
    return {
      txType: t.txType === "stake" ? TxType.DELEGATION : TxType.PAYMENT,
      senderAccount: accountNum,
      senderAddress: a.freshAddress,
      receiverAddress: t.recipient,
      amount: t.txType === "stake" ? 0 : t.amount.toNumber(),
      fee: t.fees.fee.toNumber(),
      nonce: BigNumber(t.nonce).toNumber(),
      memo: t.memo ?? "",
      networkId: MINA_MAINNET_NETWORK_ID,
    };
  } catch (e) {
    log("error", "mina: error building transaction", {
      error: e,
      transaction: t,
      account: a,
    });
    throw e;
  }
};
