import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";
import type { MinaUnsignedTransaction, Transaction } from "./types";
import { MINA_MAINNET_NETWORK_ID, MINA_PAYMENT_TYPE_ID } from "./consts";
import { getAccountNumFromPath } from "./logic";
import invariant from "invariant";

export const buildTransaction = async (
  a: Account,
  t: Transaction,
): Promise<MinaUnsignedTransaction> => {
  try {
    // log("debug", "mina: build transaction", { account: a, transaction: t });
    const accountNum = getAccountNumFromPath(a.freshAddressPath);
    invariant(accountNum !== undefined, "mina: accountNum is required to build transaction");
    return {
      txType: MINA_PAYMENT_TYPE_ID,
      senderAccount: accountNum,
      senderAddress: a.freshAddress,
      receiverAddress: t.recipient,
      amount: t.amount.toNumber(),
      fee: t.fees.toNumber(),
      nonce: t.nonce,
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
