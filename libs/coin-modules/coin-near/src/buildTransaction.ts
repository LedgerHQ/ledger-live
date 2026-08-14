import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";
import * as nearAPI from "near-api-js";
import { Transaction as NearApiTransaction } from "near-api-js/lib/transaction";
import { buildActions } from "./logic/actions";
import { getAccessKey } from "./network";
import type { Transaction } from "./types";

export const buildTransaction = async (
  a: Account,
  t: Transaction,
  publicKey: string,
): Promise<NearApiTransaction> => {
  const { nonce, block_hash } = await getAccessKey({
    address: a.freshAddress,
    publicKey,
  });

  const actions = buildActions({
    mode: t.mode,
    amount: t.amount.toFixed(),
    useAllAmount: t.useAllAmount ?? false,
  });

  try {
    const transaction = nearAPI.transactions.createTransaction(
      a.freshAddress,
      nearAPI.utils.PublicKey.fromString(publicKey),
      t.recipient,
      nonce + 1,
      actions,
      nearAPI.utils.serialize.base_decode(block_hash),
    );

    return transaction;
  } catch (e) {
    log("Near", "Error building transaction", {
      error: e,
      transaction: t,
      account: a,
    });
    throw e;
  }
};
