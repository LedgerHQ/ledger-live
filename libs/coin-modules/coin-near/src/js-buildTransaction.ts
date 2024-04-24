import { log } from "@ledgerhq/logs";
import * as nearAPI from "near-api-js";
import { Action } from "near-api-js/lib/transaction";
import { Transaction as NearApiTransaction } from "near-api-js/lib/transaction";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { getAccessKey } from "./api";
import { getStakingGas } from "./logic";

export const buildTransaction = async (
  a: Account,
  t: Transaction,
  publicKey: string,
): Promise<NearApiTransaction> => {
  const { nonce, block_hash } = await getAccessKey({
    address: a.freshAddress,
    publicKey,
  });

  const parsedNearAmount = t.amount.toFixed();

  const actions: Action[] = [];

  switch (t.mode) {
    case "stake":
      actions.push(
        nearAPI.transactions.functionCall(
          "deposit_and_stake",
          {},
          getStakingGas().toFixed(),
          parsedNearAmount,
        ),
      );
      break;
    case "unstake":
      if (t.useAllAmount) {
        actions.push(
          nearAPI.transactions.functionCall("unstake_all", {}, getStakingGas().toFixed(), "0"),
        );
      } else {
        actions.push(
          nearAPI.transactions.functionCall(
            "unstake",
            { amount: parsedNearAmount },
            getStakingGas().toFixed(),
            "0",
          ),
        );
      }
      break;
    case "withdraw":
      if (t.useAllAmount) {
        actions.push(
          nearAPI.transactions.functionCall("withdraw_all", {}, getStakingGas(t).toNumber(), "0"),
        );
      } else {
        actions.push(
          nearAPI.transactions.functionCall(
            "withdraw",
            { amount: parsedNearAmount },
            getStakingGas().toFixed(),
            "0",
          ),
        );
      }
      break;
    default:
      actions.push(nearAPI.transactions.transfer(parsedNearAmount));
  }

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
